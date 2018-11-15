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
      var ctrl, scope, mockSubnets;
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

        scope = $rootScope.$new();
        scope.model = {
          networks: {
            '5d658cef-3402-4474-bb8a-0c1162efd9a9': {
              id: '5d658cef-3402-4474-bb8a-0c1162efd9a9',
              name: 'network_1'
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

      it('should set subnet', function() {
        ctrl.setSubnet(mockSubnets[0]);
        expect(scope.model.spec.loadbalancer.vip_subnet_id).toBe(mockSubnets[0]);
        ctrl.setSubnet(null);
        expect(scope.model.spec.loadbalancer.vip_subnet_id).toBe(null);
      });

      it('should initialize watchers', function() {
        ctrl.$onInit();

        scope.model.subnets = [];
        scope.$apply();
        expect(ctrl._checkLoaded).toHaveBeenCalled();

        scope.model.networks = {};
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
    });
  });
})();
