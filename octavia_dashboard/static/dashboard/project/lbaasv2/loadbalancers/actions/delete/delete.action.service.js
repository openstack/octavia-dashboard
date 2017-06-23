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
    .factory('horizon.dashboard.project.lbaasv2.loadbalancers.actions.delete', deleteService);

  deleteService.$inject = [
    '$q',
    '$location',
    '$route',
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
   * Brings up the delete load balancers confirmation modal dialog.
   * On submit, deletes selected load balancers.
   * On cancel, does nothing.
   * @param $q The angular service for promises.
   * @param $location The angular $location service.
   * @param $route The angular $route service.
   * @param deleteModal The horizon delete modal service.
   * @param api The LBaaS v2 API service.
   * @param policy The horizon policy service.
   * @param toast The horizon message service.
   * @param qExtensions Horizon extensions to the $q service.
   * @param gettext The horizon gettext function for translation.
   * @returns The load balancers table delete service.
   */

  function deleteService(
    $q, $location, $route, deleteModal, api, policy, toast, qExtensions, gettext
  ) {
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

    function perform(items) {
      if (angular.isArray(items)) {
        qExtensions.allSettled(items.map(checkPermission)).then(afterCheck);
      } else {
        deleteModal.open({ $emit: actionComplete }, [items], context);
      }
    }

    function allowed(item) {
      // This rule is made up and should therefore always pass. I assume at some point there
      // will be a valid rule similar to this that we will want to use.
      var promises = [policy.ifAllowed({ rules: [['neutron', 'delete_loadbalancer']] })];
      if (item) {
        var status = item.provisioning_status;
        promises.push(qExtensions.booleanAsPromise(status === 'ACTIVE' || status === 'ERROR'));
      }
      return $q.all(promises);
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
        deleteModal.open({ $emit: actionComplete }, result.pass.map(getEntity), context);
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

    function actionComplete(eventType) {
      if (eventType === context.failedEvent) {
        // Action failed, reload the page
        $route.reload();
      } else {
        // If the user is on the load balancers table then just reload the page, otherwise they
        // are on the details page and we return to the table.
        if (/\/ngloadbalancersv2(\/)?$/.test($location.path())) {
          $route.reload();
        } else {
          $location.path('project/ngloadbalancersv2');
        }
      }
    }

  }
})();
