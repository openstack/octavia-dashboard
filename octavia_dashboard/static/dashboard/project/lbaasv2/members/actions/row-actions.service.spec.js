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

  describe('LBaaS v2 Members Row Actions Service', function() {
    var actions;

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(inject(function ($injector) {
      var rowActionsService = $injector.get(
        'horizon.dashboard.project.lbaasv2.members.actions.rowActions');
      actions = rowActionsService.init('1', '2').actions();
      var loadbalancerService = $injector.get(
          'horizon.dashboard.project.lbaasv2.loadbalancers.service');
      spyOn(loadbalancerService, 'isActionable').and.returnValue(true);
    }));

    it('should define correct table row actions', function() {
      expect(actions.length).toBe(1);
      expect(actions[0].template.text).toBe('Update Weight');
    });

    it('should have the "allowed" and "perform" functions', function() {
      actions.forEach(function(action) {
        expect(action.service.allowed).toBeDefined();
        expect(action.service.perform).toBeDefined();
      });
    });

  });
})();
