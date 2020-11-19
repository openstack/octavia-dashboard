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
(function() {
  'use strict';

  describe('Monitor Details Step', function() {

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    describe('MonitorDetailsController', function() {
      var ctrl, scope;

      beforeEach(inject(function($controller, $rootScope) {
        scope = $rootScope.$new();
        ctrl = $controller('MonitorDetailsController', {
          $scope: scope
        });
      }));

      it('should define error messages for invalid fields', function() {
        expect(ctrl.intervalError).toBeDefined();
        expect(ctrl.retryError).toBeDefined();
        expect(ctrl.timeoutError).toBeDefined();
        expect(ctrl.statusError).toBeDefined();
        expect(ctrl.pathError).toBeDefined();
      });

      it('should define patterns for field validation', function() {
        expect(ctrl.statusPattern).toBeDefined();
        expect(ctrl.urlPathPattern).toBeDefined();
      });

      it('should handle wizard event', function() {
        scope.$index = 2;
        scope.model = {
          spec: {
            listener: {
              protocol: 'TERMINATED_HTTPS'
            }
          }
        };
        scope.$broadcast('ON_SWITCH', {
          from: 1,
          to: 2
        });
        scope.model = {
          spec: {
            listener: {
              protocol: 'HTTP'
            }
          }
        };
        scope.$broadcast('ON_SWITCH', {
          from: 1,
          to: 2
        });
        scope.$broadcast('ON_SWITCH', {
          from: 2,
          to: 1
        });
      });

      it('should update create_pool and create_monitor flags', function() {
        scope.model = {
          context: {
            create_listener: false,
            create_pool: false,
            create_monitor: true
          }
        };
        ctrl.createChange();
        expect(scope.model.context.create_listener).toBe(true);
        expect(scope.model.context.create_pool).toBe(true);

        scope.model = {
          context: {
            create_listener: false,
            create_pool: false,
            create_monitor: false
          }
        };
        ctrl.createChange();
        expect(scope.model.context.create_listener).toBe(false);
        expect(scope.model.context.create_pool).toBe(false);
      });
    });
  });
})();
