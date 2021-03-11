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
    .module('horizon.dashboard.project.lbaasv2')
    .controller('MonitorDetailsController', MonitorDetailsController);

  MonitorDetailsController.$inject = [
    '$scope',
    'horizon.dashboard.project.lbaasv2.patterns',
    'horizon.framework.widgets.wizard.events',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc controller
   * @name MonitorDetailsController
   * @description
   * The `MonitorDetailsController` controller provides functions for
   * configuring the health monitor step of the LBaaS wizard.
   * @param $scope The angular scope object.
   * @param patterns The LBaaS v2 patterns constant.
   * @param wizardEvents The horizon wizard events.
   * @param gettext The horizon gettext function for translation.
   * @returns undefined
   */

  function MonitorDetailsController($scope, patterns, wizardEvents, gettext) {

    var ctrl = this;

    $scope.$on(wizardEvents.ON_SWITCH, function(event, args) {
      var nextButtonSelector = "div.modal-footer button:nth-last-of-type(2)";
      if (args.to === $scope.$index) {
        if ($scope.model.spec.listener.protocol !== 'TERMINATED_HTTPS') {
          $(nextButtonSelector).attr("disabled", "");
        }
      } else {
        $(nextButtonSelector).removeAttr("disabled");
      }
    });

    ctrl.createChange = createChange;

    function createChange() {
      if ($scope.model.context.create_monitor) {
        // Enabling pool form enables listener form and pool form
        $scope.model.context.create_listener = true;
        $scope.model.context.create_pool = true;
      }
    }

    // Error text for invalid fields
    /* eslint-disable max-len */
    ctrl.intervalError = gettext('The health check interval must be greater than or equal to the timeout.');
    /* eslint-enable max-len */
    ctrl.retryError = gettext('The max retry count must be a number between 1 and 10.');
    ctrl.retryDownError = gettext('The max retry down count must be a number between 1 and 10.');
    ctrl.timeoutError = gettext('The timeout must be a number greater than or equal to 0.');
    ctrl.statusError = gettext('The expected status code is not valid.');
    ctrl.pathError = gettext('The URL path is not valid.');

    // HTTP status codes validation pattern
    ctrl.statusPattern = patterns.httpStatusCodes;
    ctrl.urlPathPattern = patterns.urlPath;
  }
})();
