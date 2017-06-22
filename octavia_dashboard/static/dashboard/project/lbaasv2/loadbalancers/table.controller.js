/*
 * Copyright 2015 IBM Corp.
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
    .controller('LoadBalancersTableController', LoadBalancersTableController);

  LoadBalancersTableController.$inject = [
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.batchActions',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.rowActions',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service'
  ];

  /**
   * @ngdoc controller
   * @name LoadBalancersTableController
   *
   * @description
   * Controller for the LBaaS v2 load balancers table. Serves as the focal point for table actions.
   *
   * @param api The LBaaS V2 service API.
   * @param batchActions The load balancer batch actions service.
   * @param rowActions The load balancer row actions service.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @returns undefined
   */

  function LoadBalancersTableController(api, batchActions, rowActions, loadBalancersService) {

    var ctrl = this;
    ctrl.items = [];
    ctrl.src = [];
    ctrl.loading = true;
    ctrl.error = false;
    ctrl.checked = {};
    ctrl.batchActions = batchActions;
    ctrl.rowActions = rowActions;
    ctrl.operatingStatus = loadBalancersService.operatingStatus;
    ctrl.provisioningStatus = loadBalancersService.provisioningStatus;

    init();

    ////////////////////////////////

    function init() {
      ctrl.src = [];
      ctrl.loading = true;
      api.getLoadBalancers(true).then(success, fail);
    }

    function success(response) {
      ctrl.src = response.data.items;
      ctrl.loading = false;
    }

    function fail(/*response*/) {
      ctrl.src = [];
      ctrl.error = true;
      ctrl.loading = false;
    }

  }

})();
