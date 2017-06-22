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

  describe('LBaaS v2 Create Health Monitor Wizard Controller', function() {
    var ctrl;
    var model = {
      submit: function() {
        return 'created';
      },
      initialize: angular.noop
    };
    var workflow = function() {
      return 'foo';
    };
    var scope = {
      launchContext: {id: 'pool1'}
    };

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));
    beforeEach(module(function ($provide) {
      $provide.value('horizon.dashboard.project.lbaasv2.workflow.model', model);
      $provide.value('horizon.dashboard.project.lbaasv2.workflow.workflow', workflow);
    }));
    beforeEach(inject(function ($controller) {
      spyOn(model, 'initialize');
      ctrl = $controller('CreateHealthMonitorWizardController', { $scope: scope });
    }));

    it('defines the controller', function() {
      expect(ctrl).toBeDefined();
    });

    it('calls initialize on the given model', function() {
      expect(model.initialize).toHaveBeenCalled();
    });

    it('sets scope.workflow to the given workflow', function() {
      expect(scope.workflow).toBe('foo');
    });

    it('defines scope.submit', function() {
      expect(scope.submit).toBeDefined();
      expect(scope.submit()).toBe('created');
    });
  });

})();
