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

  describe('LBaaS v2 Load Balancers Table Row Delete Service', function() {
    var service, policy, modal, lbaasv2Api, $scope, $route, $location, $q, toast, items, path;

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
      expect(policy.ifAllowed).toHaveBeenCalledWith({rules: [['neutron', 'delete_loadbalancer']]});
      return allowed;
    }

    function makePromise(reject) {
      var def = $q.defer();
      def[reject ? 'reject' : 'resolve']();
      return def.promise;
    }

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
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
      $route = $injector.get('$route');
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

    it('should not allow deleting load balancers if state check fails (single)', function() {
      items[0].provisioning_status = 'PENDING_UPDATE';
      expect(allowed(items[0])).toBe(false);
    });

    it('should allow batch delete even if state check fails (batch)', function() {
      items[0].provisioning_status = 'PENDING_UPDATE';
      expect(allowed()).toBe(true);
    });

    it('should open the delete modal', function() {
      spyOn(modal, 'open');
      service.perform(items[0]);
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
      expect(args[2].labels.title).toBe('Confirm Delete Load Balancers');
    });

    it('should pass function to modal that deletes load balancers', function() {
      spyOn(modal, 'open').and.callThrough();
      spyOn(lbaasv2Api, 'deleteLoadBalancer').and.callThrough();
      service.perform(items[0]);
      $scope.$apply();
      expect(lbaasv2Api.deleteLoadBalancer.calls.count()).toBe(1);
      expect(lbaasv2Api.deleteLoadBalancer).toHaveBeenCalledWith('1', true);
    });

    it('should show message if any selected items do not allow for delete (batch)', function() {
      spyOn(modal, 'open');
      spyOn(toast, 'add');
      items[0].provisioning_status = 'PENDING_UPDATE';
      items[1].provisioning_status = 'PENDING_DELETE';
      service.perform(items);
      $scope.$apply();
      expect(modal.open).not.toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith('error',
        'The following load balancers are pending and cannot be deleted: First, Second.');
    });

    it('should show message if any items fail to be deleted', function() {
      spyOn(modal, 'open').and.callThrough();
      spyOn(lbaasv2Api, 'deleteLoadBalancer').and.returnValue(makePromise(true));
      spyOn(toast, 'add');
      items.splice(1, 1);
      service.perform(items);
      $scope.$apply();
      expect(modal.open).toHaveBeenCalled();
      expect(lbaasv2Api.deleteLoadBalancer.calls.count()).toBe(1);
      expect(toast.add).toHaveBeenCalledWith('error', 'The following load balancers could not ' +
        'be deleted, possibly due to existing listeners: First.');
    });

    it('should reload table after delete', function() {
      path = 'project/ngloadbalancersv2';
      spyOn($route, 'reload');
      service.perform(items);
      $scope.$apply();
      expect($route.reload).toHaveBeenCalled();
    });

    it('should return to table after delete if on detail page', function() {
      path = 'project/ngloadbalancersv2/1';
      spyOn($location, 'path');
      spyOn(toast, 'add');
      service.perform(items[0]);
      $scope.$apply();
      expect($location.path).toHaveBeenCalledWith('project/ngloadbalancersv2');
      expect(toast.add).toHaveBeenCalledWith('success', 'Deleted load balancers: First.');
    });

  });
})();
