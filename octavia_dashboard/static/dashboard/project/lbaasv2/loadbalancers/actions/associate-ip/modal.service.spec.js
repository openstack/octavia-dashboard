/*
 * Copyright 2016 IBM Corp.
 * Copyright 2017 Walmart.
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
(function () {
  'use strict';

  describe('LBaaS v2 Load Balancers Table Associate IP Service', function() {
    var service, policy, $scope, $route, item, $uibModal, toast;

    function allowed(item) {
      spyOn(policy, 'ifAllowed').and.returnValue(true);
      var promise = service.allowed(item);
      var allowed;
      promise.then(function() {
        allowed = true;
      }, function() {
        allowed = false;
      });
      $scope.$apply();
      expect(policy.ifAllowed).toHaveBeenCalledWith(
        {rules: [['neutron', 'loadbalancer_associate_floating_ip']]});
      return allowed;
    }

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(function() {
      item = { id: '1', name: 'First', floating_ip: {} };
    });

    beforeEach(module(function($provide) {
      var fakePromise = function(response) {
        return {
          then: function(func) {
            return func(response);
          }
        };
      };
      $provide.value('$uibModal', {
        open: function() {
          return {
            result: fakePromise()
          };
        }
      });
      $provide.value('horizon.app.core.openstack-service-api.network', {
        getFloatingIps: function() {
          return fakePromise({ data: { items: 'foo' } });
        },
        getFloatingIpPools: function() {
          return fakePromise({ data: { items: 'bar' } });
        }
      });
    }));

    beforeEach(inject(function ($injector) {
      policy = $injector.get('horizon.app.core.openstack-service-api.policy');
      toast = $injector.get('horizon.framework.widgets.toast.service');
      $scope = $injector.get('$rootScope').$new();
      $route = $injector.get('$route');
      $uibModal = $injector.get('$uibModal');
      service = $injector.get(
        'horizon.dashboard.project.lbaasv2.loadbalancers.actions.associate-ip');
    }));

    it('should have the "allowed" and "perform" functions', function() {
      expect(service.allowed).toBeDefined();
      expect(service.perform).toBeDefined();
    });

    it('should check policy to allow the action', function() {
      expect(allowed(item)).toBe(true);
    });

    it('should not allow action if floating IP already associated', function() {
      item.floating_ip.ip = 'foo';
      expect(allowed(item)).toBe(false);
    });

    it('should open the modal', function() {
      spyOn($uibModal, 'open').and.callThrough();
      service.perform(item);
      $scope.$apply();
      expect($uibModal.open.calls.count()).toBe(1);
    });

    it('should resolve data for passing into the modal', function() {
      spyOn($uibModal, 'open').and.callThrough();
      service.perform(item);
      $scope.$apply();

      var resolve = $uibModal.open.calls.argsFor(0)[0].resolve;
      expect(resolve).toBeDefined();
      expect(resolve.loadbalancer).toBeDefined();
      expect(resolve.loadbalancer()).toEqual(item);
      expect(resolve.floatingIps).toBeDefined();
      expect(resolve.floatingIps()).toBe('foo');
      expect(resolve.floatingIpPools).toBeDefined();
      expect(resolve.floatingIpPools()).toBe('bar');
    });

    it('should show message and reload page upon closing modal', function() {
      spyOn(toast, 'add');
      spyOn($route, 'reload');
      service.perform(item);
      $scope.$apply();
      expect(toast.add).toHaveBeenCalledWith('success',
        'Associating floating IP with load balancer.');
      expect($route.reload).toHaveBeenCalled();
    });

  });

})();
