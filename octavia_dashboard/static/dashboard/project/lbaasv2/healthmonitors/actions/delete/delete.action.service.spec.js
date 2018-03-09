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

  describe('LBaaS v2 Health Monitor Delete Service', function() {
    beforeEach(module('horizon.app.core'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));
    beforeEach(module('horizon.framework'));

    var deleteModalService, service, lbaasv2API, policyAPI, $location;

    beforeEach(inject(function($injector) {
      service = $injector.get('horizon.dashboard.project.lbaasv2.healthmonitors.actions.delete');
      lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      deleteModalService = $injector.get('horizon.framework.widgets.modal.deleteModalService');
      policyAPI = $injector.get('horizon.app.core.openstack-service-api.policy');
      $location = $injector.get('$location');
    }));

    describe('perform method', function() {
      beforeEach(function () {
        // just need for this to return something that looks like a promise but does nothing
        spyOn(deleteModalService, 'open').and.returnValue({then: angular.noop});
      });

      it('should open the modal with correct label', function () {
        service.perform({name: 'spam'});
        var labels = deleteModalService.open.calls.argsFor(0)[2].labels;
        expect(deleteModalService.open).toHaveBeenCalled();
        angular.forEach(labels, function eachLabel(label) {
          expect(label.toLowerCase()).toContain('health monitor');
        });
      });

      it('should open the delete modal with correct entities', function () {
        service.perform([{name: 'one'}, {name: 'two'}]);
        var entities = deleteModalService.open.calls.argsFor(0)[1];
        expect(deleteModalService.open).toHaveBeenCalled();
        expect(entities.length).toEqual(2);
      });

      it('should pass in a function that deletes a health monitor', function () {
        spyOn(lbaasv2API, 'deleteHealthMonitor').and.callFake(angular.noop);
        service.perform({id: 1, name: 'one'});
        var contextArg = deleteModalService.open.calls.argsFor(0)[2];
        var deleteFunction = contextArg.deleteEntity;
        deleteFunction(1);
        expect(lbaasv2API.deleteHealthMonitor).toHaveBeenCalledWith(1, true);
      });
    });

    it('should handle the action result properly with listener', function() {
      spyOn($location, 'path');
      spyOn(deleteModalService, 'open').and.returnValue({then: angular.noop});
      spyOn(lbaasv2API, 'deleteHealthMonitor').and.callFake(angular.noop);
      service.perform({loadbalancerId: 1, listenerId: 2, poolId: 3, id: 1, name: 'one'});
      var result = service.deleteResult({
        fail: [],
        pass: [{
          context: {
            id: 1
          }
        }]
      });
      var path = 'project/load_balancer/1/listeners/2/pools/3';
      expect($location.path).toHaveBeenCalledWith(path);
      expect(result.deleted[0].id).toBe(1);
      result = service.deleteResult({
        pass: [],
        fail: [{
          context: {
            id: 1
          }
        }]
      });
      expect(result.failed[0].id).toBe(1);
    });

    it('should handle the action result properly without listener', function() {
      spyOn($location, 'path');
      spyOn(deleteModalService, 'open').and.returnValue({then: angular.noop});
      spyOn(lbaasv2API, 'deleteHealthMonitor').and.callFake(angular.noop);
      service.perform({loadbalancerId: 1, poolId: 3, id: 1, name: 'one'});
      var result = service.deleteResult({
        fail: [],
        pass: [{
          context: {
            id: 1
          }
        }]
      });
      var path = 'project/load_balancer/1/pools/3';
      expect($location.path).toHaveBeenCalledWith(path);
      expect(result.deleted[0].id).toBe(1);
      result = service.deleteResult({
        pass: [],
        fail: [{
          context: {
            id: 1
          }
        }]
      });
      expect(result.failed[0].id).toBe(1);
    });

    describe('allow method', function() {
      it('should use default policy if batch action', function () {
        spyOn(policyAPI, 'ifAllowed');
        service.allowed();
        expect(policyAPI.ifAllowed).toHaveBeenCalled();
      });
    }); // end of allowed

  }); // end of delete

})();
