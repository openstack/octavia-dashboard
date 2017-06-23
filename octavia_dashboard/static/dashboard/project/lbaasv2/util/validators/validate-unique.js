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

  /**
   * @ngdoc directive
   * @name horizon.dashboard.project.lbaasv2:validateUnique
   * @element ng-model
   * @description
   * The `validateUnique` directive provides validation
   * for form input elements to ensure values are unique.
   *
   * Validator returns true if model/view value is not in
   * the array of values specified.
   *
   * @restrict A
   *
   * @example
   * ```
   * <input type="number" ng-model="value"
   *   validate-unique="[80,443]">
   * ```
   */

  angular
    .module('horizon.dashboard.project.lbaasv2')
    .directive('validateUnique', validateUnique);

  function validateUnique() {
    var directive = {
      require: 'ngModel',
      restrict: 'A',
      link: link
    };

    return directive;

    //////////

    function link(scope, element, attrs, ctrl) {
      ctrl.$parsers.push(uniqueValidator);
      ctrl.$formatters.push(uniqueValidator);

      attrs.$observe('validateUnique', function () {
        uniqueValidator(ctrl.$modelValue);
      });

      function uniqueValidator(value) {
        var values = scope.$eval(attrs.validateUnique);
        if (angular.isArray(values) && values.length > 0 && values.indexOf(value) > -1) {
          ctrl.$setValidity('unique', false);
        } else {
          ctrl.$setValidity('unique', true);
        }
        // Return the value rather than undefined if invalid
        return value;
      }

    }
  }
})();
