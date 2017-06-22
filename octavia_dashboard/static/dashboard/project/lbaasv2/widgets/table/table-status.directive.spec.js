/*
 * Copyright 2016 IBM Corp.
 *
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

  function digestMarkup(scope, compile, markup) {
    var element = angular.element(markup);
    compile(element)(scope);
    scope.$apply();
    return element;
  }

  describe('tableStatus directive', function() {
    var $scope, $compile, markup, table;

    beforeEach(module('templates'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(inject(function($injector) {
      $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      table = {
        loading: true,
        error: false,
        items: []
      };
      $scope.table = table;
      markup = '<tr table-status table="table"></tr>';
    }));

    it('initially shows loading status', function() {
      var element = digestMarkup($scope, $compile, markup);
      expect(element).toBeDefined();

      expect(element.children().length).toBe(1);
      expect(element.children().first().hasClass('no-rows-help')).toBe(false);
      expect(element.find('.progress-bar').hasClass('progress-bar-striped')).toBe(true);
      expect(element.find('.progress-bar').hasClass('progress-bar-danger')).toBe(false);
      expect(element.find('.progress-bar > span').length).toBe(1);
      expect(element.find('.progress-bar > span').hasClass('sr-only')).toBe(true);
    });

    it('indicates error status on error', function() {
      var element = digestMarkup($scope, $compile, markup);
      expect(element).toBeDefined();

      table.loading = false;
      table.error = true;
      $scope.$apply();

      expect(element.children().length).toBe(1);
      expect(element.children().first().hasClass('no-rows-help')).toBe(false);
      expect(element.find('.progress-bar').hasClass('progress-bar-striped')).toBe(false);
      expect(element.find('.progress-bar').hasClass('progress-bar-danger')).toBe(true);
      expect(element.find('.progress-bar > span').length).toBe(1);
      expect(element.find('.progress-bar > span').hasClass('sr-only')).toBe(false);
      expect(element.find('.progress-bar > span').text().trim())
        .toBe('An error occurred. Please try again later.');
    });

    it('indicates no rows when there are no rows to display', function() {
      var element = digestMarkup($scope, $compile, markup);
      expect(element).toBeDefined();

      table.loading = false;
      table.error = false;
      $scope.$apply();

      expect(element.children().length).toBe(1);
      expect(element.children().first().hasClass('no-rows-help')).toBe(true);
      expect(element.find('.progress').length).toBe(0);
      expect(element.find('span').length).toBe(1);
      expect(element.find('span').text().trim()).toBe('No items to display.');
    });

    it('goes away when done loading and there are rows to display', function() {
      var element = digestMarkup($scope, $compile, markup);
      expect(element).toBeDefined();

      table.loading = false;
      table.error = false;
      table.items = ['foo'];
      $scope.$apply();

      expect(element.children().length).toBe(0);
    });

  });
}());
