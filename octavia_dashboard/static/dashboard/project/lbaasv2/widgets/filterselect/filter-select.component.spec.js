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

  describe('Filter-Select', function() {
    var mockOptions, mockColumns;

    beforeEach(function() {
      mockOptions = [{
        text: 'Option 1'
      }, {
        text: 'Option 2'
      }];

      mockColumns = [{
        label: 'Key column',
        value: 'text'
      }, {
        label: 'Function Column',
        value: function(option) {
          return option.text + ' extended';
        }
      }];
    });

    describe('component', function() {
      var component, ctrl, child, scope, otherElement,
        filterSelect, element;

      beforeEach(module('templates'));
      beforeEach(module('horizon.dashboard.project.lbaasv2',
        function($provide) {
          $provide.decorator('filterSelectDirective', function($delegate) {
            component = $delegate[0];
            spyOn(component, 'templateUrl').and.callThrough();
            return $delegate;
          });
        }
      ));

      beforeEach(inject(function($compile, $rootScope) {
        scope = $rootScope.$new();
        scope.ngModel = null;
        scope.onSelect = function() {};
        scope.shorthand = function(option) {
          return 'Shorthand: ' + option.text;
        };
        scope.disabled = true;
        scope.columns = mockColumns;
        scope.options = mockOptions;

        var html = '<filter-select ' +
          'onSelect="onSelect" ' +
          'ng-model="ngModel" ' +
          'shorthand="shorthand" ' +
          'disabled="disabled" ' +
          'columns="columns" ' +
          'options="options" ' +
          '></filter-select>';

        var parentElement = angular.element('<div></div>');
        otherElement = angular.element('<div id="otherElement"></div>');
        filterSelect = angular.element(html);

        parentElement.append(otherElement);
        parentElement.append(filterSelect);

        element = $compile(parentElement)(scope);
        scope.$apply();

        child = element.find('input');
        ctrl = filterSelect.controller('filter-select');

        spyOn(ctrl, 'onSelect').and.callThrough();
        spyOn(ctrl, '_buildRows').and.callThrough();
        spyOn(ctrl, 'shorthand').and.callThrough();
        spyOn(ctrl, '_setOpenExternal').and.callThrough();
      }));

      it('should load the correct template', function() {
        expect(component.templateUrl).toHaveBeenCalled();
        expect(component.templateUrl()).toBe(
          '/static/dashboard/project/lbaasv2/' +
          'widgets/filterselect/filter-select.html'
        );
      });

      it('should react to value change', function() {
        // Change one way binding for 'value'
        scope.ngModel = mockOptions[0];
        scope.$apply();

        expect(ctrl.textFilter).toBe('');
        expect(ctrl.text).toBe('Shorthand: Option 1');
        expect(ctrl._buildRows).toHaveBeenCalled();
        expect(ctrl.shorthand).toHaveBeenCalledWith(mockOptions[0]);
      });

      it('should react to non-option value', function() {
        // Set one way binding to an impossible value
        var nonOption = {};
        scope.ngModel = nonOption;
        scope.$apply();

        expect(ctrl._buildRows).toHaveBeenCalled();
        expect(ctrl.shorthand).not.toHaveBeenCalled();
      });

      it('should react to non-value change', function() {
        // Set non-value binding and trigger onChange, make sure value related
        // changes aren't triggered
        scope.disabled = false;
        scope.$apply();

        expect(ctrl._buildRows).toHaveBeenCalled();
        expect(ctrl.shorthand).not.toHaveBeenCalled();
      });

      it('should react to outside clicks', function() {
        var mockChildEvent = {
          target: child
        };
        ctrl.externalClick(mockChildEvent);
        expect(ctrl._setOpenExternal).not.toHaveBeenCalled();

        var mockOutsideEvent = {
          target: otherElement
        };
        ctrl.externalClick(mockOutsideEvent);
        expect(ctrl._setOpenExternal).toHaveBeenCalledWith(false);
      });

      it('should build rows', function() {
        var expectedRows = [
          [['Option 1', '', ''], ['Option 1 extended', '', '']],
          [['Option 2', '', ''], ['Option 2 extended', '', '']]
        ];

        expect(ctrl.rows).toEqual(expectedRows);

        // filtered by text
        ctrl.textFilter = '1';
        ctrl._buildRows();

        var expectedFiltered = [
          [['Option ', '1', ''], ['Option ', '1', ' extended']]
        ];
        expect(ctrl.rows).toEqual(expectedFiltered);
      });

      it('should build cells', function() {
        // Test that normal string values are used as keys against options
        var option1text = ctrl._buildCell(ctrl.columns[0], ctrl.options[0]);
        expect(option1text).toBe('Option 1');

        // Test that column value callbacks are called
        spyOn(ctrl.columns[1], 'value');
        ctrl._buildCell(ctrl.columns[1], ctrl.options[0]);
        expect(ctrl.columns[1].value).toHaveBeenCalledWith(ctrl.options[0]);
      });

      it('should handle text changes', function() {
        // Test input text changes
        var mockInput = 'mock input text';
        ctrl.text = mockInput;
        ctrl.onTextChange();

        expect(ctrl.textFilter).toEqual(mockInput);
        expect(ctrl._buildRows).toHaveBeenCalled();
      });

      it('should select options', function() {
        ctrl.selectOption(1);
        expect(ctrl.onSelect).toHaveBeenCalledWith({
          option: mockOptions[1]
        });
        expect(ctrl.isOpen).toBe(false);
      });

      it('should select correct option after filter input', function() {
        var mockInput = '2';
        ctrl.text = mockInput;
        ctrl.onTextChange();
        ctrl.selectOption(0);
        expect(ctrl.onSelect).toHaveBeenCalledWith({
          option: mockOptions[1]
        });
        expect(ctrl.filtered_options.length).toBe(1);
        expect(ctrl.filtered_options[0].text).toContain(mockInput);
        expect(ctrl.isOpen).toBe(false);
      });
    });

    describe('controller', function() {
      var scope, ctrl;

      beforeEach(module('horizon.dashboard.project.lbaasv2'));
      beforeEach(
        inject(
          function($rootScope, $componentController) {
            var events = $._data(document, 'events');
            events.click = [];
            scope = $rootScope.$new();
            ctrl = $componentController('filterSelect', {
              $scope: scope,
              $element: angular.element('<span></span>')
            });
            ctrl.$onInit();

            spyOn(scope, '$apply');
          }
        )
      );

      it('should initialize and remove listeners', function() {
        var events = $._data(document, 'events');
        expect(events.click).toBeDefined();
        expect(events.click.length).toBe(1);
        expect(events.click[0].handler).toBe(ctrl.externalClick);

        ctrl.$onDestroy();
        expect(events.click).not.toBeDefined();
      });

      it('should initialize state', function() {
        // Initial component state; simply bound values needn't be checked,
        // angular binding is trusted
        expect(ctrl.textFilter).toBe('');
        expect(ctrl.text).toBe('');
        expect(ctrl.isOpen).toBe(false);
      });

      it('should open popup', function() {
        var mockEvent = {
          stopPropagation: function() {}
        };
        spyOn(mockEvent, 'stopPropagation');

        ctrl.openPopup(mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(ctrl.isOpen).toBe(true);
      });

      it('should toggle popup', function() {
        // not much to tests here; utilizes bootstrap dropdown
        ctrl.togglePopup();
        expect(ctrl.isOpen).toBe(true);
        ctrl.togglePopup();
        expect(ctrl.isOpen).toBe(false);
      });

      it('should set open state from outside the digest', function() {
        ctrl._setOpenExternal(true);
        expect(ctrl.isOpen).toBe(true);
        expect(scope.$apply).toHaveBeenCalled();

        ctrl._setOpenExternal(false);
        expect(ctrl.isOpen).toBe(false);
        expect(scope.$apply).toHaveBeenCalled();
      });

      it('should check unset values', function() {
        expect(ctrl._isUnset(null)).toBe(true);
        expect(ctrl._isUnset(undefined)).toBe(true);
        expect(ctrl._isUnset('defined_value')).toBe(false);
      });

      it('should set default values correctly', function() {
        var defaultValue = 'default value';
        var realValue = 'input value';

        var firstResult = ctrl._setValue(null, defaultValue);
        expect(firstResult).toBe(defaultValue);

        var secondResult = ctrl._setValue(realValue, defaultValue);
        expect(secondResult).toBe(realValue);
      });

      it('should split by filter', function() {
        ctrl.textFilter = 'matched';

        var notSplit = ctrl._splitByFilter('does not match');
        expect(notSplit).toEqual({
          values:['does not match', '', ''],
          wasSplit: false
        });

        var split = ctrl._splitByFilter('this matched portion');
        expect(split).toEqual({
          values: ['this ', 'matched', ' portion'],
          wasSplit: true
        });
      });
    });
  });
})();
