/*
 * Copyright 2015 IBM Corp.
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

  describe('LBaaS v2 Load Balancer Detail Controller', function() {
    var lbaasv2API, ctrl, $scope, $window;

    function fakeAPI() {
      return {
        success: function(callback) {
          callback({ id: '1234' });
        }
      };
    }

    ///////////////////////

    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {});
    }));

    beforeEach(inject(function($injector) {
      lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(fakeAPI);
      $scope = $injector.get('$rootScope').$new();
      $window = {};
      var controller = $injector.get('$controller');
      ctrl = controller('LoadBalancerDetailController', {
        $scope: $scope,
        $window: $window,
        $routeParams: { loadbalancerId: '1234' }
      });
    }));

    it('should invoke lbaasv2 apis', function() {
      expect(lbaasv2API.getLoadBalancer).toHaveBeenCalledWith('1234', true);
    });

    it('should save changes to listeners tab active state', function() {
      expect($window.listenersTabActive).toBeUndefined();
      expect(ctrl.listenersTabActive).toBeUndefined();
      ctrl.listenersTabActive = true;
      $scope.$apply();
      expect($window.listenersTabActive).toBe(true);
      ctrl.listenersTabActive = false;
      $scope.$apply();
      expect($window.listenersTabActive).toBe(false);
    });

  });

})();
