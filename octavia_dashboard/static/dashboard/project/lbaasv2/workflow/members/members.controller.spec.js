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
    var model;

    beforeEach(module('horizon.framework.util.i18n'));
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
          port: 80,
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

    describe('MemberDetailsController', function() {
      var ctrl;

      beforeEach(inject(function($controller) {
        ctrl = $controller('MemberDetailsController', { $scope: { model: model } });
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
        expect(model.spec.members[0].subnet).toBeNull();
      });

      it('should allocate a given member', function() {
        ctrl.allocateMember(model.members[0]);
        expect(model.spec.members.length).toBe(1);
        expect(model.spec.members[0].id).toBe(0);
        expect(model.spec.members[0].address).toEqual(model.members[0].address);
        expect(model.spec.members[0].subnet).toBeUndefined();
        expect(model.spec.members[0].port).toEqual(model.members[0].port);
      });

      it('should deallocate a given member', function() {
        ctrl.deallocateMember(model.spec.members[0]);
        expect(model.spec.members.length).toBe(0);
      });

      it('should show subnet name for available instance', function() {
        var name = ctrl.getSubnetName(model.members[0]);
        expect(name).toBe('subnet-1');
      });
    });

    describe('Member Details Step Template', function() {
      var $scope, $element, popoverContent;

      beforeEach(module('templates'));
      beforeEach(module('horizon.dashboard.project.lbaasv2'));

      beforeEach(inject(function($injector) {
        var $compile = $injector.get('$compile');
        var $templateCache = $injector.get('$templateCache');
        var basePath = $injector.get('horizon.dashboard.project.lbaasv2.basePath');
        var popoverTemplates = $injector.get('horizon.dashboard.project.lbaasv2.popovers');
        var markup = $templateCache.get(basePath + 'workflow/members/members.html');
        $scope = $injector.get('$rootScope').$new();
        $scope.model = model;
        $element = $compile(markup)($scope);
        var popoverScope = $injector.get('$rootScope').$new();
        popoverScope.member = model.members[0];
        popoverContent = $compile(popoverTemplates.ipAddresses)(popoverScope);
      }));

      it('should show IP addresses popover on hover', function() {
        var ctrl = $element.scope().ctrl;
        ctrl.tableData.displayedAvailable = model.members;
        $scope.$apply();

        var popoverElement = $element.find('span.addresses-popover');
        expect(popoverElement.length).toBe(1);

        $.fn.popover = angular.noop;
        spyOn($.fn, 'popover');
        spyOn(ctrl, 'showAddressPopover').and.callThrough();
        popoverElement.trigger('mouseover');

        expect(ctrl.showAddressPopover).toHaveBeenCalledWith(
          jasmine.objectContaining({type: 'mouseover'}), model.members[0]);
        expect($.fn.popover.calls.count()).toBe(2);
        expect($.fn.popover.calls.argsFor(0)[0]).toEqual({
          content: popoverContent,
          html: true,
          placement: 'top',
          title: 'IP Addresses (2)'
        });
        expect($.fn.popover.calls.argsFor(1)[0]).toBe('show');

        spyOn(ctrl, 'hideAddressPopover').and.callThrough();
        popoverElement.trigger('mouseleave');

        expect(ctrl.hideAddressPopover)
          .toHaveBeenCalledWith(jasmine.objectContaining({type: 'mouseleave'}));
        expect($.fn.popover.calls.count()).toBe(3);
        expect($.fn.popover.calls.argsFor(2)[0]).toBe('hide');
      });
    });

  });
})();
