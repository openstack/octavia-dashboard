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
    .factory('horizon.dashboard.project.lbaasv2.loadbalancers.service', loadBalancersService);

  loadBalancersService.$inject = [
    '$q',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc service
   * @name horizon.dashboard.project.lbaasv2.loadbalancers.service
   * @description General service for LBaaS v2 load balancers.
   * @param $q The angular service for promises.
   * @param api The LBaaS V2 service API.
   * @param gettext The horizon gettext function for translation.
   * @returns The load balancers service.
   */

  function loadBalancersService($q, api, gettext) {
    var operatingStatus = {
      ONLINE: gettext('Online'),
      OFFLINE: gettext('Offline'),
      DEGRADED: gettext('Degraded'),
      ERROR: gettext('Error')
    };

    var provisioningStatus = {
      ACTIVE: gettext('Active'),
      INACTIVE: gettext('Inactive'),
      PENDING_CREATE: gettext('Pending Create'),
      PENDING_UPDATE: gettext('Pending Update'),
      PENDING_DELETE: gettext('Pending Delete'),
      ERROR: gettext('Error')
    };

    var service = {
      operatingStatus: operatingStatus,
      provisioningStatus: provisioningStatus,
      isActionable: isActionable
    };

    return service;

    ////////////

    /**
     * @ngdoc method
     * @name horizon.dashboard.project.lbaasv2.loadbalancers.service.isActionable
     * @description Returns a promise that is resolved if the load balancer is in a state that
     * allows for it or child resources to be updated or deleted.
     * @param id The load balancer id.
     * @returns {Promise}
     */

    function isActionable(id) {
      return api.getLoadBalancer(id).then(function onLoad(response) {
        if (['ACTIVE', 'ERROR'].indexOf(response.data.provisioning_status) < 0) {
          return $q.reject();
        }
      });
    }
  }
}());
