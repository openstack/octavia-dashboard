/*
 * Copyright 2018 Walmart.
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
    .module('horizon.dashboard.project.lbaasv2.l7policies')
    .factory('horizon.dashboard.project.lbaasv2.l7policies.actions.edit', editService);

  editService.$inject = [
    'horizon.dashboard.project.lbaasv2.l7policies.resourceType',
    'horizon.framework.util.actions.action-result.service',
    'horizon.dashboard.project.lbaasv2.workflow.modal',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.l7policies.actions.editService
   *
   * @description
   * Provides the service for editing a l7policy resource.
   *
   * @param resourceType The l7policy resource type.
   * @param actionResultService The horizon action result service.
   * @param workflowModal The LBaaS workflow modal service.
   * @param policy The horizon policy service.
   * @param gettext The horizon gettext function for translation.
   *
   * @returns The l7policy edit service.
   */

  function editService(
    resourceType, actionResultService, workflowModal, policy, gettext
  ) {

    return workflowModal.init({
      controller: 'EditL7PolicyWizardController',
      message: gettext('The l7policy has been updated.'),
      handle: handle,
      allowed: allowed
    });

    function allowed(/*item*/) {
      return policy.ifAllowed({
        rules: [['load-balancer', 'os_load-balancer_api:l7policy:put']]
      });
    }

    function handle(response) {
      return actionResultService.getActionResult()
        .updated(resourceType, response.config.data.l7policy.id)
        .result;
    }

  }
})();
