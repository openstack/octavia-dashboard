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

  angular
    .module('horizon.dashboard.project.lbaasv2')
    .controller('MemberDetailsController', MemberDetailsController);

  MemberDetailsController.$inject = [
    '$scope',
    '$compile',
    'horizon.dashboard.project.lbaasv2.popovers',
    'horizon.dashboard.project.lbaasv2.patterns',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc controller
   * @name MemberDetailsController
   * @description
   * The `MemberDetailsController` controller provides functions for adding members to a pool.
   * @param $scope The angular scope object.
   * @param $compile The angular compile service.
   * @param popoverTemplates LBaaS v2 popover templates constant.
   * @param patterns The LBaaS v2 patterns constant.
   * @param gettext The horizon gettext function for translation.
   * @returns undefined
   */

  function MemberDetailsController($scope, $compile, popoverTemplates, patterns, gettext) {
    var ctrl = this;
    var memberCounter = 0;

    // Error text for invalid fields
    ctrl.portError = gettext('The port must be a number between 1 and 65535.');
    ctrl.weightError = gettext('The weight must be a number between 0 and 256.');
    ctrl.ipError = gettext('The IP address is not valid.');

    // Instances transer table widget properties
    ctrl.tableData = {
      available: $scope.model.members,
      allocated: $scope.model.spec.members,
      displayedAvailable: [],
      displayedAllocated: []
    };
    ctrl.tableLimits = {
      maxAllocation: -1
    };
    ctrl.tableHelp = {
      availHelpText: '',
      noneAllocText: gettext('No members have been allocated'),
      noneAvailText: gettext('No available instances'),
      allocTitle: gettext('Allocated Members'),
      availTitle: gettext('Available Instances')
    };

    // IP address validation pattern
    ctrl.ipPattern = [patterns.ipv4, patterns.ipv6].join('|');

    // Functions to control the IP address popover
    ctrl.showAddressPopover = showAddressPopover;
    ctrl.hideAddressPopover = hideAddressPopover;
    ctrl.addressPopoverTarget = addressPopoverTarget;

    // Member management
    ctrl.allocateExternalMember = allocateExternalMember;
    ctrl.allocateMember = allocateMember;
    ctrl.deallocateMember = deallocateMember;

    ctrl.getSubnetName = getSubnetName;

    //////////

    function showAddressPopover(event, member) {
      var element = angular.element(event.target);
      var scope = $scope.$new(true);
      scope.member = member;
      element.popover({
        content: $compile(popoverTemplates.ipAddresses)(scope),
        html: true,
        placement: 'top',
        title: interpolate(gettext('IP Addresses (%(count)s)'),
                           { count: member.addresses.length }, true)
      });
      element.popover('show');
    }

    function hideAddressPopover(event) {
      var element = angular.element(event.target);
      element.popover('hide');
    }

    function addressPopoverTarget(member) {
      return interpolate(gettext('%(ip)s...'), { ip: member.address.ip }, true);
    }

    function allocateExternalMember() {
      var protocol = $scope.model.spec.pool.protocol;
      $scope.model.spec.members.push({
        id: memberCounter++,
        address: null,
        subnet_id: null,
        protocol_port: { HTTP: 80 }[protocol],
        weight: 1,
        monitor_address: null,
        monitor_port: null,
        admin_state_up: true,
        backup: false,
        name: null
      });
    }

    function allocateMember(member) {
      var newMember = angular.extend(angular.copy(member), { id: memberCounter++ });
      $scope.model.spec.members.push(newMember);
    }

    function deallocateMember(member) {
      var index = $scope.model.spec.members.indexOf(member);
      $scope.model.spec.members.splice(index, 1);
    }

    function getSubnetName(member) {
      return $scope.model.subnets.filter(function filterSubnet(subnet) {
        return subnet.id === member.address.subnet;
      })[0].name;
    }
  }
})();
