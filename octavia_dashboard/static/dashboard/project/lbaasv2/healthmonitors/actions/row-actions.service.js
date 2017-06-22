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
    .factory('horizon.dashboard.project.lbaasv2.healthmonitors.actions.rowActions',
      rowActions);

  rowActions.$inject = [
    'horizon.framework.util.i18n.gettext',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.healthmonitors.actions.edit',
    'horizon.dashboard.project.lbaasv2.healthmonitors.actions.delete'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.healthmonitors.actions.rowActions
   *
   * @description
   * Provides the service for the health monitor row actions.
   *
   * @param gettext The horizon gettext function for translation.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @param editService The LBaaS v2 health monitor edit service.
   * @param deleteService The LBaaS v2 health monitor delete service.
   * @returns Health monitor row actions service object.
   */

  function rowActions(gettext, loadBalancersService, editService, deleteService) {
    var loadBalancerIsActionable, loadbalancerId, listenerId, poolId;

    var service = {
      actions: actions,
      init: init
    };

    return service;

    ///////////////

    function init(_loadbalancerId_, _listenerId_, _poolId_) {
      loadbalancerId = _loadbalancerId_;
      listenerId = _listenerId_;
      poolId = _poolId_;
      loadBalancerIsActionable = loadBalancersService.isActionable(loadbalancerId);
      return service;
    }

    function actions() {
      return [{
        service: editService.init(loadBalancerIsActionable).edit,
        template: {
          text: gettext('Edit')
        }
      },{
        service: deleteService.init(loadbalancerId, listenerId, poolId, loadBalancerIsActionable),
        template: {
          text: gettext('Delete Health Monitor'),
          type: 'delete'
        }
      }];
    }
  }

})();
