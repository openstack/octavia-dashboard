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
    .module('horizon.dashboard.project.lbaasv2.loadbalancers')
    .factory('horizon.dashboard.project.lbaasv2.loadbalancers.actions.delete', deleteService);

  deleteService.$inject = [
    'horizon.dashboard.project.lbaasv2.loadbalancers.resourceType',
    'horizon.framework.util.actions.action-result.service',
    '$location',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.util.q.extensions',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.loadbalancers.actions.deleteService
   * @description
   *
   * Brings up the delete load balancers confirmation modal dialog.
   * On submit, deletes selected load balancers.
   * On cancel, does nothing.
   *
   * @param resourceType The loadbalancer resource type.
   * @param actionResultService The horizon action result service.
   * @param $location The angular $location service.
   * @param deleteModal The horizon delete modal service.
   * @param api The LBaaS v2 API service.
   * @param policy The horizon policy service.
   * @param toast The horizon message service.
   * @param qExtensions Horizon extensions to the $q service.
   * @param gettext The horizon gettext function for translation.
   *
   * @returns The load balancers delete service.
   */

  function deleteService(
    resourceType, actionResultService, $location, deleteModal, api,
    policy, toast, qExtensions, gettext
  ) {

    var scope;

    // If a batch delete, then this message is displayed for any selected load balancers not in
    // ACTIVE or ERROR state.
    var notAllowedMessage = gettext('The following load balancers are pending and cannot be ' +
                                    'deleted: %s.');
    var context = {
      labels: {
        title: gettext('Confirm Delete Load Balancers'),
        message: gettext('You have selected "%s". Please confirm your selection. Deleted load ' +
                         'balancers are not recoverable.'),
        submit: gettext('Delete Load Balancers'),
        success: gettext('Deleted load balancers: %s.'),
        error: gettext('The following load balancers could not be deleted, possibly due to ' +
                       'existing listeners: %s.')
      },
      deleteEntity: deleteItem,
      successEvent: 'success',
      failedEvent: 'error'
    };

    var service = {
      perform: perform,
      allowed: allowed
    };

    return service;

    //////////////

    function perform(items, _scope_) {
      scope = _scope_;
      var loadbalancers = angular.isArray(items) ? items : [items];
      return qExtensions.allSettled(loadbalancers.map(checkPermission)).then(afterCheck);
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
        var path = 'project/load_balancer';
        $location.path(path);
      }
      return actionResult.result;
    }

    function allowed() {
      // This rule is made up and should therefore always pass. I assume at some point there
      // will be a valid rule similar to this that we will want to use.
      return policy.ifAllowed({ rules: [['neutron', 'delete_loadbalancer']] });
    }

    function canBeDeleted(item) {
      var status = item.provisioning_status;
      return qExtensions.booleanAsPromise(status === 'ACTIVE' || status === 'ERROR');
    }

    function checkPermission(item) {
      return { promise: canBeDeleted(item), context: item };
    }

    function afterCheck(result) {
      if (result.fail.length > 0) {
        toast.add('error', getMessage(notAllowedMessage, result.fail));
      }
      if (result.pass.length > 0) {
        return deleteModal.open(scope, result.pass.map(getEntity), context).then(deleteResult);
      }
    }

    function deleteItem(id) {
      return api.deleteLoadBalancer(id, true);
    }

    function getMessage(message, entities) {
      return interpolate(message, [entities.map(getName).join(", ")]);
    }

    function getName(result) {
      return getEntity(result).name;
    }

    function getEntity(result) {
      return result.context;
    }

  }
})();
