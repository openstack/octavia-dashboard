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

  describe('LBaaS v2 Health Monitor Delete Service', function() {
    var service, policy, modal, lbaasv2Api, $scope, $location, $q, toast, monitor;

    function allowed(item) {
      spyOn(policy, 'ifAllowed').and.returnValue(makePromise());
      var promise = service.allowed(item);
      var allowed;
      promise.then(function() {
        allowed = true;
      }, function() {
        allowed = false;
      });
      $scope.$apply();
      expect(policy.ifAllowed)
        .toHaveBeenCalledWith({rules: [['neutron', 'delete_health_monitor']]});
      return allowed;
    }

    function makePromise(reject) {
      var def = $q.defer();
      def[reject ? 'reject' : 'resolve']();
      return def.promise;
    }

    function isActionable(id) {
      if (id === 'active') {
        return $q.when();
      } else {
        return $q.reject();
      }
    }

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(function() {
      monitor = { id: '1', name: 'HealthMonitor1' };
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
        deleteHealthMonitor: function() {
          return makePromise();
        }
      });
      $provide.value('$location', {
        path: function() {
          return '';
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
      service = $injector.get('horizon.dashboard.project.lbaasv2.healthmonitors.actions.delete');
      service.init('1', '2', '3', isActionable('active'));
      $scope.$apply();
    }));

    it('should have the "allowed" and "perform" functions', function() {
      expect(service.allowed).toBeDefined();
      expect(service.perform).toBeDefined();
    });

    it('should allow deleting health monitor from load balancer in ACTIVE state', function() {
      expect(allowed()).toBe(true);
    });

    it('should not allow deleting health monitor from load balancer in PENDING state', function() {
      service.init('1', '2', '3', isActionable('pending'));
      expect(allowed()).toBe(false);
    });

    it('should open the delete modal', function() {
      spyOn(modal, 'open');
      service.perform(monitor);
      $scope.$apply();
      expect(modal.open.calls.count()).toBe(1);
      var args = modal.open.calls.argsFor(0);
      expect(args.length).toBe(3);
      expect(args[0]).toEqual({ $emit: jasmine.any(Function) });
      expect(args[1]).toEqual([monitor]);
      expect(args[2]).toEqual(jasmine.objectContaining({
        labels: jasmine.any(Object),
        deleteEntity: jasmine.any(Function)
      }));
      expect(args[2].labels.title).toBe('Confirm Delete Health Monitor');
    });

    it('should pass function to modal that deletes the health monitor', function() {
      spyOn(modal, 'open').and.callThrough();
      spyOn(lbaasv2Api, 'deleteHealthMonitor').and.callThrough();
      service.perform(monitor);
      $scope.$apply();
      expect(lbaasv2Api.deleteHealthMonitor.calls.count()).toBe(1);
      expect(lbaasv2Api.deleteHealthMonitor).toHaveBeenCalledWith('1', true);
    });

    it('should show message if any items fail to be deleted', function() {
      spyOn(modal, 'open').and.callThrough();
      spyOn(lbaasv2Api, 'deleteHealthMonitor').and.returnValue(makePromise(true));
      spyOn(toast, 'add');
      service.perform(monitor);
      $scope.$apply();
      expect(modal.open).toHaveBeenCalled();
      expect(lbaasv2Api.deleteHealthMonitor.calls.count()).toBe(1);
      expect(toast.add).toHaveBeenCalledWith('error', 'The following health monitor could not ' +
        'be deleted: HealthMonitor1.');
    });

    it('should return to pool details after delete', function() {
      var path = 'project/ngloadbalancersv2/1/listeners/2/pools/3';
      spyOn($location, 'path');
      spyOn(toast, 'add');
      service.perform(monitor);
      $scope.$apply();
      expect($location.path).toHaveBeenCalledWith(path);
      expect(toast.add).toHaveBeenCalledWith('success', 'Deleted health monitor: HealthMonitor1.');
    });

  });
})();
