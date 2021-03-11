/*
 * Copyright 2020 Red Hat, Inc.
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

  describe('Pool Details Step', function() {

    beforeEach(module('horizon.framework.util.i18n'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    describe('PoolDetailsController', function() {
      var ctrl, scope;

      beforeEach(inject(function($controller) {
        scope = {
          model: {
            context: {
              create_listener: true,
              create_pool: true,
              create_monitor: true
            }
          }
        };
        ctrl = $controller('PoolDetailsController', {
          $scope: scope
        });
      }));

      it('should define error messages for invalid fields', function() {
        expect(ctrl.tls_ciphersError).toBeDefined();
      });

      it('should update create_listener and create_monitor flags', function() {
        scope.model.context.create_pool = true;
        ctrl.createChange();
        expect(scope.model.context.create_listener).toBe(true);
        expect(scope.model.context.create_monitor).toBe(true);

        scope.model.context.create_pool = false;
        ctrl.createChange();
        expect(scope.model.context.create_listener).toBe(true);
        expect(scope.model.context.create_monitor).toBe(false);
      });

    });
  });
})();
