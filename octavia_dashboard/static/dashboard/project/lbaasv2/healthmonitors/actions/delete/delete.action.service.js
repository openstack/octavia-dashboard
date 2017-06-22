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
    .module('horizon.dashboard.project.lbaasv2.healthmonitors')
    .factory('horizon.dashboard.project.lbaasv2.healthmonitors.actions.delete', deleteService);

  deleteService.$inject = [
    '$q',
    '$location',
    '$route',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.healthmonitors.actions.deleteService
   * @description
   * Brings up the delete health monitor confirmation modal dialog.
   * On submit, deletes selected health monitor.
   * On cancel, does nothing.
   * @param $q The angular service for promises.
   * @param $location The angular $location service.
   * @param $route The angular $route service.
   * @param deleteModal The horizon delete modal service.
   * @param api The LBaaS v2 API service.
   * @param policy The horizon policy service.
   * @param gettext The horizon gettext function for translation.
   * @returns The health monitor delete service.
   */

  function deleteService(
    $q, $location, $route, deleteModal, api, policy, gettext
  ) {
    var loadbalancerId, listenerId, poolId, statePromise;
    var context = {
      labels: {
        title: gettext('Confirm Delete Health Monitor'),
        message: gettext('You have selected "%s". Please confirm your selection. Deleted health ' +
                         'monitors are not recoverable.'),
        submit: gettext('Delete Health Monitor'),
        success: gettext('Deleted health monitor: %s.'),
        error: gettext('The following health monitor could not be deleted: %s.')
      },
      deleteEntity: deleteItem,
      successEvent: 'success',
      failedEvent: 'error'
    };

    var service = {
      perform: perform,
      allowed: allowed,
      init: init
    };

    return service;

    //////////////

    function init(_loadbalancerId_, _listenerId_, _poolId_, _statePromise_) {
      loadbalancerId = _loadbalancerId_;
      listenerId = _listenerId_;
      poolId = _poolId_;
      statePromise = _statePromise_;
      return service;
    }

    function perform(item) {
      deleteModal.open({ $emit: actionComplete }, [item], context);
    }

    function allowed(/*item*/) {
      return $q.all([
        statePromise,
        // This rule is made up and should therefore always pass. I assume at some point there
        // will be a valid rule similar to this that we will want to use.
        policy.ifAllowed({ rules: [['neutron', 'delete_health_monitor']] })
      ]);
    }

    function deleteItem(id) {
      return api.deleteHealthMonitor(id, true);
    }

    function actionComplete(eventType) {
      if (eventType === context.failedEvent) {
        // Error, reload page
        $route.reload();
      } else {
        // Success, go back to pool details page
        var path = 'project/ngloadbalancersv2/' + loadbalancerId +
                   '/listeners/' + listenerId +
                   '/pools/' + poolId;
        $location.path(path);
      }
    }

  }
})();
