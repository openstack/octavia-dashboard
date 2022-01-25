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
    .controller('EditMemberModalController', EditMemberModalController);

  EditMemberModalController.$inject = [
    '$uibModalInstance',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.dashboard.project.lbaasv2.patterns',
    'horizon.framework.util.i18n.gettext',
    // Dependencies injected with resolve by $uibModal.open
    'poolId',
    'member'
  ];

  /**
   * @ngdoc controller
   * @name EditMemberModalController
   * @description
   * Controller used by the modal service for editing a pool member.
   *
   * @param $uibModalInstance The angular bootstrap $uibModalInstance service.
   * @param api The LBaaS v2 API service.
   * @param gettext The horizon gettext function for translation.
   * @param poolId The pool ID.
   * @param member The pool member to update.
   *
   * @returns The Edit Member modal controller.
   */

  function EditMemberModalController($uibModalInstance, api, basePath,
    patterns, gettext, poolId, member) {
    var ctrl = this;

    ctrl.yesNoOptions = [
      { label: gettext('Yes'), value: true },
      { label: gettext('No'), value: false }
    ];

    // IP address validation pattern
    ctrl.ipPattern = [patterns.ipv4, patterns.ipv6].join('|');

    ctrl.address = member.address;
    ctrl.protocol_port = member.protocol_port;
    ctrl.weight = member.weight;
    ctrl.monitor_address = member.monitor_address;
    ctrl.monitor_port = member.monitor_port;
    ctrl.admin_state_up = member.admin_state_up;
    ctrl.backup = member.backup;
    ctrl.name = member.name;
    ctrl.cancel = cancel;
    ctrl.save = save;
    ctrl.saving = false;
    ctrl.weightError = gettext('The weight must be a number between 0 and 256.');
    ctrl.monitorAddressError = gettext('The monitor address must be a valid IP address.');
    ctrl.monitorPortError = gettext('The monitor port must be a number between 1 and 65535.');

    ctrl.helpUrl = basePath + 'workflow/members/members.help.html';

    function save() {
      ctrl.saving = true;
      return api.editMember(poolId, member.id, {
        weight: ctrl.weight,
        monitor_address: ctrl.monitor_address,
        monitor_port: ctrl.monitor_port,
        admin_state_up: ctrl.admin_state_up,
        backup: ctrl.backup,
        name: ctrl.name
      }).then(onSuccess, onFailure);
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
