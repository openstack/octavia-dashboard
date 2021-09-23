/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function() {
  'use strict';

  /**
   * @ngdoc component
   * @ngname horizon.dashboard.project.lbaasv2:filterSelect
   *
   * @param {function} onSelect callback invoked when a selection is made,
   *    receives the selected option as a parameter (required)
   * @param {object} ng-model the currently selected option. Uses the ng-model
   *    directive to tie into angularjs validations (required)
   * @param {function} shorthand a function used to create a summarizing text
   *    for an option object passed to it as the first parameter. This text is
   *    displayed in the filter input when an option is selected. (required)
   * @param {boolean} disabled boolean value controlling the disabled state
   *    of the component (optional, defaults to false)
   * @param {array} options a collection of objects to be presented for
   *    selection (required)
   * @param {array} columns array of column defining objects. (required,
   *    see below for details)
   * @param {boolean} loaded allows the control to be replaced by a loading bar
   *    if required (such as when waiting for data to be loaded) (optional,
   *    defaults to false)
   *
   * @description
   * The filter-select component serves as a more complicated alternative to
   * the standard select control.
   *
   * Options in this component are presented as a customizable table where
   * each row corresponds to one of the options and allows for the presented
   * options to be filtered using a text input.
   *
   * Columns of the table are defined through the `column` attribute, which
   * accepts an array of column definition objects. Each object contains two
   * properties: `label` and `value`.
   *
   * * label {string} specifies a text value used as the given columns header
   *
   * The displayed text in each column for every option is created by
   * applying the `value` property of the given column definition to the
   * option object. It can be of two types with different behaviors:
   *
   * * {string} describes the value as a direct property of option objects,
   *   using it as key into the option object
   *
   * * {function} defines a callback that is expected to return the desired
   *    text and receives the option as it's parameter
   *
   * @example
   *
   * $scope.options = [{
   *    text: "option 1",
   *    number: 1
   * }, {
   *    text: "option 2",
   *    number: 2
   * }]
   * $scope.onSelect = function(option) { scope.value = option; };
   * $scope.columns = [{
   *    label: "Column 1",
   *    value: "text"
   * }, {
   *    label: "Column 2",
   *    value: function(option) { return option['number']; };
   * }];
   * $scope.shorthand = function(option) {
   *    return option['text'] + " => " + option['number'];
   * };
   *
   * ```
   * <filter-select
   *    onSelect="onSelect"
   *    options="options"
   *    columns="columns"
   *    shorthand="shorthand">
   * </filter-select>
   * ```
   *
   * The rendered table would then look as follows:
   *
   * | Column 1 | Column 2 |
   * |----------|----------|
   * | Option 1 |    1     |
   * |----------|----------|
   * | Option 2 |    2     |
   *
   * If the first option is selected, the shorthand function is invoked and
   * the following is displayed in the input box: 'Option1 => 1'
   *
   */
  angular
    .module('horizon.dashboard.project.lbaasv2')
    .component('filterSelect', {
      templateUrl: getTemplate,
      controller: filterSelectController,
      require: {
        ngModelCtrl: "ngModel"
      },
      bindings: {
        onSelect: '&',
        shorthand: '<',
        columns: '<',
        options: '<',
        disabled: '<',
        loaded: '<',
        ngModel: '<'
      }
    });

  filterSelectController.$inject = ['$document', '$scope', '$element'];

  function filterSelectController($document, $scope, $element) {
    var ctrl = this;
    ctrl._scope = $scope;

    // Used to filter rows
    ctrl.textFilter = '';
    // Model for the filtering text input
    ctrl.text = '';
    // Model for the dropdown
    ctrl.isOpen = false;
    // Arrays of text to be displayed
    ctrl.rows = [];
    // Array of non-rendered options after filter apply
    ctrl.filtered_options = [];

    // Lifecycle methods
    ctrl.$onInit = function() {
      $document.on('click', ctrl.externalClick);
      ctrl.loaded = ctrl._setValue(ctrl.loaded, true);
      ctrl.disabled = ctrl._setValue(ctrl.disabled, false);
    };

    ctrl.$onDestroy = function() {
      $document.off('click', ctrl.externalClick);
    };

    ctrl.$onChanges = function(changes) {
      if (changes.ngModel && ctrl.options) {
        var i = ctrl.options.indexOf(ctrl.ngModel);
        if (i > -1) {
          ctrl.textFilter = '';
          ctrl.text = ctrl.shorthand(ctrl.ngModel);
        }
      }
      ctrl._buildRows();
    };

    // Handles clicking outside of the comopnent
    ctrl.externalClick = function(event) {
      if (!$element.find(event.target).length) {
        ctrl._setOpenExternal(false);
      }
    };

    // Template handleres
    ctrl.onTextChange = function() {
      ctrl.onSelect({
        option: null
      });
      ctrl.textFilter = ctrl.text;
      //ctrl._rebuildRows();
      ctrl._buildRows();
    };

    ctrl.togglePopup = function() {
      ctrl.isOpen = !ctrl.isOpen;
    };

    ctrl.openPopup = function(event) {
      event.stopPropagation();
      ctrl.isOpen = true;
    };

    ctrl.selectOption = function(index) {
      var option = ctrl.filtered_options[index];
      ctrl.onSelect({
        option: option
      });
      ctrl.isOpen = false;
    };

    // Internal/Helper methods
    ctrl._buildCell = function(column, option) {
      if (angular.isFunction(column.value)) {
        return column.value(option);
      } else {
        return option[column.value];
      }
    };

    ctrl._buildRow = function(option) {
      var row = [];
      var valid = false;
      angular.forEach(ctrl.columns, function(column) {
        var cell = ctrl._buildCell(column, option);
        var split = ctrl._splitByFilter(cell);
        valid = valid || split.wasSplit;
        row.push(split.values);
      });

      if (valid || !ctrl.textFilter) {
        return row;
      } else {
        return null;
      }
    };

    ctrl._buildRows = function() {
      ctrl.filtered_options.length = 0;
      ctrl.rows.length = 0;
      angular.forEach(ctrl.options, function(option) {
        var row = ctrl._buildRow(option);
        if (row) {
          ctrl.rows.push(row);
          ctrl.filtered_options.push(option);
        }
      });
    };

    ctrl._splitByFilter = function(text) {
      var split = {
        values: [text, "", ""],
        wasSplit: false
      };
      var i;
      if (ctrl.textFilter && (i = text.indexOf(ctrl.textFilter)) > -1) {
        split.values = [
          text.substring(0, i),
          ctrl.textFilter,
          text.substring(i + ctrl.textFilter.length)
        ];
        split.wasSplit = true;
      }
      return split;
    };

    ctrl._setOpenExternal = function(value) {
      ctrl.isOpen = value;
      $scope.$apply();
    };

    ctrl._isUnset = function(property) {
      return angular.isUndefined(property) || property === null;
    };

    ctrl._setValue = function(property, defaultValue) {
      return ctrl._isUnset(property) ? defaultValue : property;
    };
  }

  getTemplate.$inject = ['horizon.dashboard.project.lbaasv2.basePath'];

  function getTemplate(basePath) {
    return basePath + 'widgets/filterselect/filter-select.html';
  }
})();
