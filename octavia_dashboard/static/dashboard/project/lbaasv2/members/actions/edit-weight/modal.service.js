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
(function () {
  'use strict';

  angular
    .module('horizon.dashboard.project.lbaasv2.members')
    .factory('horizon.dashboard.project.lbaasv2.members.actions.edit-weight.modal.service',
      modalService);

  modalService.$inject = [
    '$q',
    '$uibModal',
    '$route',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.members.actions.edit-weight.modal.service
   *
   * @description
   * Provides the service for the pool member Edit Weight action.
   *
   * @param $q The angular service for promises.
   * @param $uibModal The angular bootstrap $uibModal service.
   * @param $route The angular $route service.
   * @param basePath The LBaaS v2 module base path.
   * @param policy The horizon policy service.
   * @param toastService The horizon toast service.
   * @param gettext The horizon gettext function for translation.
   *
   * @returns The Edit Weight modal service.
   */

  function modalService(
    $q,
    $uibModal,
    $route,
    basePath,
    policy,
    toastService,
    gettext
  ) {
    var poolId, statePromise;

    var service = {
      perform: open,
      allowed: allowed,
      init: init
    };

    return service;

    ////////////

    function init(_poolId_, _statePromise_) {
      poolId = _poolId_;
      statePromise = _statePromise_;
      return service;
    }

    function allowed(/*item*/) {
      return $q.all([
        statePromise,
        // This rule is made up and should therefore always pass. At some point there will
        // likely be a valid rule similar to this that we will want to use.
        policy.ifAllowed({ rules: [['neutron', 'pool_member_update']] })
      ]);
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
      var spec = {
        backdrop: 'static',
        controller: 'EditWeightModalController as modal',
        templateUrl: basePath + 'members/actions/edit-weight/modal.html',
        resolve: {
          poolId: function() {
            return poolId;
          },
          member: function() {
            return item;
          }
        }
      };
      $uibModal.open(spec).result.then(onModalClose);
    }

    function onModalClose() {
      toastService.add('success', gettext('Pool member weight has been updated.'));
      $route.reload();
    }

  }
})();
