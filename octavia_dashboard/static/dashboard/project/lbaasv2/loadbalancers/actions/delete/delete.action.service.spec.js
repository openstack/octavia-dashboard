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

  describe('LBaaS v2 Load Balancers Table Row Delete Service', function() {
    var service, policy, modal, lbaasv2Api, $scope, $location, $q, toast, items, path;

    function allowed(item) {
      spyOn(policy, 'ifAllowed').and.returnValue(true);
      var allowed = service.allowed(item);
      $scope.$apply();
      expect(policy.ifAllowed).toHaveBeenCalledWith(
        {
          rules: [[
            'load-balancer', 'os_load-balancer_api:loadbalancer:delete'
          ]]
        }
      );
      return allowed;
    }

    function makePromise(reject) {
      var def = $q.defer();
      def[reject ? 'reject' : 'resolve']();
      return def.promise;
    }

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(function() {
      items = [{ id: '1', name: 'First', provisioning_status: 'ACTIVE' },
               { id: '2', name: 'Second', provisioning_status: 'ACTIVE' }];
    });

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {
        open: function() {
          return {
            result: makePromise()
          };
        }
      });
      $provide.value('horizon.app.core.openstack-service-api.lbaasv2', {
        deleteLoadBalancer: function() {
          return makePromise();
        }
      });
      $provide.value('$location', {
        path: function() {
          return path;
        }
      });
    }));

    beforeEach(inject(function ($injector) {
      policy = $injector.get('horizon.app.core.openstack-service-api.policy');
      lbaasv2Api = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      modal = $injector.get('horizon.framework.widgets.modal.deleteModalService');
      $scope = $injector.get('$rootScope').$new();
      $location = $injector.get('$location');
      $q = $injector.get('$q');
      toast = $injector.get('horizon.framework.widgets.toast.service');
      service = $injector.get('horizon.dashboard.project.lbaasv2.loadbalancers.actions.delete');
    }));

    it('should have the "allowed" and "perform" functions', function() {
      expect(service.allowed).toBeDefined();
      expect(service.perform).toBeDefined();
    });

    it('should check policy to allow deleting a load balancer (single)', function() {
      expect(allowed(items[0])).toBe(true);
    });

    it('should check policy to allow deleting a load balancer (batch)', function() {
      expect(allowed()).toBe(true);
    });

    it('should open the delete modal', function() {
      spyOn(modal, 'open').and.callThrough();
      service.perform(items[0], $scope);
      $scope.$apply();
      expect(modal.open.calls.count()).toBe(1);
      var args = modal.open.calls.argsFor(0);
      expect(args.length).toBe(3);
      expect(args[0]).toEqual($scope);
      expect(args[1]).toEqual([jasmine.objectContaining({ id: '1' })]);
      expect(args[2]).toEqual(jasmine.objectContaining({
        labels: jasmine.any(Object),
        deleteEntity: jasmine.any(Function)
      }));
      expect(args[2].labels.title).toBe('Confirm Delete Load Balancer');
    });

    it('should pass function to modal that deletes load balancers', function() {
      spyOn(modal, 'open').and.callThrough();
      spyOn(lbaasv2Api, 'deleteLoadBalancer').and.callThrough();
      service.perform(items[0], $scope);
      $scope.$apply();
      expect(lbaasv2Api.deleteLoadBalancer.calls.count()).toBe(1);
      expect(lbaasv2Api.deleteLoadBalancer).toHaveBeenCalledWith('1', true);
    });

    it('should show message if any selected items do not allow for delete (batch)', function() {
      spyOn(modal, 'open');
      spyOn(toast, 'add');
      items[0].provisioning_status = 'PENDING_UPDATE';
      items[1].provisioning_status = 'PENDING_DELETE';
      service.perform(items, $scope);
      $scope.$apply();
      expect(modal.open).not.toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith('error',
        'Unable to delete Load Balancers: First, Second.');
    });

    it('should show message if any items fail to be deleted', function() {
      spyOn(modal, 'open').and.callThrough();
      spyOn(lbaasv2Api, 'deleteLoadBalancer').and.returnValue(makePromise(true));
      spyOn(toast, 'add');
      items.splice(1, 1);
      service.perform(items, $scope);
      $scope.$apply();
      expect(modal.open).toHaveBeenCalled();
      expect(lbaasv2Api.deleteLoadBalancer.calls.count()).toBe(1);
      expect(toast.add).toHaveBeenCalledWith('error', 'Unable to delete Load Balancer' +
        ': First.');
    });

    it('should return to panel after delete if on detail page', function() {
      path = 'project/load_balancer/1';
      spyOn($location, 'path');
      spyOn(toast, 'add');
      service.perform(items[0], $scope);
      $scope.$apply();
      expect($location.path).toHaveBeenCalledWith('project/load_balancer');
      expect(toast.add).toHaveBeenCalledWith('success', 'Deleted Load Balancer: First.');
    });

  });
})();
