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

  describe('LBaaS v2 Listeners Table Row Actions Service', function() {
    var scope, $route, $q, actions, policy, init;

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
      expect(policy.ifAllowed).toHaveBeenCalledWith({rules: [['neutron', 'update_listener']]});
      return allowed;
    }

    function isActionableMock(id) {
      if (id === 'active') {
        return $q.when();
      } else {
        return $q.reject();
      }
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
      $q = $injector.get('$q');
      $route = $injector.get('$route');
      policy = $injector.get('horizon.app.core.openstack-service-api.policy');
      var rowActionsService = $injector.get(
        'horizon.dashboard.project.lbaasv2.listeners.actions.rowActions');
      actions = rowActionsService.actions();
      init = rowActionsService.init;
      var loadbalancerService = $injector.get(
          'horizon.dashboard.project.lbaasv2.loadbalancers.service');
      spyOn(loadbalancerService, 'isActionable').and.callFake(isActionableMock);
    }));

    it('should define correct table row actions', function() {
      expect(actions.length).toBe(3);
      expect(actions[0].template.text).toBe('Edit');
      expect(actions[1].template.text).toBe('Create Pool');
      expect(actions[2].template.text).toBe('Delete Listener');
    });

    it('should allow editing a listener of an ACTIVE load balancer', function() {
      init('active');
      expect(canEdit({listenerId: '1234'})).toBe(true);
    });

    it('should not allow editing a listener of a non-ACTIVE load balancer', function() {
      init('non-active');
      expect(canEdit({listenerId: '1234'})).toBe(false);
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
