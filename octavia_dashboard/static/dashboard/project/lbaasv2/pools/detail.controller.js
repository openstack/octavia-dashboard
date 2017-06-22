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

  angular
    .module('horizon.dashboard.project.lbaasv2.pools')
    .controller('PoolDetailController', PoolDetailController);

  PoolDetailController.$inject = [
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.dashboard.project.lbaasv2.pools.actions.rowActions',
    '$routeParams',
    'horizon.framework.util.i18n.gettext',
    '$window',
    '$scope'
  ];

  /**
   * @ngdoc controller
   * @name PoolDetailController
   *
   * @description
   * Controller for the LBaaS v2 pool detail page.
   *
   * @param api The LBaaS v2 API service.
   * @param rowActions The LBaaS v2 pool row actions service.
   * @param $routeParams The angular $routeParams service.
   * @param gettext The horizon gettext function for translation.
   * @param $window Angular's reference to the browser window object.
   * @param $scope The angular scope object.
   * @returns undefined
   */

  function PoolDetailController(api, rowActions, $routeParams, gettext, $window, $scope) {
    var ctrl = this;

    ctrl.loadBalancerAlgorithm = {
      ROUND_ROBIN: gettext('Round Robin'),
      LEAST_CONNECTIONS: gettext('Least Connections'),
      SOURCE_IP: gettext('Source IP')
    };
    ctrl.actions = rowActions.init($routeParams.loadbalancerId, $routeParams.listenerId).actions;
    ctrl.membersTabActive = $window.membersTabActive;

    init();

    ////////////////////////////////

    function init() {
      api.getPool($routeParams.poolId).success(set('pool'));
      api.getListener($routeParams.listenerId).success(set('listener'));
      api.getLoadBalancer($routeParams.loadbalancerId).success(set('loadbalancer'));
    }

    function set(property) {
      return angular.bind(null, function setProp(property, value) {
        ctrl[property] = value;
      }, property);
    }

    // Save the active state of the members tab in the global window object so it can stay
    // active after reloading the route following an action.
    $scope.$watch(function() {
      return ctrl.membersTabActive;
    }, function(active) {
      $window.membersTabActive = active;
    });

  }

})();
