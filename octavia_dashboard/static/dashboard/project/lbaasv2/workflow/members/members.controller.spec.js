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

  describe('Member Details Step', function() {
    var model, ctrl;

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(function() {
      model = {
        spec: {
          members: [],
          pool: {
            protocol: 'HTTP'
          }
        },
        members: [{
          id: '1',
          name: 'foo',
          description: 'bar',
          weight: 1,
          protocol_port: 80,
          address: { ip: '1.2.3.4', subnet: '1' },
          addresses: [{ ip: '1.2.3.4', subnet: '1' },
                      { ip: '2.3.4.5', subnet: '2' }]
        }],
        subnets: [{
          id: '1',
          name: 'subnet-1'
        }]
      };
    });

    beforeEach(inject(function($controller, $rootScope) {
      var scope = $rootScope.$new();
      scope.model = model;
      ctrl = $controller('MemberDetailsController', { $scope: scope });
      $.fn.popover = angular.noop;
      spyOn($.fn, 'popover');
    }));

    it('should define error messages for invalid fields', function() {
      expect(ctrl.portError).toBeDefined();
      expect(ctrl.weightError).toBeDefined();
      expect(ctrl.ipError).toBeDefined();
    });

    it('should define patterns for validation', function() {
      expect(ctrl.ipPattern).toBeDefined();
    });

    it('should define transfer table properties', function() {
      expect(ctrl.tableData).toBeDefined();
      expect(ctrl.tableLimits).toBeDefined();
      expect(ctrl.tableHelp).toBeDefined();
    });

    it('should have available members', function() {
      expect(ctrl.tableData.available).toBeDefined();
      expect(ctrl.tableData.available.length).toBe(1);
      expect(ctrl.tableData.available[0].id).toBe('1');
    });

    it('should not have allocated members', function() {
      expect(ctrl.tableData.allocated).toEqual([]);
    });

    it('should allow adding multiple members', function() {
      expect(ctrl.tableLimits.maxAllocation).toBe(-1);
    });

    it('should properly format address popover target', function() {
      var target = ctrl.addressPopoverTarget(model.members[0]);
      expect(target).toBe('1.2.3.4...');
    });

    it('should allocate a new external member', function() {
      ctrl.allocateExternalMember();
      expect(model.spec.members.length).toBe(1);
      expect(model.spec.members[0].id).toBe(0);
      expect(model.spec.members[0].address).toBeNull();
      expect(model.spec.members[0].subnet_id).toBeNull();
    });

    it('should allocate a given member', function() {
      ctrl.allocateMember(model.members[0]);
      expect(model.spec.members.length).toBe(1);
      expect(model.spec.members[0].id).toBe(0);
      expect(model.spec.members[0].address).toEqual(model.members[0].address);
      expect(model.spec.members[0].subnet_id).toBeUndefined();
      expect(model.spec.members[0].protocol_port).toEqual(model.members[0].protocol_port);
    });

    it('should deallocate a given member', function() {
      ctrl.deallocateMember(model.spec.members[0]);
      expect(model.spec.members.length).toBe(0);
    });

    it('should show subnet name for available instance', function() {
      var name = ctrl.getSubnetName(model.members[0]);
      expect(name).toBe('subnet-1');
    });

    it('should show IP addresses popover', function() {
      ctrl.showAddressPopover({ target: 'foo' }, model.members[0]);
      expect($.fn.popover.calls.count()).toBe(2);
      expect($.fn.popover.calls.argsFor(0)[0]).toEqual({
        content: jasmine.any(Object),
        html: true,
        placement: 'top',
        title: 'IP Addresses (2)'
      });
      expect($.fn.popover.calls.argsFor(1)[0]).toBe('show');
    });

    it('should hide IP addresses popover', function() {
      ctrl.hideAddressPopover({ target: 'foo' });
      expect($.fn.popover).toHaveBeenCalledWith('hide');
    });

  });
})();
