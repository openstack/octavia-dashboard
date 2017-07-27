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

  describe('LBaaS v2 Member Detail Controller', function() {
    var $controller, lbaasv2API, membersService, apiFail, qAllFail, actions;

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
      return $controller('MemberDetailController', {
        $routeParams: {
          loadbalancerId: 'loadbalancerId',
          listenerId: 'listenerId',
          poolId: 'poolId',
          memberId: 'memberId'
        }
      });
    }

    ///////////////////////

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.widgets.toast'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      apiFail = false;
      qAllFail = false;

      $provide.value('$q', { all: qAll });
      $provide.value('$uibModal', {});
      $provide.value('horizon.dashboard.project.lbaasv2.members.actions.rowActions', {
        init: function() {
          return {
            actions: 'member-actions'
          };
        }
      });
    }));

    beforeEach(inject(function($injector) {
      lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      actions = $injector.get('horizon.dashboard.project.lbaasv2.members.actions.rowActions');
      membersService = $injector.get('horizon.dashboard.project.lbaasv2.members.service');
      spyOn(lbaasv2API, 'getMember').and.callFake(fakeAPI);
      spyOn(lbaasv2API, 'getPool').and.callFake(fakeAPI);
      spyOn(lbaasv2API, 'getListener').and.callFake(fakeAPI);
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(actions, 'init').and.callThrough();
      spyOn(membersService, 'associateMemberStatuses');
      $controller = $injector.get('$controller');
    }));

    it('should invoke lbaasv2 apis', function() {
      var ctrl = createController();
      expect(lbaasv2API.getMember).toHaveBeenCalledWith('poolId','memberId');
      expect(lbaasv2API.getPool).toHaveBeenCalledWith('poolId');
      expect(lbaasv2API.getListener).toHaveBeenCalledWith('listenerId');
      expect(lbaasv2API.getLoadBalancer).toHaveBeenCalledWith('loadbalancerId');
      expect(ctrl.loadbalancerId).toBeDefined();
      expect(ctrl.listenerId).toBeDefined();
      expect(ctrl.poolId).toBeDefined();
      expect(ctrl.operatingStatus).toBeDefined();
      expect(ctrl.provisioningStatus).toBeDefined();
      expect(ctrl.actions).toBe('member-actions');
      expect(actions.init).toHaveBeenCalledWith('loadbalancerId', 'poolId');
    });

    it('should invoke the "associateMemberStatuses" method', function() {
      var ctrl = createController();
      expect(membersService.associateMemberStatuses).toHaveBeenCalledWith(
          ctrl.loadbalancerId, ctrl.listenerId, ctrl.poolId, [ctrl.member]);
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
