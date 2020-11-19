/*
 * Copyright 2015 IBM Corp.
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
    .controller('ListenerDetailsController', ListenerDetailsController);

  ListenerDetailsController.$inject = [
    '$scope',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc controller
   * @name ListenerDetailsController
   * @description
   * The `ListenerDetailsController` controller provides functions for
   * configuring the listener details step of the LBaaS wizard.
   * @param $scope The angular scope object.
   * @param gettext The horizon gettext function for translation.
   * @returns undefined
   */

  function ListenerDetailsController($scope, gettext) {
    var ctrl = this;
    ctrl.protocolChange = protocolChange;
    ctrl.createChange = createChange;

    // Error text for invalid fields
    ctrl.portNumberError = gettext('The port must be a number between 1 and 65535.');
    ctrl.portUniqueError = gettext(
        'The port must be unique among all listeners attached to this load balancer.');
    ctrl.connectionLimitError = gettext(
      'The connection limit must be a number greater than or equal to -1.'
    );
    ctrl.timeoutError = gettext('The timeout must be a number between 0 and 31536000000.');
    ctrl.tls_ciphersError = gettext('The cipher string must conform to OpenSSL syntax.');

    ////////////

    function protocolChange(protocol) {
      var defaultPort = { HTTP: 80, TERMINATED_HTTPS: 443 }[protocol];
      while (listenerPortExists(defaultPort)) {
        defaultPort += 1;
      }
      $scope.model.spec.listener.protocol_port = defaultPort;

      var members = $scope.model.members.concat($scope.model.spec.members);
      members.forEach(function setMemberPort(member) {
        member.port = { HTTP: 80, TERMINATED_HTTPS: 80 }[protocol];
      });

      if (protocol === 'TERMINATED_HTTPS') {
        $('#wizard-side-nav ul li:last').show();
      } else {
        $('#wizard-side-nav ul li:last').hide();
      }
    }

    function createChange() {
      if ($scope.model.context.create_listener === false) {
        // Disabling listener form disables pool form and monitor form
        $scope.model.context.create_pool = false;
        $scope.model.context.create_monitor = false;
      }
    }

    function listenerPortExists(port) {
      return $scope.model.listenerPorts.some(function(element) {
        return element === port;
      });
    }
  }
})();
