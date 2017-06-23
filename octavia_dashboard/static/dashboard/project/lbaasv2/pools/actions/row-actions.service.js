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
    .factory('horizon.dashboard.project.lbaasv2.pools.actions.rowActions',
      rowActions);

  rowActions.$inject = [
    'horizon.framework.util.i18n.gettext',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.pools.actions.edit',
    'horizon.dashboard.project.lbaasv2.pools.actions.delete',
    'horizon.dashboard.project.lbaasv2.healthmonitors.actions.create'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.pools.actions.rowActions
   *
   * @description
   * Provides the service for the pool row actions.
   *
   * @param gettext The horizon gettext function for translation.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @param editService The LBaaS v2 pools delete service.
   * @param deleteService The LBaaS v2 pools delete service.
   * @param createService The LBaaS v2 health monitor create service.
   * @returns Pool row actions service object.
   */

  function rowActions(gettext, loadBalancersService, editService, deleteService, createService) {
    var loadBalancerIsActionable, loadbalancerId, listenerId;

    var service = {
      actions: actions,
      init: init
    };

    return service;

    ///////////////

    function init(_loadbalancerId_, _listenerId_) {
      loadbalancerId = _loadbalancerId_;
      listenerId = _listenerId_;
      loadBalancerIsActionable = loadBalancersService.isActionable(loadbalancerId);
      return service;
    }

    function actions() {
      return [{
        service: editService.init(loadBalancerIsActionable).edit,
        template: {
          text: gettext('Edit Pool')
        }
      },{
        service: createService.init(loadbalancerId, listenerId, loadBalancerIsActionable).create,
        template: {
          text: gettext('Create Health Monitor')
        }
      },{
        service: deleteService.init(loadbalancerId, listenerId, loadBalancerIsActionable),
        template: {
          text: gettext('Delete Pool'),
          type: 'delete'
        }
      }];
    }
  }

})();
