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
    .module('horizon.dashboard.project.lbaasv2.members')
    .controller('MembersTableController', MembersTableController);

  MembersTableController.$inject = [
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.dashboard.project.lbaasv2.members.actions.rowActions',
    'horizon.dashboard.project.lbaasv2.members.actions.batchActions',
    '$routeParams'
  ];

  /**
   * @ngdoc controller
   * @name MembersTableController
   *
   * @description
   * Controller for the LBaaS v2 members table. Serves as the focal point for table actions.
   *
   * @param api The LBaaS V2 service API.
   * @param rowActions The pool members row actions service.
   * @param batchActions The members batch actions service.
   * @param $routeParams The angular $routeParams service.
   * @returns undefined
   */

  function MembersTableController(api, rowActions, batchActions, $routeParams) {

    var ctrl = this;
    ctrl.items = [];
    ctrl.src = [];
    ctrl.loading = true;
    ctrl.error = false;
    ctrl.checked = {};
    ctrl.loadbalancerId = $routeParams.loadbalancerId;
    ctrl.listenerId = $routeParams.listenerId;
    ctrl.poolId = $routeParams.poolId;
    ctrl.rowActions = rowActions.init(ctrl.loadbalancerId, ctrl.poolId);
    ctrl.batchActions = batchActions.init(ctrl.loadbalancerId);

    init();

    ////////////////////////////////

    function init() {
      ctrl.src = [];
      ctrl.loading = true;
      ctrl.error = false;
      api.getMembers(ctrl.poolId).then(success, fail);
    }

    function success(response) {
      ctrl.src = response.data.items;
      ctrl.loading = false;
    }

    function fail(/*response*/) {
      ctrl.src = [];
      ctrl.loading = false;
      ctrl.error = true;
    }

  }

})();
