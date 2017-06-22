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

  describe('LBaaS v2 Edit Pool Action Service', function() {
    var scope, $q, $route, policy, init, editPoolService, defer;

    function allowed(item) {
      spyOn(policy, 'ifAllowed').and.returnValue(true);
      var promise = editPoolService.edit.allowed(item);
      var allowed;
      promise.then(function() {
        allowed = true;
      }, function() {
        allowed = false;
      });
      scope.$apply();
      expect(policy.ifAllowed).toHaveBeenCalledWith({rules: [['neutron', 'update_pool']]});
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
          id: '9012'
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
      policy = $injector.get('horizon.app.core.openstack-service-api.policy');
      $route = $injector.get('$route');
      editPoolService = $injector.get(
        'horizon.dashboard.project.lbaasv2.pools.actions.edit');
      init = editPoolService.init;
      defer = $q.defer();
    }));

    it('should define the correct service properties', function() {
      expect(editPoolService.init).toBeDefined();
      expect(editPoolService.edit).toBeDefined();
    });

    it('should have the "allowed" and "perform" functions', function() {
      expect(editPoolService.edit.allowed).toBeDefined();
      expect(editPoolService.edit.perform).toBeDefined();
    });

    it('should allow editing a pool under an ACTIVE load balancer', function() {
      defer.resolve();
      init(defer.promise);
      expect(allowed({default_pool_id: '1234'})).toBe(true);
    });

    it('should not allow editing a pool under an NON-ACTIVE load balancer', function() {
      defer.reject();
      init(defer.promise);
      expect(allowed({default_pool_id: '1234'})).toBe(false);
    });

    it('should redirect after edit', function() {
      spyOn($route, 'reload').and.callThrough();
      editPoolService.edit.perform();
      expect($route.reload).toHaveBeenCalled();
    });

  });
})();
