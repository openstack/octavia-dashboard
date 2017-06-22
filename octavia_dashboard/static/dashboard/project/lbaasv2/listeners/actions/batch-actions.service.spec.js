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

  describe('LBaaS v2 Listeners Table Batch Actions Service', function() {
    var $location, actions, policy, $scope, $q;

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      var response = {
        data: {
          id: '5678'
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
      $provide.value('horizon.dashboard.project.lbaasv2.loadbalancers.service', {
        isActionable: function() {
          return $q.when();
        }
      });
      $provide.value('horizon.app.core.openstack-service-api.policy', {
        ifAllowed: function() {
          return $q.when();
        }
      });
    }));

    beforeEach(inject(function ($injector) {
      $location = $injector.get('$location');
      $scope = $injector.get('$rootScope').$new();
      $q = $injector.get('$q');
      policy = $injector.get('horizon.app.core.openstack-service-api.policy');
      var batchActionsService = $injector.get(
        'horizon.dashboard.project.lbaasv2.listeners.actions.batchActions');
      actions = batchActionsService.init('1234').actions();
      $scope.$apply();
    }));

    it('should define correct table batch actions', function() {
      expect(actions.length).toBe(2);
      expect(actions[0].template.text).toBe('Create Listener');
      expect(actions[1].template.text).toBe('Delete Listeners');
    });

    it('should have the "allowed" and "perform" functions', function() {
      actions.forEach(function(action) {
        expect(action.service.allowed).toBeDefined();
        expect(action.service.perform).toBeDefined();
      });
    });

    it('should check policy to allow creating a listener', function() {
      spyOn(policy, 'ifAllowed').and.callThrough();

      var promise = actions[0].service.allowed();
      var allowed;
      promise.then(function() {
        allowed = true;
      }, function() {
        allowed = false;
      });
      $scope.$apply();

      expect(allowed).toBe(true);
      expect(policy.ifAllowed).toHaveBeenCalledWith({rules: [['neutron', 'create_listener']]});
    });

    it('should redirect after create', function() {
      spyOn($location, 'path').and.callThrough();
      actions[0].service.perform();
      expect($location.path).toHaveBeenCalledWith('project/ngloadbalancersv2/1234/listeners/5678');
    });

  });
})();
