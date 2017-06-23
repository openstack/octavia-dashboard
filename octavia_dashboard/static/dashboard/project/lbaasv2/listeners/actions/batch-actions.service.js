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
    .factory('horizon.dashboard.project.lbaasv2.listeners.actions.batchActions',
      tableBatchActions);

  tableBatchActions.$inject = [
    '$q',
    '$location',
    'horizon.dashboard.project.lbaasv2.workflow.modal',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.i18n.gettext',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.listeners.actions.delete'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.listeners.actions.batchActions
   *
   * @description
   * Provides the service for the Listeners table batch actions.
   *
   * @param $q The angular service for promises.
   * @param $location The angular $location service.
   * @param workflowModal The LBaaS workflow modal service.
   * @param policy The horizon policy service.
   * @param gettext The horizon gettext function for translation.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @param deleteService The LBaaS v2 listeners delete service.
   * @returns Listeners table batch actions service object.
   */

  function tableBatchActions(
    $q, $location, workflowModal, policy, gettext, loadBalancersService, deleteService
  ) {
    var loadBalancerIsActionable, loadBalancerId;

    var create = workflowModal.init({
      controller: 'CreateListenerWizardController',
      message: gettext('A new listener is being created.'),
      handle: onCreate,
      allowed: canCreate
    });

    var service = {
      actions: actions,
      init: init
    };

    return service;

    ///////////////

    function init(_loadBalancerId_) {
      loadBalancerId = _loadBalancerId_;
      loadBalancerIsActionable = loadBalancersService.isActionable(loadBalancerId);
      return service;
    }

    function actions() {
      return [{
        service: create,
        template: {
          type: 'create',
          text: gettext('Create Listener')
        }
      },{
        service: deleteService.init(loadBalancerId, loadBalancerIsActionable),
        template: {
          text: gettext('Delete Listeners'),
          type: 'delete-selected'
        }
      }];
    }

    function canCreate() {
      return $q.all([
        loadBalancerIsActionable,
        policy.ifAllowed({ rules: [['neutron', 'create_listener']] })
      ]);
    }

    function onCreate(response) {
      var id = response.data.id;
      $location.path('project/ngloadbalancersv2/' + loadBalancerId + '/listeners/' + id);
    }
  }

})();
