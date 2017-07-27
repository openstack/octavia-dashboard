/*
 * Copyright 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function() {
  'use strict';

  describe('LBaaS v2 Pool Detail Controller', function() {
    var lbaasv2API, $scope, $window, $controller, apiFail, qAllFail;

    function fakePromise(data, reject) {
      return {
        then: function(success, fail) {
          if (reject) {
            fail();
          } else {
            success({ data: data });
          }
          return fakePromise();
        }
      };
    }

    function fakeAPI() {
      return fakePromise('foo', apiFail);
    }

    function loadbalancerAPI() {
      return fakePromise({ provisioning_status: 'ACTIVE' });
    }

    function qAll() {
      return fakePromise(null, qAllFail);
    }

    function createController() {
      return $controller('PoolDetailController', {
        $scope: $scope,
        $window: $window,
        $routeParams: {
          loadbalancerId: 'loadbalancerId',
          listenerId: 'listenerId',
          poolId: 'poolId'
        }
      });
    }

    ///////////////////////

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      apiFail = false;
      qAllFail = false;

      $provide.value('$q', { all: qAll });
    }));

    beforeEach(inject(function($injector) {
      lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getPool').and.callFake(fakeAPI);
      spyOn(lbaasv2API, 'getListener').and.callFake(fakeAPI);
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      $scope = $injector.get('$rootScope').$new();
      $window = {};
      $controller = $injector.get('$controller');
    }));

    it('should invoke lbaasv2 apis', function() {
      var ctrl = createController();
      expect(lbaasv2API.getPool).toHaveBeenCalledWith('poolId');
      expect(lbaasv2API.getListener).toHaveBeenCalledWith('listenerId');
      expect(lbaasv2API.getLoadBalancer).toHaveBeenCalledWith('loadbalancerId');
      expect(ctrl.loadbalancer).toEqual({provisioning_status: 'ACTIVE'});
      expect(ctrl.listener).toBe('foo');
      expect(ctrl.pool).toBe('foo');
    });

    it('should define mapping for the load balancer algorithm', function() {
      var ctrl = createController();
      expect(ctrl.loadBalancerAlgorithm).toBeDefined();
    });

    it('should save changes to members tab active state', function() {
      var ctrl = createController();
      expect($window.membersTabActive).toBeUndefined();
      expect(ctrl.membersTabActive).toBeUndefined();
      ctrl.membersTabActive = true;
      $scope.$apply();
      expect($window.membersTabActive).toBe(true);
      ctrl.membersTabActive = false;
      $scope.$apply();
      expect($window.membersTabActive).toBe(false);
    });

    it('should throw error on API fail', function() {
      apiFail = true;
      var init = function() {
        createController();
      };
      expect(init).toThrow();
    });

    it('should set error state if any APIs fail', function() {
      qAllFail = true;
      var ctrl = createController();
      expect(ctrl.loading).toBe(false);
      expect(ctrl.error).toBe(true);
    });

  });

})();
