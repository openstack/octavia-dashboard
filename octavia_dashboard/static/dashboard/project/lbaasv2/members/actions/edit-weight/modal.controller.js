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
    .controller('EditWeightModalController', EditWeightModalController);

  EditWeightModalController.$inject = [
    '$uibModalInstance',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.framework.util.i18n.gettext',
    // Dependencies injected with resolve by $uibModal.open
    'poolId',
    'member'
  ];

  /**
   * @ngdoc controller
   * @name EditWeightModalController
   * @description
   * Controller used by the modal service for editing the weight of a pool member.
   *
   * @param $uibModalInstance The angular bootstrap $uibModalInstance service.
   * @param api The LBaaS v2 API service.
   * @param gettext The horizon gettext function for translation.
   * @param poolId The pool ID.
   * @param member The pool member to update.
   *
   * @returns The Edit Weight modal controller.
   */

  function EditWeightModalController($uibModalInstance, api, gettext, poolId, member) {
    var ctrl = this;

    ctrl.weight = member.weight;
    ctrl.cancel = cancel;
    ctrl.save = save;
    ctrl.saving = false;
    ctrl.weightError = gettext('The weight must be a number between 1 and 256.');

    function save() {
      ctrl.saving = true;
      return api.editMember(poolId, member.id, { weight: ctrl.weight })
        .then(onSuccess, onFailure);
    }

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }

    function onSuccess() {
      $uibModalInstance.close();
    }

    function onFailure() {
      ctrl.saving = false;
    }
  }
})();
