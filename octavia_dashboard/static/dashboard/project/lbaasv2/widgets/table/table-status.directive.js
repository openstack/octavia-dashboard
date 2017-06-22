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
    .directive('tableStatus', tableStatus);

  tableStatus.$inject = [
    'horizon.dashboard.project.lbaasv2.basePath'
  ];

  /**
   * @ngdoc directive
   * @name horizon.dashboard.project.lbaasv2:tableStatus
   * @description
   * The `tableStatus` directive provides a status indicator while loading a table. The table
   * should have loading and error properties that give the status of the table, and an items
   * array that holds the items being displayed in the table. The column count can be provided
   * to fit the status row to an exact number of columns.
   * @restrict A
   *
   * @example
   * ```
   * <tr table-status table="table" column-count="9"></tr>
   * ```
   */

  function tableStatus(basePath) {
    var directive = {
      restrict: 'A',
      templateUrl: basePath + 'widgets/table/table-status.html',
      scope: {
        table: '=',
        columnCount: '=?'
      }
    };
    return directive;
  }
}());
