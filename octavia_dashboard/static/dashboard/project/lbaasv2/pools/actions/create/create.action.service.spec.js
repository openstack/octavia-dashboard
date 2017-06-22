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

  describe('LBaaS v2 Create Pool Action Service', function() {
    var scope, $q, $location, policy, init, createPoolService, defer;

    function allowed(item) {
      spyOn(policy, 'ifAllowed').and.returnValue(true);
      var promise = createPoolService.create.allowed(item);
      var allowed;
      promise.then(function() {
        allowed = true;
      }, function() {
        allowed = false;
      });
      scope.$apply();
      expect(policy.ifAllowed).toHaveBeenCalledWith({rules: [['neutron', 'create_pool']]});
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
      $location = $injector.get('$location');
      createPoolService = $injector.get(
        'horizon.dashboard.project.lbaasv2.pools.actions.create');
      init = createPoolService.init;
      defer = $q.defer();
    }));

    it('should define the correct service properties', function() {
      expect(createPoolService.init).toBeDefined();
      expect(createPoolService.create).toBeDefined();
    });

    it('should have the "allowed" and "perform" functions', function() {
      expect(createPoolService.create.allowed).toBeDefined();
      expect(createPoolService.create.perform).toBeDefined();
    });

    it('should allow creating a pool under an ACTIVE load balancer', function() {
      defer.resolve();
      init('active', defer.promise);
      expect(allowed({default_pool_id: ''})).toBe(true);
    });

    it('should not allow creating a pool under an NON-ACTIVE load balancer', function() {
      defer.reject();
      init('non-active', defer.promise);
      expect(allowed({default_pool_id: ''})).toBe(false);
    });

    it('should not allow creating a pool if a listener pool already exists', function() {
      defer.resolve();
      init('active', defer.promise);
      expect(allowed({default_pool_id: '1234'})).toBe(false);
    });

    it('should redirect after create', function() {
      defer.resolve();
      spyOn($location, 'path').and.callThrough();
      init('1234', defer.promise).create.allowed({id: '5678'});
      createPoolService.create.perform();
      expect($location.path).toHaveBeenCalledWith(
          'project/ngloadbalancersv2/1234/listeners/5678/pools/9012');
    });

  });
})();
