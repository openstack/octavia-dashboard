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

  describe('detailStatus directive', function() {
    var $scope, $compile, markup, ctrl;

    beforeEach(module('templates'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(inject(function($injector) {
      $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      ctrl = {
        loading: true,
        error: false
      };
      $scope.ctrl = ctrl;
      markup = '<detail-status loading="ctrl.loading" error="ctrl.error"></detail-status>';
    }));

    it('initially shows loading status', function() {
      var element = digestMarkup($scope, $compile, markup);
      expect(element).toBeDefined();

      expect(element.children().length).toBe(1);
      expect(element.find('.progress-bar').hasClass('progress-bar-striped')).toBe(true);
      expect(element.find('.progress-bar').hasClass('progress-bar-danger')).toBe(false);
      expect(element.find('.progress-bar > span').length).toBe(1);
      expect(element.find('.progress-bar > span').hasClass('sr-only')).toBe(true);
      expect(element.find('.progress-bar > span').text().trim()).toBe('Loading');
      expect(element.find('.message').length).toBe(0);
    });

    it('indicates error status on error', function() {
      var element = digestMarkup($scope, $compile, markup);
      expect(element).toBeDefined();

      ctrl.loading = false;
      ctrl.error = true;
      $scope.$apply();

      expect(element.children().length).toBe(1);
      expect(element.find('.progress-bar').hasClass('progress-bar-striped')).toBe(false);
      expect(element.find('.progress-bar').hasClass('progress-bar-danger')).toBe(true);
      expect(element.find('.progress-bar > span').length).toBe(1);
      expect(element.find('.progress-bar > span').hasClass('sr-only')).toBe(false);
      expect(element.find('.progress-bar > span').text().trim())
        .toBe('An error occurred. Please try again later.');
      expect(element.find('.error-actions').length).toBe(1);
      expect(element.find('.error-actions > a').text().trim()).toBe('Back');
    });

    it('goes away when done loading', function() {
      var element = digestMarkup($scope, $compile, markup);
      expect(element).toBeDefined();

      ctrl.loading = false;
      ctrl.error = false;
      $scope.$apply();

      expect(element.children().length).toBe(0);
    });

  });
}());
