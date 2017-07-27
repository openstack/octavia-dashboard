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
    .module('horizon.dashboard.project.lbaasv2')
    .directive('detailStatus', detailStatus);

  detailStatus.$inject = [
    'horizon.dashboard.project.lbaasv2.basePath'
  ];

  /**
   * @ngdoc directive
   * @name horizon.dashboard.project.lbaasv2:detailStatus
   * @description
   * The `detailStatus` directive provides a status indicator while loading detail pages. It will
   * show a loading indicator while the page is loading and an error indicator if there is an
   * error loading the page.
   * @restrict E
   *
   * @example
   * ```
   * <detail-status loading="ctrl.loading" error="ctrl.error"></detail-status>
   * ```
   */

  function detailStatus(basePath) {
    var directive = {
      restrict: 'E',
      templateUrl: basePath + 'widgets/detail/detail-status.html',
      scope: {
        loading: '=',
        error: '='
      }
    };
    return directive;
  }
}());
