/*
 * Copyright 2015 IBM Corp.
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

  describe('LBaaS v2 Workflow Service', function() {
    var workflowService, $q;

    beforeEach(module('horizon.app.core'));
    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.widgets.toast'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(inject(function ($injector) {
      workflowService = $injector.get(
        'horizon.dashboard.project.lbaasv2.workflow.workflow'
      );
      $q = $injector.get('$q');
    }));

    it('should be defined', function () {
      expect(workflowService).toBeDefined();
    });

    it('should have a title property', function () {
      var workflow = workflowService('My Workflow');
      expect(workflow.title).toBe('My Workflow');
    });

    it('should have default steps defined', function () {
      var workflow = workflowService('My Workflow');
      expect(workflow.steps).toBeDefined();
      expect(workflow.steps.length).toBe(8);

      var forms = [
        'loadBalancerDetailsForm',
        'listenerDetailsForm',
        'l7policyDetailsForm',
        'l7ruleDetailsForm',
        'poolDetailsForm',
        'memberDetailsForm',
        'monitorDetailsForm',
        'certificateDetailsForm'
      ];

      forms.forEach(function(expectedForm, idx) {
        expect(workflow.steps[idx].formName).toBe(expectedForm);
      });
      workflow = workflowService('My Workflow', 'foo', []);
      forms.forEach(function(expectedForm, idx) {
        expect(workflow.steps[idx].formName).toBe(expectedForm);
      });
    });

    it('can filter steps', function () {
      var workflow = workflowService('My Workflow', 'foo', ['listener', 'pool']);
      expect(workflow.steps).toBeDefined();
      expect(workflow.steps.length).toBe(2);
      expect(workflow.steps[0].checkReadiness).not.toBeDefined();

      var forms = [
        'listenerDetailsForm',
        'poolDetailsForm'
      ];

      forms.forEach(function(expectedForm, idx) {
        expect(workflow.steps[idx].formName).toBe(expectedForm);
      });
    });

    it('can wait for all steps to be ready', function () {
      var steps = ['listener', 'certificates'].map(function(step) {
        return {
          id: step,
          deferred: $q.defer()
        };
      });
      var workflow = workflowService('My Workflow', 'foo', steps);

      expect(workflow.steps[0].checkReadiness).toBeDefined();
      expect(workflow.steps[0].checkReadiness()).toBe(steps[0].deferred.promise);
      expect(workflow.steps[1].checkReadiness).toBeDefined();
      expect(workflow.steps[1].checkReadiness()).toBe(steps[1].deferred.promise);
    });

    it('can be extended', function () {
      var workflow = workflowService('My Workflow');
      expect(workflow.append).toBeDefined();
      expect(workflow.prepend).toBeDefined();
      expect(workflow.after).toBeDefined();
      expect(workflow.replace).toBeDefined();
      expect(workflow.remove).toBeDefined();
      expect(workflow.addController).toBeDefined();
    });

  });
})();
