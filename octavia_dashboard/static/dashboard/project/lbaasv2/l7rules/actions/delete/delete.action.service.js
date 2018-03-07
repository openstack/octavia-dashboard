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
    .module('horizon.dashboard.project.lbaasv2.l7rules')
    .factory('horizon.dashboard.project.lbaasv2.l7rules.actions.delete', deleteService);

  deleteService.$inject = [
    'horizon.dashboard.project.lbaasv2.l7rules.resourceType',
    'horizon.framework.util.actions.action-result.service',
    '$location',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.framework.util.i18n.gettext',
    'horizon.app.core.openstack-service-api.policy'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.l7rules.actions.deleteService
   *
   * @description
   * Brings up the delete l7rule confirmation modal dialog.
   * On submit, deletes selected l7rule.
   * On cancel, does nothing.
   *
   * @param resourceType The l7rule resource type.
   * @param actionResultService The horizon action result service.
   * @param $location The angular $location service.
   * @param deleteModal The horizon delete modal service.
   * @param api The LBaaS v2 API service.
   * @param gettext The horizon gettext function for translation.
   * @param policy The horizon policy service.
   *
   * @returns The l7rule delete service.
   */

  function deleteService(
    resourceType, actionResultService, $location,
    deleteModal, api, gettext, policy
  ) {
    var loadbalancerId, listenerId, l7policyId;

    var service = {
      perform: perform,
      allowed: allowed,
      deleteResult: deleteResult  // exposed just for testing
    };

    return service;

    //////////////

    function allowed(/*item*/) {
      return policy.ifAllowed({
        rules: [['load-balancer', 'os_load-balancer_api:l7rule:delete']]
      });
    }

    function perform(items, scope) {
      var context = { };
      var l7rules = angular.isArray(items) ? items : [items];
      context.labels = labelize(l7rules.length);
      context.deleteEntity = deleteItem;
      l7rules.map(function(item) {
        loadbalancerId = item.loadbalancerId;
        listenerId = item.listenerId;
        l7policyId = item.l7policyId;
      });
      return deleteModal.open(scope, l7rules, context).then(deleteResult);
    }

    function labelize(count) {
      return {
        title: ngettext(
          'Confirm Delete L7 Rule',
          'Confirm Delete L7 Rules', count),

        message: ngettext(
          'You have selected "%s". Deleted L7 Rule is not recoverable.',
          'You have selected "%s". Deleted L7 Rules are not recoverable.', count),

        submit: ngettext(
          'Delete L7 Rule',
          'Delete L7 Rules', count),

        success: ngettext(
          'Deleted L7 Rule: %s.',
          'Deleted L7 Rules: %s.', count),

        error: ngettext(
          'Unable to delete L7 Rule: %s.',
          'Unable to delete L7 Rules: %s.', count)
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
          '/listeners/' + listenerId +
          '/l7policies/' + l7policyId;
        $location.path(path);
      }
      return actionResult.result;
    }

    function deleteItem(id) {
      return api.deleteL7Rule(l7policyId, id, true);
    }

  }
})();
