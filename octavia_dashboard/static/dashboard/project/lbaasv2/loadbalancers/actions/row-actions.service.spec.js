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

  describe('LBaaS v2 Load Balancers Table Row Actions Service', function() {
    var rowActionsService, scope, $route, actions, policy;

    function canEdit(item) {
      spyOn(policy, 'ifAllowed').and.returnValue(true);
      var promise = actions[0].service.allowed(item);
      var allowed;
      promise.then(function() {
        allowed = true;
      }, function() {
        allowed = false;
      });
      scope.$apply();
      expect(policy.ifAllowed).toHaveBeenCalledWith({rules: [['neutron', 'update_loadbalancer']]});
      return allowed;
    }

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      var response = {
        data: {
          id: '1'
        }
      };
      var modal = {
        open: function() {
          return {
            result: {
              then: function(func) {
                func(response);
              }
            }
          };
        }
      };
      $provide.value('$uibModal', modal);
    }));

    beforeEach(inject(function ($injector) {
      scope = $injector.get('$rootScope').$new();
      $route = $injector.get('$route');
      policy = $injector.get('horizon.app.core.openstack-service-api.policy');
      rowActionsService = $injector.get(
        'horizon.dashboard.project.lbaasv2.loadbalancers.actions.rowActions');
      actions = rowActionsService.actions();
    }));

    it('should define correct table row actions', function() {
      expect(actions.length).toBe(4);
      expect(actions[0].template.text).toBe('Edit');
      expect(actions[1].template.text).toBe('Associate Floating IP');
      expect(actions[2].template.text).toBe('Disassociate Floating IP');
      expect(actions[3].template.text).toBe('Delete Load Balancer');
    });

    it('should allow editing an ACTIVE load balancer', function() {
      expect(canEdit({provisioning_status: 'ACTIVE'})).toBe(true);
    });

    it('should not allow editing a non-ACTIVE load balancer', function() {
      expect(canEdit({provisioning_status: 'PENDING_UPDATE'})).toBe(false);
    });

    it('should have the "allowed" and "perform" functions', function() {
      actions.forEach(function(action) {
        expect(action.service.allowed).toBeDefined();
        expect(action.service.perform).toBeDefined();
      });
    });

    it('should reload table after edit', function() {
      spyOn($route, 'reload').and.callThrough();
      actions[0].service.perform();
      expect($route.reload).toHaveBeenCalled();
    });

  });
})();
