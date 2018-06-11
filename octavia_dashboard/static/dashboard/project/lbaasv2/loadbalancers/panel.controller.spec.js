/*
 * Copyright 2018 Walmart.
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

  describe('LBaaS v2 Load Balancer Panel Controller', function() {
    var ctrl, scope, $timeout;

    ///////////////////////

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {});
    }));

    beforeEach(inject(function($controller, $rootScope, _$timeout_) {
      $timeout = _$timeout_;
      scope = $rootScope.$new();
      ctrl = $controller('PanelController', {
        $scope: scope
      });
    }));

    it('should create a controller', function() {
      expect(ctrl).toBeDefined();
      expect(ctrl.listFunctionExtraParams).toBeDefined();
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
        ctrl.listFunctionExtraParams = {};
        scope.$apply();
        $timeout.flush();
        spyOn(loadBalancersService.backoff, 'reset').and.callThrough();
        scope.$broadcast(events.ACTION_DONE);
        expect(loadBalancersService.backoff.reset).toHaveBeenCalled();
      });

    });

  });

})();
