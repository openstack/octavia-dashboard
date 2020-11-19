/*
 * Copyright 2020 Red Hat, Inc.
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
    .module('horizon.dashboard.project.lbaasv2')
    .controller('PoolDetailsController', PoolDetailsController);

  PoolDetailsController.$inject = [
    '$scope',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc controller
   * @name PoolDetailsController
   * @description
   * The `PoolDetailsController` controller provides functions for
   * configuring the pool details step of the LBaaS wizard.
   * @param $scope The angular scope object.
   * @param gettext The horizon gettext function for translation.
   * @returns undefined
   */

  function PoolDetailsController($scope, gettext) {
    var ctrl = this;
    ctrl.createChange = createChange;

    function createChange() {
      if ($scope.model.context.create_pool) {
        // Enabling pool form enables listener form
        $scope.model.context.create_listener = true;
      } else {
        // Disabling pool form disables monitor form
        $scope.model.context.create_monitor = false;
      }
    }

    // Error text for invalid fields
    ctrl.tls_ciphersError = gettext('The cipher string must conform to OpenSSL syntax.');
  }
})();
