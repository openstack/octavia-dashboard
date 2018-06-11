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
(function () {
  'use strict';

  angular
    .module('horizon.dashboard.project.lbaasv2.members')
    .factory('horizon.dashboard.project.lbaasv2.members.actions.edit-member',
      modalService);

  modalService.$inject = [
    '$rootScope',
    'horizon.dashboard.project.lbaasv2.events',
    'horizon.dashboard.project.lbaasv2.members.resourceType',
    'horizon.framework.util.actions.action-result.service',
    '$uibModal',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.members.actions.edit-member.modal.service
   *
   * @description
   * Provides the service for the pool member Edit Member action.
   *
   * @param $rootScope The angular root scope object.
   * @param events The LBaaS v2 events object.
   * @param resourceType The member resource type.
   * @param actionResultService The horizon action result service.
   * @param $uibModal The angular bootstrap $uibModal service.
   * @param basePath The LBaaS v2 module base path.
   * @param policy The horizon policy service.
   * @param toastService The horizon toast service.
   * @param gettext The horizon gettext function for translation.
   *
   * @returns The Edit Member modal service.
   */

  function modalService(
    $rootScope, events,
    resourceType,
    actionResultService,
    $uibModal,
    basePath,
    policy,
    toastService,
    gettext
  ) {
    var member;

    var service = {
      perform: open,
      allowed: allowed
    };

    return service;

    ////////////

    function allowed(/*item*/) {
      return policy.ifAllowed({
        rules: [['load-balancer', 'os_load-balancer_api:member:put']]
      });
    }

    /**
     * @ngdoc method
     * @name open
     *
     * @description
     * Open the modal.
     *
     * @param item The row item from the table action.
     * @returns undefined
     */

    function open(item) {
      member = item;
      var spec = {
        backdrop: 'static',
        controller: 'EditMemberModalController as modal',
        templateUrl: basePath + 'members/actions/edit-member/modal.html',
        resolve: {
          poolId: function() {
            return item.poolId;
          },
          member: function() {
            return item;
          }
        }
      };
      return $uibModal.open(spec).result.then(onModalClose);
    }

    function onModalClose() {
      toastService.add('success', gettext('Pool member has been updated.'));
      $rootScope.$broadcast(events.ACTION_DONE);
      return actionResultService.getActionResult()
        .updated(resourceType, member.id)
        .result;
    }
  }
})();
