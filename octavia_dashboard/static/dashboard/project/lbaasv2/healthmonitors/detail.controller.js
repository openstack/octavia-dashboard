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
    .module('horizon.dashboard.project.lbaasv2.healthmonitors')
    .controller('HealthMonitorDetailController', HealthMonitorDetailController);

  HealthMonitorDetailController.$inject = [
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.dashboard.project.lbaasv2.healthmonitors.actions.rowActions',
    '$routeParams',
    '$q'
  ];

  /**
   * @ngdoc controller
   * @name HealthMonitorDetailController
   *
   * @description
   * Controller for the LBaaS v2 health monitor detail page.
   *
   * @param api The LBaaS v2 API service.
   * @param rowActions The LBaaS v2 health monitor row actions service.
   * @param $routeParams The angular $routeParams service.
   * @param $q The angular service for promises.
   * @returns undefined
   */

  function HealthMonitorDetailController(api, rowActions, $routeParams, $q) {
    var ctrl = this;

    ctrl.loading = true;
    ctrl.error = false;
    ctrl.actions = rowActions.init($routeParams.loadbalancerId,
                                   $routeParams.listenerId,
                                   $routeParams.poolId).actions;

    init();

    ////////////////////////////////

    function init() {
      ctrl.healthmonitor = null;
      ctrl.pool = null;
      ctrl.listener = null;
      ctrl.loadbalancer = null;
      ctrl.loading = true;
      ctrl.error = false;
      $q.all([
        api.getHealthMonitor($routeParams.healthmonitorId)
          .then(success('healthmonitor'), fail('healthmonitor')),
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

  }

})();
