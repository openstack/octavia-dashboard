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
    .module('horizon.dashboard.project.lbaasv2.loadbalancers')
    .factory('horizon.dashboard.project.lbaasv2.loadbalancers.actions.rowActions',
      tableRowActions);

  tableRowActions.$inject = [
    '$q',
    '$route',
    'horizon.dashboard.project.lbaasv2.workflow.modal',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.delete',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.associate-ip.modal.service',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.disassociate-ip.modal.service',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.app.core.openstack-service-api.network',
    'horizon.framework.util.q.extensions',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.loadbalancers.actions.rowActions
   *
   * @description
   * Provides the service for the Load Balancers table row actions.
   *
   * @param $q The angular service for promises.
   * @param $route The angular $route service.
   * @param workflowModal The LBaaS workflow modal service.
   * @param deleteService The load balancer delete service.
   * @param associateIp The associate floating IP modal service.
   * @param disassociateIp The disassociate floating IP modal service.
   * @param policy The horizon policy service.
   * @param network The horizon network API service.
   * @param qExtensions Horizon extensions to the $q service.
   * @param gettext The horizon gettext function for translation.
   * @returns Load balancers table row actions service object.
   */

  function tableRowActions(
    $q,
    $route,
    workflowModal,
    deleteService,
    associateIp,
    disassociateIp,
    policy,
    network,
    qExtensions,
    gettext
  ) {
    var edit = workflowModal.init({
      controller: 'EditLoadBalancerWizardController',
      message: gettext('The load balancer has been updated.'),
      handle: onEdit,
      allowed: canEdit
    });

    var service = {
      actions: actions
    };

    return service;

    ///////////////

    function actions() {
      return [{
        service: edit,
        template: {
          text: gettext('Edit')
        }
      },{
        service: associateIp,
        template: {
          text: gettext('Associate Floating IP')
        }
      },{
        service: disassociateIp,
        template: {
          text: gettext('Disassociate Floating IP')
        }
      },{
        service: deleteService,
        template: {
          text: gettext('Delete Load Balancer'),
          type: 'delete'
        }
      }];
    }

    function canEdit(item) {
      return $q.all([
        qExtensions.booleanAsPromise(item.provisioning_status === 'ACTIVE'),
        // This rule is made up and should therefore always pass. At some point there will
        // likely be a valid rule similar to this that we will want to use.
        policy.ifAllowed({ rules: [['neutron', 'update_loadbalancer']] })
      ]);
    }

    function onEdit(/*response*/) {
      $route.reload();
    }
  }

})();
