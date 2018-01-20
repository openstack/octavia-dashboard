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
(function() {
  'use strict';

  describe('LBaaS v2 Load Balancers Table Disassociate IP Service', function() {
    var service, policy, modal, network, $scope, $route, item;

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
        {rules: [['neutron', 'loadbalancer_disassociate_floating_ip']]});
      return allowed;
    }

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(function() {
      item = { id: '1', name: 'First', floating_ip: { id: 'ip1', ip: '1' } };
    });

    beforeEach(module(function($provide) {
      var fakePromise = {
        then: function(func) {
          func();
        }
      };
      $provide.value('$uibModal', {
        open: function() {
          return {
            result: fakePromise
          };
        }
      });
      $provide.value('horizon.app.core.openstack-service-api.network', {
        disassociateFloatingIp: function() {
          return fakePromise;
        }
      });
    }));

    beforeEach(inject(function ($injector) {
      policy = $injector.get('horizon.app.core.openstack-service-api.policy');
      network = $injector.get('horizon.app.core.openstack-service-api.network');
      modal = $injector.get('horizon.framework.widgets.modal.deleteModalService');
      $scope = $injector.get('$rootScope').$new();
      $route = $injector.get('$route');
      service = $injector.get(
        'horizon.dashboard.project.lbaasv2.loadbalancers.actions.disassociate-ip');
    }));

    it('should have the "allowed" and "perform" functions', function() {
      expect(service.allowed).toBeDefined();
      expect(service.perform).toBeDefined();
    });

    it('should check policy to allow action', function() {
      expect(allowed(item)).toBe(true);
    });

    it('should not allow action if floating IP not associated', function() {
      delete item.floating_ip.ip;
      expect(allowed(item)).toBe(false);
    });

    it('should open the delete modal', function() {
      spyOn(modal, 'open');
      service.perform(item);
      $scope.$apply();
      expect(modal.open.calls.count()).toBe(1);
      var args = modal.open.calls.argsFor(0);
      expect(args.length).toBe(3);
      expect(args[0]).toEqual({ $emit: jasmine.any(Function) });
      expect(args[1]).toEqual([jasmine.objectContaining({ id: '1' })]);
      expect(args[2]).toEqual(jasmine.objectContaining({
        labels: jasmine.any(Object),
        deleteEntity: jasmine.any(Function)
      }));
      expect(args[2].labels.title).toBe('Confirm Disassociate Floating IP Address');
    });

    it('should pass function to modal that disassociates the IP address', function() {
      spyOn(modal, 'open').and.callThrough();
      spyOn(network, 'disassociateFloatingIp').and.callThrough();
      service.perform(item);
      $scope.$apply();
      expect(network.disassociateFloatingIp.calls.count()).toBe(1);
      expect(network.disassociateFloatingIp).toHaveBeenCalledWith('ip1');
    });

    it('should reload page after action completes', function() {
      spyOn($route, 'reload');
      service.perform(item);
      $scope.$apply();
      expect($route.reload).toHaveBeenCalled();
    });

  });
})();
