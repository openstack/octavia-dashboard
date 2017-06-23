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

  describe('LBaaS v2 Load Balancers Table Batch Actions Service', function() {
    var $location, actions, policy;

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
      $location = $injector.get('$location');
      policy = $injector.get('horizon.app.core.openstack-service-api.policy');
      var batchActionsService = $injector.get(
        'horizon.dashboard.project.lbaasv2.loadbalancers.actions.batchActions');
      actions = batchActionsService.actions();
    }));

    it('should define correct table batch actions', function() {
      expect(actions.length).toBe(2);
      expect(actions[0].template.text).toBe('Create Load Balancer');
      expect(actions[1].template.text).toBe('Delete Load Balancers');
    });

    it('should have the "allowed" and "perform" functions', function() {
      actions.forEach(function(action) {
        expect(action.service.allowed).toBeDefined();
        expect(action.service.perform).toBeDefined();
      });
    });

    it('should check policy to allow creating a load balancer', function() {
      spyOn(policy, 'ifAllowed').and.returnValue(true);
      var allowed = actions[0].service.allowed();
      expect(allowed).toBe(true);
      expect(policy.ifAllowed).toHaveBeenCalledWith({rules: [['neutron', 'create_loadbalancer']]});
    });

    it('should redirect after create', function() {
      spyOn($location, 'path').and.callThrough();
      actions[0].service.perform();
      expect($location.path).toHaveBeenCalledWith('project/ngloadbalancersv2/1');
    });

  });
})();
