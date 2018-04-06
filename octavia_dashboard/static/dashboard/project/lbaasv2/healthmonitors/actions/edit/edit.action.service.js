/*
 * Copyright 2016 IBM Corp.
 * Copyright 2017 Walmart.
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
    .factory('horizon.dashboard.project.lbaasv2.healthmonitors.actions.edit', editService);

  editService.$inject = [
    'horizon.dashboard.project.lbaasv2.healthmonitors.resourceType',
    'horizon.framework.util.actions.action-result.service',
    'horizon.dashboard.project.lbaasv2.workflow.modal',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.healthmonitors.actions.editService
   *
   * @description
   * Provides the service for editing a health monitor resource.
   *
   * @param resourceType The health monitor resource type.
   * @param actionResultService The horizon action result service.
   * @param workflowModal The LBaaS workflow modal service.
   * @param policy The horizon policy service.
   * @param gettext The horizon gettext function for translation.
   *
   * @returns The health monitor edit service.
   */

  function editService(resourceType, actionResultService, workflowModal, policy, gettext) {

    return workflowModal.init({
      controller: 'EditHealthMonitorWizardController',
      message: gettext('The health monitor has been updated.'),
      handle: handle,
      allowed: allowed
    });

    function allowed(/*healthmonitor*/) {
      return policy.ifAllowed({
        rules: [['load-balancer', 'os_load-balancer_api:healthmonitor:put']]
      });
    }

    function handle(response) {
      return actionResultService.getActionResult()
        .updated(resourceType, response.config.data.monitor.id)
        .result;
    }
  }
})();
