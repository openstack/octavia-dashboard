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
    .factory('horizon.dashboard.project.lbaasv2.healthmonitors.actions.delete', deleteService);

  deleteService.$inject = [
    'horizon.dashboard.project.lbaasv2.healthmonitors.resourceType',
    'horizon.framework.util.actions.action-result.service',
    '$location',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.framework.util.i18n.gettext',
    'horizon.app.core.openstack-service-api.policy'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.healthmonitors.actions.deleteService
   *
   * @description
   * Brings up the delete health monitor confirmation modal dialog.
   * On submit, deletes selected health monitor.
   * On cancel, does nothing.
   *
   * @param resourceType The health monitor resource type.
   * @param actionResultService The horizon action result service.
   * @param $location The angular $location service.
   * @param deleteModal The horizon delete modal service.
   * @param api The LBaaS v2 API service.
   * @param gettext The horizon gettext function for translation.
   * @param policy The horizon policy service.
   *
   * @returns The health monitor delete service.
   */

  function deleteService(
   resourceType, actionResultService, $location, deleteModal, api, gettext, policy
  ) {
    var loadbalancerId, listenerId, poolId;

    var service = {
      perform: perform,
      allowed: allowed,
      deleteResult: deleteResult  // exposed just for testing
    };

    return service;

    //////////////

    function allowed(/*item*/) {
      return policy.ifAllowed({
        rules: [['load-balancer', 'os_load-balancer_api:healthmonitor:delete']]
      });
    }

    function perform(items, scope) {
      var context = { };
      var healthMonitors = angular.isArray(items) ? items : [items];
      context.labels = labelize(healthMonitors.length);
      context.deleteEntity = deleteItem;
      healthMonitors.map(function(item) {
        loadbalancerId = item.loadbalancerId;
        listenerId = item.listenerId;
        poolId = item.poolId;
      });
      return deleteModal.open(scope, healthMonitors, context).then(deleteResult);
    }

    function labelize(count) {
      return {
        title: ngettext(
          'Confirm Delete Health Monitor',
          'Confirm Delete Health Monitors', count),

        message: ngettext(
          'You have selected "%s". Deleted health monitor is not recoverable.',
          'You have selected "%s". Deleted health monitors are not recoverable.', count),

        submit: ngettext(
          'Delete Health Monitor',
          'Delete Health Monitors', count),

        success: ngettext(
          'Deleted Health Monitor: %s.',
          'Deleted Health Monitors: %s.', count),

        error: ngettext(
          'Unable to delete Health Monitor: %s.',
          'Unable to delete Health Monitors: %s.', count)
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
        var path;
        if (listenerId) {
          path = 'project/load_balancer/' + loadbalancerId +
            '/listeners/' + listenerId +
            '/pools/' + poolId;
        } else {
          path = 'project/load_balancer/' + loadbalancerId +
            '/pools/' + poolId;
        }
        $location.path(path);
      }
      return actionResult.result;
    }

    function deleteItem(id) {
      return api.deleteHealthMonitor(id, true);
    }
  }
})();
