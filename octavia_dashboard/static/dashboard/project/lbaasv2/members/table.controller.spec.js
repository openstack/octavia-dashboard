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

  describe('LBaaS v2 Members Table Controller', function() {
    var controller, lbaasv2API, scope;
    var items = [{ foo: 'bar' }];
    var apiFail = false;

    function fakeAPI() {
      return {
        then: function(success, fail) {
          if (apiFail && fail) {
            fail();
          } else {
            success({ data: { items: items } });
          }
        }
      };
    }

    ///////////////////////

    beforeEach(module('horizon.framework.widgets.toast'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {});
    }));

    beforeEach(inject(function($injector) {
      lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      controller = $injector.get('$controller');
      spyOn(lbaasv2API, 'getMembers').and.callFake(fakeAPI);
    }));

    function createController() {
      return controller('MembersTableController', {
        $scope: scope,
        $routeParams: {
          loadbalancerId: 'loadbaancerId',
          listenerId: 'listenerId',
          poolId: 'poolId'
        }});
    }

    it('should initialize correctly', function() {
      var ctrl = createController();
      expect(ctrl.items).toEqual([]);
      expect(ctrl.src).toEqual(items);
      expect(ctrl.loading).toBe(false);
      expect(ctrl.error).toBe(false);
      expect(ctrl.checked).toEqual({});
      expect(ctrl.loadbalancerId).toBeDefined();
      expect(ctrl.listenerId).toBeDefined();
      expect(ctrl.poolId).toBeDefined();
      expect(ctrl.batchActions).toBeDefined();
    });

    it('should invoke lbaasv2 apis', function() {
      var ctrl = createController();
      expect(lbaasv2API.getMembers).toHaveBeenCalled();
      expect(ctrl.src.length).toBe(1);
    });

    it('should show error if loading fails', function() {
      apiFail = true;
      var ctrl = createController();
      expect(ctrl.src.length).toBe(0);
      expect(ctrl.error).toBe(true);
    });

  });
})();
