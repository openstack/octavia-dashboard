/*
 * Copyright 2016 IBM Corp.
 * Copyright 2017 Walmart.
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
    .factory('horizon.dashboard.project.lbaasv2.loadbalancers.actions.associate-ip',
      modalService);

  modalService.$inject = [
    '$q',
    '$uibModal',
    '$route',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.app.core.openstack-service-api.network',
    'horizon.framework.util.q.extensions',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.loadbalancers.actions.associate-ip
   *
   * @description
   * Provides the service for the Load Balancer Associate Floating IP action.
   *
   * @param $q The angular service for promises.
   * @param $uibModal The angular bootstrap $uibModal service.
   * @param $route The angular $route service.
   * @param basePath The LBaaS v2 module base path.
   * @param policy The horizon policy service.
   * @param network The horizon network API service.
   * @param qExtensions Horizon extensions to the $q service.
   * @param toastService The horizon toast service.
   * @param gettext The horizon gettext function for translation.
   *
   * @returns The Associate Floating IP modal service.
   */

  function modalService(
    $q,
    $uibModal,
    $route,
    basePath,
    policy,
    network,
    qExtensions,
    toastService,
    gettext
  ) {
    var service = {
      perform: open,
      allowed: allowed
    };

    return service;

    ////////////

    function allowed(item) {
      return $q.all([
        qExtensions.booleanAsPromise(item.floating_ip && !item.floating_ip.ip),
        // This rule is made up and should therefore always pass. At some point there will
        // likely be a valid rule similar to this that we will want to use.
        policy.ifAllowed({ rules: [['neutron', 'loadbalancer_associate_floating_ip']] })
      ]);
    }

    /**
     * @ngdoc method
     * @name open
     *
     * @description
     * Open the modal.
     *
     * @param item The row item from the table action.
     * @returns undefined
     */

    function open(item) {
      var spec = {
        backdrop: 'static',
        controller: 'AssociateFloatingIpModalController as modal',
        templateUrl: basePath + 'loadbalancers/actions/associate-ip/modal.html',
        resolve: {
          loadbalancer: function() {
            return item;
          },
          floatingIps: function() {
            return network.getFloatingIps().then(getResponseItems);
          },
          floatingIpPools: function() {
            return network.getFloatingIpPools().then(getResponseItems);
          }
        }
      };
      $uibModal.open(spec).result.then(onModalClose);
    }

    function onModalClose() {
      toastService.add('success', gettext('Associating floating IP with load balancer.'));
      $route.reload();
    }

    function getResponseItems(response) {
      return response.data.items;
    }

  }
})();
