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
    .module('horizon.dashboard.project.lbaasv2.pools')
    .factory('horizon.dashboard.project.lbaasv2.pools.actions.edit', editService);

  editService.$inject = [
    '$q',
    '$route',
    'horizon.dashboard.project.lbaasv2.workflow.modal',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.listeners.actions.editService
   * @description
   * Provides the service for editing a pool resource.
   * @param $q The angular service for promises.
   * @param $route The angular $route service.
   * @param workflowModal The LBaaS workflow modal service.
   * @param policy The horizon policy service.
   * @param gettext The horizon gettext function for translation.
   * @returns The load balancers pool edit service.
   */

  function editService(
    $q, $route, workflowModal, policy, gettext
  ) {
    var statePromise;

    var edit = workflowModal.init({
      controller: 'EditPoolWizardController',
      message: gettext('The pool has been updated.'),
      handle: onEdit,
      allowed: allowed
    });

    var service = {
      init: init,
      edit: edit
    };

    return service;

    //////////////

    function init(_statePromise_) {
      statePromise = _statePromise_;
      return service;
    }

    function allowed(/*item*/) {
      return $q.all([
        statePromise,
        policy.ifAllowed({ rules: [['neutron', 'update_pool']] })
      ]);
    }

    function onEdit(/*response*/) {
      $route.reload();
    }

  }
})();
