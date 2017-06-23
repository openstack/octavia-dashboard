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
    .factory('horizon.dashboard.project.lbaasv2.listeners.actions.rowActions',
      tableRowActions);

  tableRowActions.$inject = [
    '$q',
    '$route',
    'horizon.dashboard.project.lbaasv2.workflow.modal',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.i18n.gettext',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.listeners.actions.delete',
    'horizon.dashboard.project.lbaasv2.pools.actions.create'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.listeners.actions.rowActions
   *
   * @description
   * Provides the service for the Listener table row actions.
   *
   * @param $q The angular service for promises.
   * @param $route The angular $route service.
   * @param workflowModal The LBaaS workflow modal service.
   * @param policy The horizon policy service.
   * @param gettext The horizon gettext function for translation.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @param deleteService The LBaaS v2 listeners delete service.
   * @param createPoolService The LBaaS v2 pools create service.
   * @returns Listeners row actions service object.
   */

  function tableRowActions(
    $q, $route, workflowModal, policy, gettext, loadBalancersService, deleteService,
    createPoolService
  ) {
    var loadbalancerId, loadBalancerIsActionable;

    var edit = workflowModal.init({
      controller: 'EditListenerWizardController',
      message: gettext('The listener has been updated.'),
      handle: onEdit,
      allowed: canEdit
    });

    var service = {
      actions: actions,
      init: init
    };

    return service;

    ///////////////

    function init(_loadbalancerId_) {
      loadbalancerId = _loadbalancerId_;
      loadBalancerIsActionable = loadBalancersService.isActionable(loadbalancerId);
      return service;
    }

    function actions() {
      return [{
        service: edit,
        template: {
          text: gettext('Edit')
        }
      },{
        service: createPoolService.init(loadbalancerId, loadBalancerIsActionable).create,
        template: {
          text: gettext('Create Pool')
        }
      },{
        service: deleteService.init(loadbalancerId, loadBalancerIsActionable),
        template: {
          text: gettext('Delete Listener'),
          type: 'delete'
        }
      }];
    }

    function canEdit(/*item*/) {
      return $q.all([
        loadBalancerIsActionable,
        policy.ifAllowed({ rules: [['neutron', 'update_listener']] })
      ]);
    }

    function onEdit(/*response*/) {
      $route.reload();
    }
  }

})();
