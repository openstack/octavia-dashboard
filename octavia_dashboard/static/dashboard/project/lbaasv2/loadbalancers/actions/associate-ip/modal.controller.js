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
    .module('horizon.dashboard.project.lbaasv2.loadbalancers')
    .controller('AssociateFloatingIpModalController', AssociateFloatingIpModalController);

  AssociateFloatingIpModalController.$inject = [
    '$uibModalInstance',
    'horizon.app.core.openstack-service-api.network',
    'horizon.framework.util.i18n.gettext',
    // Dependencies injected with resolve by $uibModal.open
    'loadbalancer',
    'floatingIps',
    'floatingIpPools'
  ];

  /**
   * @ngdoc controller
   * @name AssociateFloatingIpModalController
   * @description
   * Controller used by the modal service for associating a floating IP address to a
   * load balancer.
   *
   * @param $uibModalInstance The angular bootstrap $uibModalInstance service.
   * @param api The horizon network API service.
   * @param gettext The horizon gettext function for translation.
   * @param loadbalancer The load balancer to associate the floating IP with.
   * @param floatingIps List of available floating IP addresses.
   * @param floatingIpPools List of available floating IP pools.
   *
   * @returns The Associate Floating IP modal controller.
   */

  function AssociateFloatingIpModalController(
    $uibModalInstance, api, gettext, loadbalancer, floatingIps, floatingIpPools
  ) {
    var ctrl = this;
    var port = loadbalancer.vip_port_id + '_' + loadbalancer.vip_address;

    ctrl.cancel = cancel;
    ctrl.save = save;
    ctrl.saving = false;
    ctrl.options = initOptions();
    ctrl.selected = ctrl.options.length === 1 ? ctrl.options[0] : null;

    function save() {
      ctrl.saving = true;
      if (ctrl.selected.type === 'pool') {
        allocateIpAddress(ctrl.selected.id);
      } else {
        associateIpAddress(ctrl.selected.id);
      }
    }

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }

    function onSuccess() {
      $uibModalInstance.close();
    }

    function onFailure() {
      ctrl.saving = false;
    }

    function initOptions() {
      var options = [];
      floatingIps.forEach(function addFloatingIp(ip) {
        // Only show floating IPs that are not already associated with a fixed IP
        if (!ip.fixed_ip) {
          options.push({
            id: ip.id,
            name: ip.ip || ip.id,
            type: 'ip',
            group: gettext('Floating IP addresses')
          });
        }
      });
      floatingIpPools.forEach(function addFloatingIpPool(pool) {
        options.push({
          id: pool.id,
          name: pool.name || pool.id,
          type: 'pool',
          group: gettext('Floating IP pools')
        });
      });
      return options;
    }

    function allocateIpAddress(poolId) {
      return api.allocateFloatingIp(poolId).then(getId).then(associateIpAddress);
    }

    function associateIpAddress(addressId) {
      return api.associateFloatingIp(addressId, port).then(onSuccess, onFailure);
    }

    function getId(response) {
      return response.data.id;
    }
  }
})();
