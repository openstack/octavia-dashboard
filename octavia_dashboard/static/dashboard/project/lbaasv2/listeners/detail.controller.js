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
    .module('horizon.dashboard.project.lbaasv2.listeners')
    .controller('ListenerDetailController', ListenerDetailController);

  ListenerDetailController.$inject = [
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.dashboard.project.lbaasv2.listeners.actions.rowActions',
    '$routeParams'
  ];

  /**
   * @ngdoc controller
   * @name ListenerDetailController
   *
   * @description
   * Controller for the LBaaS v2 listener detail page.
   *
   * @param api The LBaaS v2 API service.
   * @param rowActions The listener row actions service.
   * @param $routeParams The angular $routeParams service.
   * @returns undefined
   */

  function ListenerDetailController(api, rowActions, $routeParams) {
    var ctrl = this;

    ctrl.actions = rowActions.init($routeParams.loadbalancerId).actions;

    init();

    ////////////////////////////////

    function init() {
      api.getListener($routeParams.listenerId).success(set('listener'));
      api.getLoadBalancer($routeParams.loadbalancerId).success(set('loadbalancer'));
    }

    function set(property) {
      return angular.bind(null, function setProp(property, value) {
        ctrl[property] = value;
      }, property);
    }

  }

})();
