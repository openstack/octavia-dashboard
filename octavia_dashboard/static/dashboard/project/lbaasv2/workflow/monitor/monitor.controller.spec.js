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
      var ctrl;

      beforeEach(inject(function($controller) {
        ctrl = $controller('MonitorDetailsController');
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

    });
  });
})();
