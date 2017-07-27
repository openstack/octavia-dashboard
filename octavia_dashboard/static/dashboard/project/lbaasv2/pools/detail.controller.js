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
    '$scope',
    '$q'
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
   * @param $q The angular service for promises.
   * @returns undefined
   */

  function PoolDetailController(api, rowActions, $routeParams, gettext, $window, $scope, $q) {
    var ctrl = this;

    ctrl.loading = true;
    ctrl.error = false;
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
      ctrl.pool = null;
      ctrl.listener = null;
      ctrl.loadbalancer = null;
      ctrl.loading = true;
      ctrl.error = false;
      $q.all([
        api.getPool($routeParams.poolId)
          .then(success('pool'), fail('pool')),
        api.getListener($routeParams.listenerId)
          .then(success('listener'), fail('listener')),
        api.getLoadBalancer($routeParams.loadbalancerId)
          .then(success('loadbalancer'), fail('loadbalancer'))
      ]).then(postInit, initError);
    }

    function success(property) {
      return angular.bind(null, function setProp(property, response) {
        ctrl[property] = response.data;
      }, property);
    }

    function fail(property) {
      return angular.bind(null, function setProp(property, error) {
        ctrl[property] = null;
        throw error;
      }, property);
    }

    function postInit() {
      ctrl.loading = false;
    }

    function initError() {
      ctrl.loading = false;
      ctrl.error = true;
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
