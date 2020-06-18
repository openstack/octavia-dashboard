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

  angular
    .module('horizon.dashboard.project.lbaasv2')
    .controller('LoadBalancerDetailsController', LoadBalancerDetailsController);

  LoadBalancerDetailsController.$inject = [
    'horizon.dashboard.project.lbaasv2.patterns',
    'horizon.framework.util.i18n.gettext',
    '$scope'
  ];

  /**
   * @ngdoc controller
   * @name LoadBalancerDetailsController
   * @description
   * The `LoadBalancerDetailsController` controller provides functions for
   * configuring the load balancers step of the LBaaS wizard.
   * @param {object} patterns The LBaaS v2 patterns constant.
   * @param {function} gettext The horizon gettext function for translation.
   * @param {object} $scope Allows access to the model
   * @returns {undefined} undefined
   */
  function LoadBalancerDetailsController(patterns, gettext, $scope) {
    var ctrl = this;

    // Error text for invalid fields
    ctrl.ipError = gettext('The IP address is not valid.');

    // IP address validation pattern
    ctrl.ipPattern = [patterns.ipv4, patterns.ipv6].join('|');

    // Defines columns for the subnet selection filtered pop-up
    ctrl.subnetColumns = [{
      label: gettext('Network'),
      value: function(subnet) {
        var network = $scope.model.networks[subnet.network_id];
        return network ? network.name : '';
      }
    }, {
      label: gettext('Network ID'),
      value: 'network_id'
    }, {
      label: gettext('Subnet'),
      value: 'name'
    }, {
      label: gettext('Subnet ID'),
      value: 'id'
    }, {
      label: gettext('CIDR'),
      value: 'cidr'
    }];

    ctrl.subnetOptions = [];

    ctrl.shorthand = function(subnet) {
      var network = $scope.model.networks[subnet.network_id];

      var networkText = network ? network.name : subnet.network_id.substring(0, 10) + '...';
      var cidrText = subnet.cidr;
      var subnetText = subnet.name || subnet.id.substring(0, 10) + '...';

      return networkText + ': ' + cidrText + ' (' + subnetText + ')';
    };

    ctrl.setSubnet = function(option) {
      if (option) {
        $scope.model.spec.loadbalancer.vip_subnet_id = option;
      } else {
        $scope.model.spec.loadbalancer.vip_subnet_id = null;
      }
    };

    // Defines columns for the flavor selection filtered pop-up
    ctrl.flavorColumns = [{
      label: gettext('Flavor'),
      value: 'name'
    }, {
      label: gettext('Flavor ID'),
      value: 'id'
    }, {
      label: gettext('Flavor Description'),
      value: 'description'
    }];

    ctrl.flavorOptions = [];

    ctrl.flavorShorthand = function(flavor) {
      var flavorText = flavor.name || flavor.id.substring(0, 10) + '...';
      var flavorDescription = flavor.description || '';

      return flavorText + ': ' + flavorDescription;
    };

    ctrl.setFlavor = function(option) {
      if (option) {
        $scope.model.spec.loadbalancer.flavor_id = option;
      } else {
        $scope.model.spec.loadbalancer.flavor_id = null;
      }
    };

    // Defines columns for the availability_zone selection filtered pop-up
    ctrl.availabilityZoneColumns = [{
      label: gettext('Availability Zone'),
      value: 'name'
    }];

    ctrl.availabilityZoneOptions = [];

    ctrl.availabilityZoneShorthand = function(availabilityZone) {
      return availabilityZone.name;
    };

    ctrl.setAvailabilityZone = function(option) {
      if (option) {
        $scope.model.spec.loadbalancer.availability_zone = option;
      } else {
        $scope.model.spec.loadbalancer.availability_zone = null;
      }
    };

    ctrl.dataLoaded = false;
    ctrl._checkLoaded = function() {
      if ($scope.model.initialized) {
        ctrl.buildSubnetOptions();
        ctrl.buildFlavorOptions();
        ctrl.buildAvailabilityZoneOptions();
        ctrl.dataLoaded = true;
      }
    };

    /*
    The watchers in this component are a bit of a workaround for the way
    data is loaded asynchornously in the model service. First data loads
    are marked by a change of 'model.initialized' from false to true, which
    should replace the striped loading bar with a functional dropdown.

    Additional changes to networks and subnets have to be watched even after
    first loads, however, as those changes need to be applied to the select
    options
    */
    ctrl.$onInit = function() {
      $scope.$watchCollection('model.subnets', function() {
        ctrl._checkLoaded();
      });
      $scope.$watchCollection('model.networks', function() {
        ctrl._checkLoaded();
      });
      $scope.$watchCollection('model.flavors', function() {
        ctrl._checkLoaded();
      });
      $scope.$watchCollection('model.availability_zones', function() {
        ctrl._checkLoaded();
      });
      $scope.$watch('model.initialized', function() {
        ctrl._checkLoaded();
      });
    };

    ctrl.buildSubnetOptions = function() {
      // Subnets are sliced to maintain data immutability
      ctrl.subnetOptions = $scope.model.subnets.slice(0);
    };

    ctrl.buildFlavorOptions = function() {
      ctrl.flavorOptions = Object.keys($scope.model.flavors).filter(function(key) {
        return $scope.model.flavors[key].is_enabled;
      }).map(function(key) {
        return $scope.model.flavors[key];
      });
    };
    ctrl.buildAvailabilityZoneOptions = function() {
      ctrl.availabilityZoneOptions = Object.keys(
        $scope.model.availability_zones).filter(function(key) {
          return $scope.model.availability_zones[key].is_enabled;
        }).map(function(key) {
          return $scope.model.availability_zones[key];
        });
    };
  }
})();
