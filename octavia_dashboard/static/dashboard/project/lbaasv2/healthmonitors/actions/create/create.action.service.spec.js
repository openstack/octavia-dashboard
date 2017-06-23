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

  describe('LBaaS v2 Create Health Monitor Action Service', function() {
    var scope, $q, $location, policy, init, service, loadBalancerState;

    function allowed(item) {
      spyOn(policy, 'ifAllowed').and.returnValue(true);
      var promise = service.create.allowed(item);
      var allowed;
      promise.then(function() {
        allowed = true;
      }, function() {
        allowed = false;
      });
      scope.$apply();
      expect(policy.ifAllowed).toHaveBeenCalledWith(
        {rules: [['neutron', 'create_health_monitor']]});
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
      $location = $injector.get('$location');
      service = $injector.get('horizon.dashboard.project.lbaasv2.healthmonitors.actions.create');
      init = service.init;
      loadBalancerState = $q.defer();
    }));

    it('should define the correct service properties', function() {
      expect(service.init).toBeDefined();
      expect(service.create).toBeDefined();
    });

    it('should have the "allowed" and "perform" functions', function() {
      expect(service.create.allowed).toBeDefined();
      expect(service.create.perform).toBeDefined();
    });

    it('should allow creating a health monitor under an ACTIVE load balancer', function() {
      loadBalancerState.resolve();
      init('active', '1', loadBalancerState.promise);
      expect(allowed({})).toBe(true);
    });

    it('should not allow creating a health monitor under a NON-ACTIVE load balancer', function() {
      loadBalancerState.reject();
      init('non-active', '1', loadBalancerState.promise);
      expect(allowed({})).toBe(false);
    });

    it('should not allow creating a health monitor if one already exists', function() {
      loadBalancerState.resolve();
      init('active', '1', loadBalancerState.promise);
      expect(allowed({ healthmonitor_id: '1234' })).toBe(false);
    });

    it('should redirect after create', function() {
      loadBalancerState.resolve();
      spyOn($location, 'path').and.callThrough();
      init('loadbalancer1', 'listener1', loadBalancerState.promise).create.allowed({id: 'pool1'});
      service.create.perform();
      expect($location.path).toHaveBeenCalledWith(
        'project/ngloadbalancersv2/loadbalancer1/listeners/listener1/pools/pool1/' +
        'healthmonitors/healthmonitor1');
    });

  });
})();
