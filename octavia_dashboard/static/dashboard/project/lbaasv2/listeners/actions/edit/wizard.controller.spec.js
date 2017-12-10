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

  describe('LBaaS v2 Edit Listener Wizard Controller', function() {
    var ctrl, workflowSpy, $q, scope;
    var model = {
      submit: function() {
        return 'updated';
      },
      initialize: function() {
        var defer = $q.defer();
        defer.resolve();
        return defer.promise;
      }
    };
    var workflow = {
      steps: [{id: 'listener'}],
      append: angular.noop
    };

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));
    beforeEach(module(function ($provide) {
      workflowSpy = jasmine.createSpy('workflow').and.returnValue(workflow);
      $provide.value('horizon.dashboard.project.lbaasv2.workflow.model', model);
      $provide.value('horizon.dashboard.project.lbaasv2.workflow.workflow', workflowSpy);
    }));
    beforeEach(inject(function ($controller, $injector) {
      $q = $injector.get('$q');
      scope = $injector.get('$rootScope').$new();
      scope.launchContext = { id: '1234' };
      spyOn(model, 'initialize').and.callThrough();
      ctrl = $controller('EditListenerWizardController', { $scope: scope });
    }));

    it('defines the controller', function() {
      expect(ctrl).toBeDefined();
    });

    it('calls initialize on the given model', function() {
      expect(model.initialize).toHaveBeenCalledWith('listener', '1234');
    });

    it('sets scope.workflow to the given workflow', function() {
      expect(scope.workflow).toBe(workflow);
    });

    it('initializes workflow with correct properties', inject(function($controller) {
      scope.launchContext = { id: '1234', protocol: 'TERMINATED_HTTPS' };
      ctrl = $controller('EditListenerWizardController', { $scope: scope });
      expect(workflowSpy).toHaveBeenCalledWith('Update Listener',
        'fa fa-pencil', jasmine.any(Object));
    }));

    it('defines scope.submit', function() {
      expect(scope.submit).toBe(model.submit);
      expect(scope.submit()).toBe('updated');
    });
  });

})();
