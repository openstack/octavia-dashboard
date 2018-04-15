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

  describe('LBaaS v2 Pool Detail Controller', function() {
    var deferred, service, ctrl, scope, $timeout, $q, actionResultService;

    ///////////////////////

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {});
    }));

    beforeEach(inject(function($controller, $rootScope, _$q_, _$timeout_) {
      $q = _$q_;
      deferred = $q.defer();
      service = {
        getResourceType: function() {
          return {
            load: function() { return deferred.promise; },
            parsePath: function() { return 'my-context'; },
            itemName: function() { return 'A name'; },
            initActions: angular.noop
          };
        },
        getDefaultDetailsTemplateUrl: angular.noop
      };
      actionResultService = {
        getIdsOfType: function() { return []; }
      };
      $timeout = _$timeout_;
      scope = $rootScope.$new();
      ctrl = $controller('PoolDetailController', {
        $scope: scope,
        loadbalancer: { id: '123' },
        listener: {},
        pool: { id: '123', provisioning_status: 'ACTIVE' },
        'horizon.framework.conf.resource-type-registry.service': service,
        'horizon.framework.util.actions.action-result.service': actionResultService,
        'horizon.framework.widgets.modal-wait-spinner.service': {
          showModalSpinner: angular.noop,
          hideModalSpinner: angular.noop
        }
      });
      ctrl = $controller('PoolDetailController', {
        $scope: scope,
        loadbalancer: { id: '123' },
        listener: { id: '123' },
        pool: { id: '123', provisioning_status: 'ACTIVE' },
        'horizon.framework.conf.resource-type-registry.service': service,
        'horizon.framework.util.actions.action-result.service': actionResultService,
        'horizon.framework.widgets.modal-wait-spinner.service': {
          showModalSpinner: angular.noop,
          hideModalSpinner: angular.noop
        }
      });
    }));

    it('should create a controller', function() {
      expect(ctrl).toBeDefined();
      expect(ctrl.loadbalancer).toBeDefined();
      expect(ctrl.listener).toBeDefined();
      expect(ctrl.pool).toBeDefined();
    });

    describe('data watchers', function() {

      var events, loadBalancersService;
      beforeEach(inject(function($injector) {
        events = $injector.get('horizon.dashboard.project.lbaasv2.events');
        loadBalancersService = $injector.get(
          'horizon.dashboard.project.lbaasv2.loadbalancers.service'
        );
      }));

      it('should refresh on provisioning status change', function() {
        var loadFunctionDeferred = $q.defer();
        spyOn(ctrl.resourceType, 'load').and.returnValue(loadFunctionDeferred.promise);
        ctrl.pool = { id: '123', provisioning_status: 'PENDING_UPDATE' };
        scope.$apply();
        $timeout.flush();
        expect(ctrl.resourceType.load).toHaveBeenCalled();
        spyOn(loadBalancersService.backoff, 'reset').and.callThrough();
        scope.$broadcast(events.ACTION_DONE);
        expect(loadBalancersService.backoff.reset).toHaveBeenCalled();
      });

    });

    describe('resultHandler', function() {

      it('handles empty results', function() {
        var result = $q.defer();
        result.resolve({failed: [], deleted: []});
        ctrl.resultHandler(result.promise);
        $timeout.flush();
        expect(ctrl.showDetails).not.toBe(true);
      });

      it('handles falsy results', function() {
        var result = $q.defer();
        result.resolve(false);
        ctrl.resultHandler(result.promise);
        $timeout.flush();
        expect(ctrl.showDetails).not.toBe(true);
      });

      it('handles matched results', function() {
        spyOn(actionResultService, 'getIdsOfType').and.returnValue([1, 2, 3]);
        var result = $q.defer();
        result.resolve({some: 'thing', failed: [], deleted: []});
        ctrl.resultHandler(result.promise);
        deferred.resolve({data: {some: 'data'}});
        $timeout.flush();
        expect(ctrl.showDetails).toBe(true);
      });

      it('handles delete race condition', function() {
        spyOn(actionResultService, 'getIdsOfType').and.returnValue([1, 2, 3]);
        var result = $q.defer();
        result.resolve({some: 'thing', failed: [], deleted: [{id: 1}]});
        ctrl.resultHandler(result.promise);
        deferred.resolve({data: {some: 'data'}});
        $timeout.flush();
        expect(ctrl.showDetails).toBe(undefined);
      });

    });

  });

})();
