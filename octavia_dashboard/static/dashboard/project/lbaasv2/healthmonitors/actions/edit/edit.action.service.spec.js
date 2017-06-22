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

  describe('LBaaS v2 Edit Health Monitor Action Service', function() {
    var scope, $q, $route, policy, init, service, loadBalancerState;

    function allowed(item) {
      spyOn(policy, 'ifAllowed').and.returnValue(true);
      var promise = service.edit.allowed(item);
      var allowed;
      promise.then(function() {
        allowed = true;
      }, function() {
        allowed = false;
      });
      scope.$apply();
      expect(policy.ifAllowed).toHaveBeenCalledWith(
        {rules: [['neutron', 'update_health_monitor']]});
      return allowed;
    }

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {
        open: function() {
          return {
            result: {
              then: function(func) {
                func({ data: { id: 'healthmonitor1' } });
              }
            }
          };
        }
      });
    }));

    beforeEach(inject(function ($injector) {
      scope = $injector.get('$rootScope').$new();
      $q = $injector.get('$q');
      policy = $injector.get('horizon.app.core.openstack-service-api.policy');
      $route = $injector.get('$route');
      service = $injector.get('horizon.dashboard.project.lbaasv2.healthmonitors.actions.edit');
      init = service.init;
      loadBalancerState = $q.defer();
    }));

    it('should define the correct service properties', function() {
      expect(service.init).toBeDefined();
      expect(service.edit).toBeDefined();
    });

    it('should have the "allowed" and "perform" functions', function() {
      expect(service.edit.allowed).toBeDefined();
      expect(service.edit.perform).toBeDefined();
    });

    it('should allow edit a health monitor under an ACTIVE load balancer', function() {
      loadBalancerState.resolve();
      init(loadBalancerState.promise);
      expect(allowed({})).toBe(true);
    });

    it('should not allow editing a health monitor under a NON-ACTIVE load balancer', function() {
      loadBalancerState.reject();
      init(loadBalancerState.promise);
      expect(allowed({})).toBe(false);
    });

    it('should reload page after edit', function() {
      loadBalancerState.resolve();
      spyOn($route, 'reload');
      init(loadBalancerState.promise).edit.allowed({});
      service.edit.perform();
      expect($route.reload).toHaveBeenCalled();
    });

  });
})();
