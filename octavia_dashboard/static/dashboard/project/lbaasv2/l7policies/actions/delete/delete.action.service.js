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
    .factory('horizon.dashboard.project.lbaasv2.l7policies.actions.delete', deleteService);

  deleteService.$inject = [
    'horizon.dashboard.project.lbaasv2.l7policies.resourceType',
    'horizon.framework.util.actions.action-result.service',
    '$location',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.framework.util.i18n.gettext',
    'horizon.app.core.openstack-service-api.policy'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.l7policies.actions.deleteService
   *
   * @description
   * Brings up the delete l7policy confirmation modal dialog.
   * On submit, deletes selected l7policy.
   * On cancel, does nothing.
   *
   * @param resourceType The l7policy resource type.
   * @param actionResultService The horizon action result service.
   * @param $location The angular $location service.
   * @param deleteModal The horizon delete modal service.
   * @param api The LBaaS v2 API service.
   * @param gettext The horizon gettext function for translation.
   * @param policy The horizon policy service.
   *
   * @returns The l7policy delete service.
   */

  function deleteService(
    resourceType, actionResultService, $location,
    deleteModal, api, gettext, policy
  ) {
    var loadbalancerId, listenerId;

    var service = {
      perform: perform,
      allowed: allowed,
      deleteResult: deleteResult  // exposed just for testing
    };

    return service;

    //////////////

    function allowed(/*item*/) {
      return policy.ifAllowed({
        rules: [['load-balancer', 'os_load-balancer_api:l7policy:delete']]
      });
    }

    function perform(items, scope) {
      var context = { };
      var l7policies = angular.isArray(items) ? items : [items];
      context.labels = labelize(l7policies.length);
      context.deleteEntity = deleteItem;
      l7policies.map(function(item) {
        loadbalancerId = item.loadbalancerId;
        listenerId = item.listenerId;
      });
      return deleteModal.open(scope, l7policies, context).then(deleteResult);
    }

    function labelize(count) {
      return {
        title: ngettext(
          'Confirm Delete L7 Policy',
          'Confirm Delete L7 Policies', count),

        message: ngettext(
          'You have selected "%s". Deleted L7 Policy is not recoverable.',
          'You have selected "%s". Deleted L7 Policies are not recoverable.', count),

        submit: ngettext(
          'Delete L7 Policy',
          'Delete L7 Policies', count),

        success: ngettext(
          'Deleted L7 Policy: %s.',
          'Deleted L7 Policies: %s.', count),

        error: ngettext(
          'Unable to delete L7 Policy: %s.',
          'Unable to delete L7 Policies: %s.', count)
      };
    }

    function deleteResult(deleteModalResult) {
      // To make the result of this action generically useful, reformat the return
      // from the deleteModal into a standard form
      var actionResult = actionResultService.getActionResult();
      deleteModalResult.pass.forEach(function markDeleted(item) {
        actionResult.deleted(resourceType, item.context.id);
      });
      deleteModalResult.fail.forEach(function markFailed(item) {
        actionResult.failed(resourceType, item.context.id);
      });

      if (actionResult.result.failed.length === 0 && actionResult.result.deleted.length > 0) {
        var path = 'project/load_balancer/' + loadbalancerId +
                   '/listeners/' + listenerId;
        $location.path(path);
      }
      return actionResult.result;
    }

    function deleteItem(id) {
      return api.deleteL7Policy(id, true);
    }

  }
})();
