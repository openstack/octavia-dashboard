/*
 * Copyright 2018 Walmart.
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
    .controller('L7PolicyDetailsController', L7PolicyDetailsController);

  L7PolicyDetailsController.$inject = [
    'horizon.dashboard.project.lbaasv2.patterns',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc controller
   * @name L7PolicyDetailsController
   * @description
   * The `L7PolicyDetailsController` controller provides functions for
   * configuring the l7policy step of the LBaaS wizard.
   * @param patterns The LBaaS v2 patterns constant.
   * @param gettext The horizon gettext function for translation.
   * @returns undefined
   */

  function L7PolicyDetailsController(patterns, gettext) {

    var ctrl = this;

    ctrl.redirectUrlError = gettext('The redirect url must be a valid http or https url.');
    ctrl.positionError = gettext('The position must be a number between 1 and 2147483647.');

  }
})();
