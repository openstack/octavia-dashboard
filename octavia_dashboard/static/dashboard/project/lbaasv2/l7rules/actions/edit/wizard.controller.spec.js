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

  describe('LBaaS v2 Edit L7Rule Wizard Controller', function() {
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
      steps: [{id: 'l7rule'}],
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
      scope.launchContext = { id: 'l7ruleId' };
      spyOn(model, 'initialize').and.callThrough();
      ctrl = $controller('EditL7RuleWizardController', {
        $scope: scope,
        $routeParams: {loadbalancerId: 'loadbalancerId', l7policyId: 'l7policyId'}});
    }));

    it('defines the controller', function() {
      expect(ctrl).toBeDefined();
    });

    it('calls initialize on the given model', function() {
      expect(model.initialize).toHaveBeenCalledWith(
        'l7rule', 'l7ruleId', 'loadbalancerId', 'l7policyId');
    });

    it('sets scope.workflow to the given workflow', function() {
      expect(scope.workflow).toBe(workflow);
    });

    it('initializes workflow with correct properties', function() {
      expect(workflowSpy).toHaveBeenCalledWith('Update L7 Rule',
        'fa fa-pencil', ['l7rule']);
    });

    it('defines scope.submit', function() {
      expect(scope.submit).toBe(model.submit);
      expect(scope.submit()).toBe('updated');
    });
  });

})();
