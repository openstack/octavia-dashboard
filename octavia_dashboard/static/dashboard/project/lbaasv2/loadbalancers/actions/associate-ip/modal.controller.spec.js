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

  describe('LBaaS v2 Load Balancers Table Associate IP Controller', function() {
    var ctrl, network, floatingIps, floatingIpPools, $controller, $uibModalInstance;
    var associateFail = false;

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(function() {
      floatingIps = [{ id: 'ip1', ip: '1', fixed_ip: '1' },
                     { id: 'ip2', ip: '2' }];
      floatingIpPools = [{ id: 'pool1', name: 'pool' }];
    });

    beforeEach(module(function($provide) {
      var fakePromise = function(response, returnPromise) {
        return {
          then: function(success, fail) {
            if (fail && associateFail) {
              return fail();
            }
            var res = success(response);
            return returnPromise ? fakePromise(res) : res;
          }
        };
      };
      $provide.value('$uibModalInstance', {
        close: angular.noop,
        dismiss: angular.noop
      });
      $provide.value('loadbalancer', {
        vip_port_id: 'port',
        vip_address: 'address'
      });
      $provide.value('floatingIps', floatingIps);
      $provide.value('floatingIpPools', floatingIpPools);
      $provide.value('horizon.app.core.openstack-service-api.network', {
        allocateFloatingIp: function() {
          return fakePromise({ data: { id: 'foo' } }, true);
        },
        associateFloatingIp: function() {
          return fakePromise();
        }
      });
    }));

    beforeEach(inject(function ($injector) {
      network = $injector.get('horizon.app.core.openstack-service-api.network');
      $controller = $injector.get('$controller');
      $uibModalInstance = $injector.get('$uibModalInstance');
    }));

    it('should define controller properties', function() {
      ctrl = $controller('AssociateFloatingIpModalController');
      expect(ctrl.cancel).toBeDefined();
      expect(ctrl.save).toBeDefined();
      expect(ctrl.saving).toBe(false);
    });

    it('should initialize options', function() {
      ctrl = $controller('AssociateFloatingIpModalController');
      expect(ctrl.options.length).toBe(2);
      expect(ctrl.options[0].id).toBe('ip2');
      expect(ctrl.options[1].id).toBe('pool1');
    });

    it('should use ids instead of ip or name if not provided', function() {
      delete floatingIps[1].ip;
      delete floatingIpPools[0].name;
      ctrl = $controller('AssociateFloatingIpModalController');
      expect(ctrl.options.length).toBe(2);
      expect(ctrl.options[0].name).toBe('ip2');
      expect(ctrl.options[1].name).toBe('pool1');
    });

    it('should initialize selected option when only one option', function() {
      floatingIps[1].fixed_ip = '2';
      ctrl = $controller('AssociateFloatingIpModalController');
      expect(ctrl.options.length).toBe(1);
      expect(ctrl.selected).toBe(ctrl.options[0]);
    });

    it('should not initialize selected option when more than one option', function() {
      ctrl = $controller('AssociateFloatingIpModalController');
      expect(ctrl.options.length).toBe(2);
      expect(ctrl.selected).toBeNull();
    });

    it('should associate floating IP if floating IP selected', function() {
      ctrl = $controller('AssociateFloatingIpModalController');
      ctrl.selected = ctrl.options[0];
      associateFail = false;
      spyOn(network, 'associateFloatingIp').and.callThrough();
      spyOn($uibModalInstance, 'close');
      ctrl.save();
      expect(ctrl.saving).toBe(true);
      expect(network.associateFloatingIp).toHaveBeenCalledWith('ip2', 'port_address');
      expect($uibModalInstance.close).toHaveBeenCalled();
    });

    it('should allocate floating IP if floating IP pool selected', function() {
      ctrl = $controller('AssociateFloatingIpModalController');
      ctrl.selected = ctrl.options[1];
      associateFail = false;
      spyOn(network, 'allocateFloatingIp').and.callThrough();
      spyOn(network, 'associateFloatingIp').and.callThrough();
      spyOn($uibModalInstance, 'close');
      ctrl.save();
      expect(ctrl.saving).toBe(true);
      expect(network.allocateFloatingIp).toHaveBeenCalledWith('pool1');
      expect(network.associateFloatingIp).toHaveBeenCalledWith('foo', 'port_address');
      expect($uibModalInstance.close).toHaveBeenCalled();
    });

    it('should dismiss modal if cancel clicked', function() {
      ctrl = $controller('AssociateFloatingIpModalController');
      spyOn($uibModalInstance, 'dismiss');
      ctrl.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should not dismiss modal if save fails', function() {
      ctrl = $controller('AssociateFloatingIpModalController');
      ctrl.selected = ctrl.options[0];
      associateFail = true;
      spyOn($uibModalInstance, 'dismiss');
      ctrl.save();
      expect($uibModalInstance.dismiss).not.toHaveBeenCalled();
      expect(ctrl.saving).toBe(false);
    });

  });

})();
