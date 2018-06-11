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

  angular
    .module('horizon.dashboard.project.lbaasv2.loadbalancers')
    .controller('PanelController', PanelController);

  PanelController.$inject = [
    '$scope',
    '$timeout',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.events'
  ];

  /**
   * @ngdoc controller
   * @name PanelController
   *
   * @description
   * Controller for the LBaaS v2 load balancers panel.
   *
   * @param $scope The angular scope object.
   * @param $timeout The angular timeout object.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @param events The LBaaS v2 events object.
   * @returns undefined
   */

  function PanelController(
    $scope, $timeout, loadBalancersService, events
  ) {
    var ctrl = this;

    ctrl.listFunctionExtraParams = {};

    $scope.$watch(
      function() {
        return ctrl.listFunctionExtraParams;
      },
      function() {
        $timeout.cancel($scope.listTimeout);
        $scope.listTimeout = $timeout(function () {
          ctrl.listFunctionExtraParams = angular.copy(ctrl.listFunctionExtraParams);
        }, loadBalancersService.backoff.duration());
      }
    );

    $scope.$on(
      events.ACTION_DONE,
      function() {
        loadBalancersService.backoff.reset();
        ctrl.listFunctionExtraParams = angular.copy(ctrl.listFunctionExtraParams);
      }
    );

    $scope.$on(
      '$destroy',
      function() {
        $timeout.cancel($scope.listTimeout);
      }
    );
  }

})();
