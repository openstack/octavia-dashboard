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

  describe('Load Balancer Details Step', function() {

    beforeEach(module('horizon.framework.util.i18n'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    describe('LoadBalancerDetailsController', function() {
      var ctrl, scope, mockSubnets, mockFlavors, mockAvailabilityZones;
      beforeEach(inject(function($controller, $rootScope) {
        mockSubnets = [{
          id: '7262744a-e1e4-40d7-8833-18193e8de191',
          network_id: '5d658cef-3402-4474-bb8a-0c1162efd9a9',
          name: 'subnet_1',
          cidr: '1.1.1.1/24'
        }, {
          id: 'd8056c7e-c810-4ee5-978e-177cb4154d81',
          network_id: '12345678-0000-0000-0000-000000000000',
          name: 'subnet_2',
          cidr: '2.2.2.2/16'
        }, {
          id: 'd8056c7e-c810-4ee5-978e-177cb4154d81',
          network_id: '12345678-0000-0000-0000-000000000000',
          name: '',
          cidr: '2.2.2.2/16'
        }];

        mockFlavors = [{
          id: '15d990e1-3438-4073-89b8-6e4706f0b176',
          flavor_profile_id: '79e16118-daba-4255-9d1d-9cc7812e18a1',
          name: 'flavor_1',
          description: 'Flavor 1 description',
          is_enabled: true
        }, {
          id: 'b0703ed4-dd30-4dbe-92bb-dccc945365e9',
          flavor_profile_id: 'ace487e6-9946-4bdc-882e-c889af43fc3b',
          name: 'flavor_2',
          is_enabled: true
        }, {
          id: '94306089-567a-44ed-ab16-87653adbece3',
          flavor_profile_id: 'b272d5fb-0021-4002-beb5-db758e59a763',
          name: '',
          is_enabled: true
        }];

        mockAvailabilityZones = [{
          id: '11eddb23-1f01-4926-9af7-36d9a8938ae4',
          availability_zone_profile_id: 'f44f46ee-5f19-4515-b930-b62c9649081d',
          name: 'az_1',
          description: 'AZ 1 description',
          is_enabled: true
        }, {
          id: '2a83c5f3-c2e6-44cb-ac02-e06617c2b7ca',
          availability_zone_profile_id: '52dacdb9-c20d-4f49-9c0a-a957befaf27a',
          name: 'az_2',
          description: 'AZ 2 description',
          is_enabled: true
        }, {
          id: 'ff89a83c-3819-44e6-8383-f42d3a270f5f',
          availability_zone_profile_id: '9fe93b65-85cc-4f86-a2d9-45f78eb909d0',
          name: 'az_3',
          description: 'AZ 3 description',
          is_enabled: true
        }];

        scope = $rootScope.$new();
        scope.model = {
          networks: {
            '5d658cef-3402-4474-bb8a-0c1162efd9a9': {
              id: '5d658cef-3402-4474-bb8a-0c1162efd9a9',
              name: 'network_1'
            }
          },
          flavors: {
            '15d990e1-3438-4073-89b8-6e4706f0b176': {
              id: '15d990e1-3438-4073-89b8-6e4706f0b176',
              name: 'flavor_1',
              flavor_profile_id: '79e16118-daba-4255-9d1d-9cc7812e18a1',
              is_enabled: true
            }
          },
          availability_zones: {
            '11eddb23-1f01-4926-9af7-36d9a8938ae4': {
              id: '11eddb23-1f01-4926-9af7-36d9a8938ae4',
              availability_zone_profile_id: 'f44f46ee-5f19-4515-b930-b62c9649081d',
              name: 'az_1',
              description: 'AZ 1 description',
              is_enabled: true
            }
          },
          subnets: [{}, {}],
          spec: {
            loadbalancer: {
              vip_subnet_id: null
            }
          },
          initialized: false
        };

        ctrl = $controller('LoadBalancerDetailsController', {$scope: scope});

        spyOn(ctrl, 'buildSubnetOptions').and.callThrough();
        spyOn(ctrl, 'buildFlavorOptions').and.callThrough();
        spyOn(ctrl, 'buildAvailabilityZoneOptions').and.callThrough();
        spyOn(ctrl, '_checkLoaded').and.callThrough();
      }));

      it('should define error messages for invalid fields', function() {
        expect(ctrl.ipError).toBeDefined();
      });

      it('should define patterns for field validation', function() {
        expect(ctrl.ipPattern).toBeDefined();
      });

      it('should create shorthand text', function() {
        // Full values
        expect(ctrl.shorthand(mockSubnets[0])).toBe(
          'network_1: 1.1.1.1/24 (subnet_1)'
        );
        // No network name
        expect(ctrl.shorthand(mockSubnets[1])).toBe(
          '12345678-0...: 2.2.2.2/16 (subnet_2)'
        );
        // No network and subnet names
        expect(ctrl.shorthand(mockSubnets[2])).toBe(
          '12345678-0...: 2.2.2.2/16 (d8056c7e-c...)'
        );
      });

      it('should create flavor shorthand text', function() {
        expect(ctrl.flavorShorthand(mockFlavors[0])).toBe(
          'flavor_1: Flavor 1 description'
        );
        expect(ctrl.flavorShorthand(mockFlavors[1])).toBe(
          'flavor_2: '
        );
        expect(ctrl.flavorShorthand(mockFlavors[2])).toBe(
          '94306089-5...: '
        );
      });

      it('should create az shorthand text', function() {
        expect(ctrl.availabilityZoneShorthand(mockAvailabilityZones[0])).toBe(
          'az_1'
        );
        expect(ctrl.availabilityZoneShorthand(mockAvailabilityZones[1])).toBe(
          'az_2'
        );
        expect(ctrl.availabilityZoneShorthand(mockAvailabilityZones[2])).toBe(
          'az_3'
        );
      });

      it('should set subnet', function() {
        ctrl.setSubnet(mockSubnets[0]);
        expect(scope.model.spec.loadbalancer.vip_subnet_id).toBe(mockSubnets[0]);
        ctrl.setSubnet(null);
        expect(scope.model.spec.loadbalancer.vip_subnet_id).toBe(null);
      });

      it('should set flavor', function() {
        ctrl.setFlavor(mockFlavors[0]);
        expect(scope.model.spec.loadbalancer.flavor_id).toBe(mockFlavors[0]);
        ctrl.setFlavor(null);
        expect(scope.model.spec.loadbalancer.flavor_id).toBe(null);
      });

      it('should set availability zone', function() {
        ctrl.setAvailabilityZone(mockAvailabilityZones[0]);
        expect(scope.model.spec.loadbalancer.availability_zone).toBe(mockAvailabilityZones[0]);
        ctrl.setAvailabilityZone(null);
        expect(scope.model.spec.loadbalancer.availability_zone).toBe(null);
      });

      it('should initialize watchers', function() {
        ctrl.$onInit();

        scope.model.subnets = [];
        scope.$apply();
        expect(ctrl._checkLoaded).toHaveBeenCalled();

        scope.model.networks = {};
        scope.$apply();
        expect(ctrl._checkLoaded).toHaveBeenCalled();

        scope.model.flavors = {};
        scope.$apply();
        expect(ctrl._checkLoaded).toHaveBeenCalled();

        scope.model.availability_zones = {};
        scope.$apply();
        expect(ctrl._checkLoaded).toHaveBeenCalled();

        scope.model.initialized = true;

        scope.$apply();
        expect(ctrl._checkLoaded).toHaveBeenCalled();
      });

      it('should initialize networks watcher', function() {
        ctrl.$onInit();

        scope.model.networks = {};
        scope.$apply();
        //expect(ctrl.buildSubnetOptions).toHaveBeenCalled();
      });

      it('should build subnetOptions', function() {
        ctrl.buildSubnetOptions();

        expect(ctrl.subnetOptions).not.toBe(scope.model.subnets);
        expect(ctrl.subnetOptions).toEqual(scope.model.subnets);
      });

      it('should produce column data', function() {
        expect(ctrl.subnetColumns).toBeDefined();

        var networkLabel1 = ctrl.subnetColumns[0].value(mockSubnets[0]);
        expect(networkLabel1).toBe('network_1');

        var networkLabel2 = ctrl.subnetColumns[0].value(mockSubnets[1]);
        expect(networkLabel2).toBe('');

        expect(ctrl.subnetColumns[1].label).toBe('Network ID');
        expect(ctrl.subnetColumns[1].value).toBe('network_id');

        expect(ctrl.subnetColumns[2].label).toBe('Subnet');
        expect(ctrl.subnetColumns[2].value).toBe('name');

        expect(ctrl.subnetColumns[3].label).toBe('Subnet ID');
        expect(ctrl.subnetColumns[3].value).toBe('id');

        expect(ctrl.subnetColumns[4].label).toBe('CIDR');
        expect(ctrl.subnetColumns[4].value).toBe('cidr');
      });

      it('should react to data being loaded', function() {
        ctrl._checkLoaded();
        expect(ctrl.buildSubnetOptions).not.toHaveBeenCalled();
        expect(ctrl.dataLoaded).toBe(false);

        scope.model.initialized = true;
        ctrl._checkLoaded();
        expect(ctrl.buildSubnetOptions).toHaveBeenCalled();
        expect(ctrl.dataLoaded).toBe(true);
      });

      it('should initialize flavors watcher', function() {
        ctrl.$onInit();

        scope.model.flavors = {};
        scope.$apply();
        //expect(ctrl.buildSubnetOptions).toHaveBeenCalled();
      });

      it('should initialize availability zone watcher', function() {
        ctrl.$onInit();

        scope.model.availability_zones = {};
        scope.$apply();
        //expect(ctrl.buildSubnetOptions).toHaveBeenCalled();
      });

      it('should produce flavor column data', function() {
        expect(ctrl.flavorColumns).toBeDefined();

        expect(ctrl.flavorColumns[0].label).toBe('Flavor');
        expect(ctrl.flavorColumns[0].value).toBe('name');

        expect(ctrl.flavorColumns[1].label).toBe('Flavor ID');
        expect(ctrl.flavorColumns[1].value).toBe('id');

        expect(ctrl.flavorColumns[2].label).toBe('Flavor Description');
        expect(ctrl.flavorColumns[2].value).toBe('description');
      });

      it('should produce availability zone column data', function() {
        expect(ctrl.availabilityZoneColumns).toBeDefined();

        expect(ctrl.availabilityZoneColumns[0].label).toBe('Availability Zone');
        expect(ctrl.availabilityZoneColumns[0].value).toBe('name');
      });

    });
  });
})();
