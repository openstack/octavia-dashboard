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
    .factory('horizon.dashboard.project.lbaasv2.loadbalancers.actions.batchActions',
      tableBatchActions);

  tableBatchActions.$inject = [
    '$location',
    'horizon.dashboard.project.lbaasv2.workflow.modal',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.delete',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.loadbalancers.actions.batchActions
   *
   * @description
   * Provides the service for the Load Balancers table batch actions.
   *
   * @param $location The angular $location service.
   * @param workflowModal The LBaaS workflow modal service.
   * @param basePath The lbaasv2 module base path.
   * @param deleteService The load balancer delete service.
   * @param policy The horizon policy service.
   * @param gettext The horizon gettext function for translation.
   * @returns Load balancers table batch actions service object.
   */

  function tableBatchActions($location, workflowModal, basePath, deleteService, policy, gettext) {

    var create = workflowModal.init({
      controller: 'CreateLoadBalancerWizardController',
      message: gettext('A new load balancer is being created.'),
      handle: onCreate,
      allowed: canCreate
    });

    var service = {
      actions: actions
    };

    return service;

    ///////////////

    function actions() {
      return [{
        service: create,
        template: {
          type: 'create',
          text: gettext('Create Load Balancer')
        }
      }, {
        service: deleteService,
        template: {
          type: 'delete-selected',
          text: gettext('Delete Load Balancers')
        }
      }];
    }

    function canCreate() {
      // This rule is made up and should therefore always pass. I assume at some point there
      // will be a valid rule similar to this that we will want to use.
      return policy.ifAllowed({ rules: [['neutron', 'create_loadbalancer']] });
    }

    function onCreate(response) {
      $location.path('project/ngloadbalancersv2/' + response.data.id);
    }
  }

})();
