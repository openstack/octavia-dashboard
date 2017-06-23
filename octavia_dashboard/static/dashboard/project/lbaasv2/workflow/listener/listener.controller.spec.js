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

  describe('Listener Details Step', function() {

    beforeEach(module('horizon.framework.util.i18n'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    describe('ListenerDetailsController', function() {
      var ctrl, workflow, listener, scope;

      beforeEach(inject(function($controller) {
        workflow = {
          steps: [{ id: 'listener' }],
          certificatesStep: { id: 'certificates' },
          after: angular.noop,
          remove: angular.noop
        };
        listener = {
          protocol: null,
          port: 80
        };
        scope = {
          model: {
            listenerPorts: [80],
            members: [{port: ''}, {port: ''}],
            spec: {
              listener: listener,
              members: [{port: ''}, {port: ''}]
            }
          },
          workflow: workflow
        };
        ctrl = $controller('ListenerDetailsController', { $scope: scope });
      }));

      it('should define error messages for invalid fields', function() {
        expect(ctrl.portNumberError).toBeDefined();
        expect(ctrl.portUniqueError).toBeDefined();
      });

      it('should show certificates step if selecting TERMINATED_HTTPS', function() {
        workflow.steps.push(workflow.certificatesStep);
        spyOn(workflow, 'after');

        ctrl.protocolChange('TERMINATED_HTTPS');
        expect(workflow.after).not.toHaveBeenCalled();

        workflow.steps.splice(1, 1);
        ctrl.protocolChange('TERMINATED_HTTPS');
        expect(workflow.after).toHaveBeenCalledWith('listener', workflow.certificatesStep);
      });

      it('should hide certificates step if not selecting TERMINATED_HTTPS', function() {
        spyOn(workflow, 'remove');

        ctrl.protocolChange('HTTP');
        expect(workflow.remove).not.toHaveBeenCalled();

        workflow.steps.push(workflow.certificatesStep);
        ctrl.protocolChange('HTTP');
        expect(workflow.remove).toHaveBeenCalledWith('certificates');
      });

      it('should update port on protocol change to HTTP', function() {
        ctrl.protocolChange('HTTP');
        expect(listener.port).toBe(81);
      });

      it('should update port on protocol change to TERMINATED_HTTPS', function() {
        ctrl.protocolChange('TERMINATED_HTTPS');
        expect(listener.port).toBe(443);
      });

      it('should update port on protocol change to TCP', function() {
        ctrl.protocolChange('TCP');
        expect(listener.port).toBeUndefined();
      });

      it('should update member ports on protocol change to TERMINATED_HTTPS', function() {
        ctrl.protocolChange('TERMINATED_HTTPS');

        scope.model.members.concat(scope.model.spec.members).forEach(function(member) {
          expect(member.port).toBe(80);
        });
      });

      it('should update member ports on protocol change to HTTP', function() {
        ctrl.protocolChange('HTTP');

        scope.model.members.concat(scope.model.spec.members).forEach(function(member) {
          expect(member.port).toBe(80);
        });
      });

      it('should update member ports on protocol change to TCP', function() {
        ctrl.protocolChange('TCP');

        scope.model.members.concat(scope.model.spec.members).forEach(function(member) {
          expect(member.port).toBeUndefined();
        });
      });

    });
  });
})();
