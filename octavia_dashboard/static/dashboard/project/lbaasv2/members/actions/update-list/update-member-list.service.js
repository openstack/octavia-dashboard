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
    .module('horizon.dashboard.project.lbaasv2.members')
    .factory('horizon.dashboard.project.lbaasv2.members.actions.update-member-list',
        updateMemberListService);

  updateMemberListService.$inject = [
    '$q',
    '$route',
    'horizon.dashboard.project.lbaasv2.workflow.modal',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.listeners.actions.updateMemberListService
   * @description
   * Provides the service for updating the list of pool members.
   * @param $q The angular service for promises.
   * @param $route The angular $route service.
   * @param workflowModal The LBaaS workflow modal service.
   * @param policy The horizon policy service.
   * @param gettext The horizon gettext function for translation.
   * @returns The load balancers members update member list service.
   */

  function updateMemberListService(
    $q, $route, workflowModal, policy, gettext
  ) {
    var statePromise;

    var updateList = workflowModal.init({
      controller: 'UpdateMemberListWizardController',
      message: gettext('The pool members have been updated.'),
      handle: onUpdate,
      allowed: allowed
    });

    var service = {
      init: init,
      update: updateList
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
        policy.ifAllowed({ rules: [['neutron', 'update_member_list']] })
      ]);
    }

    function onUpdate(/*response*/) {
      $route.reload();
    }

  }
})();
