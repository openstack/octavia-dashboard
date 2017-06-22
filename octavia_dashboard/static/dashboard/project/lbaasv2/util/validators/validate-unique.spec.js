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

  describe('validate-unique directive', function () {

    var $compile, scope, element, port, name;
    var markup =
      '<form>' +
        '<input type="number" ng-model="port" validate-unique="ports">' +
        '<input type="string" ng-model="name" validate-unique="names">' +
      '</form>';

    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));
    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      scope = $injector.get('$rootScope').$new();

      // generate dom from markup
      element = $compile(markup)(scope);
      port = element.children('input[type="number"]');
      name = element.children('input[type="string"]');

      // setup up initial data
      scope.ports = [80, 443];
      scope.names = ['name1', 'name2'];
      scope.$apply();
    }));

    it('should be initially empty', function () {
      expect(port.val()).toEqual('');
      expect(name.val()).toEqual('');
      expect(port.hasClass('ng-valid')).toBe(true);
      expect(name.hasClass('ng-valid')).toBe(true);
    });

    it('should be invalid if values are not unique', function () {
      scope.port = 80;
      scope.name = 'name1';
      scope.$apply();
      expect(port.hasClass('ng-valid')).toBe(false);
      expect(name.hasClass('ng-valid')).toBe(false);
    });

    it('should be valid if values are unique', function () {
      scope.port = 81;
      scope.name = 'name3';
      scope.$apply();
      expect(port.hasClass('ng-valid')).toBe(true);
      expect(name.hasClass('ng-valid')).toBe(true);
    });
  });

})();
