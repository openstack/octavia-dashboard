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
    .module('horizon.dashboard.project.lbaasv2.listeners')
    .factory('horizon.dashboard.project.lbaasv2.listeners.actions.delete', deleteService);

  deleteService.$inject = [
    'horizon.dashboard.project.lbaasv2.listeners.resourceType',
    'horizon.framework.util.actions.action-result.service',
    '$q',
    '$location',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.util.i18n.gettext',
    'horizon.framework.util.q.extensions'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.listeners.actions.deleteService
   *
   * @description
   * Brings up the delete listeners confirmation modal dialog.
   * On submit, deletes selected listeners.
   * On cancel, does nothing.
   *
   * @param resourceType The listener resource type.
   * @param actionResultService The horizon action result service.
   * @param $q The angular service for promises.
   * @param $location The angular $location service.
   * @param deleteModal The horizon delete modal service.
   * @param api The LBaaS v2 API service.
   * @param policy The horizon policy service.
   * @param toast The horizon message service.
   * @param gettext The horizon gettext function for translation.
   * @param qExtensions Horizon extensions to the $q service.
   *
   * @returns The listeners delete service.
   */

  function deleteService(
    resourceType, actionResultService, $q, $location,
    deleteModal, api, policy, toast, gettext, qExtensions
  ) {
    var loadbalancerId, scope;
    var context = { };

    var service = {
      perform: perform,
      allowed: allowed
    };

    return service;

    //////////////

    function perform(items, _scope_) {
      scope = _scope_;
      var listeners = angular.isArray(items) ? items : [items];
      context.labels = labelize(listeners.length);
      context.deleteEntity = deleteItem;
      listeners.map(function(item) {
        loadbalancerId = item.loadbalancerId;
      });
      return qExtensions.allSettled(listeners.map(checkPermission)).then(afterCheck);
    }

    function labelize(count) {
      return {
        title: ngettext(
          'Confirm Delete Listener',
          'Confirm Delete Listeners', count),

        message: ngettext(
          'You have selected "%s". Deleted listener is not recoverable.',
          'You have selected "%s". Deleted listeners are not recoverable.', count),

        submit: ngettext(
          'Delete Listener',
          'Delete Listeners', count),

        success: ngettext(
          'Deleted Listener: %s.',
          'Deleted Listeners: %s.', count),

        error: ngettext(
          'Unable to delete Listener: %s.',
          'Unable to delete Listeners: %s.', count)
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
        var path = 'project/load_balancer/' + loadbalancerId;
        $location.path(path);
      }
      return actionResult.result;
    }

    function checkPermission(item) {
      return { promise: canBeDeleted(item), context: item };
    }

    function afterCheck(result) {
      if (result.fail.length > 0) {
        toast.add('error', getMessage(context.labels.error, result.fail));
      }
      if (result.pass.length > 0) {
        return deleteModal.open(scope, result.pass.map(getEntity), context).then(deleteResult);
      }
    }

    function canBeDeleted(item) {
      return qExtensions.booleanAsPromise(!item.default_pool_id);
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

    function allowed() {
      return policy.ifAllowed({ rules: [['neutron', 'delete_listener']] });
    }

    function deleteItem(id) {
      return api.deleteListener(id, true);
    }
  }
})();
