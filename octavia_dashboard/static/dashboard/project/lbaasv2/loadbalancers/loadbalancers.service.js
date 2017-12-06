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
    .factory('horizon.dashboard.project.lbaasv2.loadbalancers.service', loadBalancersService);

  loadBalancersService.$inject = [
    '$q',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc service
   * @name horizon.dashboard.project.lbaasv2.loadbalancers.service
   *
   * @description General service for LBaaS v2 load balancers.
   *
   * @param $q The angular service for promises.
   * @param api The LBaaS V2 service API.
   * @param gettext The horizon gettext function for translation.
   *
   * @returns The load balancers service.
   */

  function loadBalancersService($q, api, gettext) {
    var operatingStatus = {
      ONLINE: gettext('Online'),
      OFFLINE: gettext('Offline'),
      DEGRADED: gettext('Degraded'),
      ERROR: gettext('Error'),
      NO_MONITOR: gettext('No Monitor')
    };

    var provisioningStatus = {
      ACTIVE: gettext('Active'),
      INACTIVE: gettext('Inactive'),
      PENDING_CREATE: gettext('Pending Create'),
      PENDING_UPDATE: gettext('Pending Update'),
      PENDING_DELETE: gettext('Pending Delete'),
      ERROR: gettext('Error')
    };

    var loadBalancerAlgorithm = {
      ROUND_ROBIN: gettext('Round Robin'),
      LEAST_CONNECTIONS: gettext('Least Connections'),
      SOURCE_IP: gettext('Source IP')
    };

    var none = {
      null: gettext('None')
    };

    var service = {
      operatingStatus: operatingStatus,
      provisioningStatus: provisioningStatus,
      loadBalancerAlgorithm: loadBalancerAlgorithm,
      none: none,
      nullFilter: nullFilter,
      getLoadBalancersPromise: getLoadBalancersPromise,
      getLoadBalancerPromise: getLoadBalancerPromise,
      getDetailsPath: getDetailsPath,
      getListenersPromise: getListenersPromise,
      getListenerPromise: getListenerPromise,
      getListenerDetailsPath: getListenerDetailsPath,
      getPoolsPromise: getPoolsPromise,
      getPoolPromise: getPoolPromise,
      getPoolDetailsPath: getPoolDetailsPath,
      getMembersPromise: getMembersPromise,
      getMemberPromise: getMemberPromise,
      getMemberDetailsPath: getMemberDetailsPath,
      getHealthMonitorPromise: getHealthMonitorPromise,
      getHealthMonitorsPromise: getHealthMonitorsPromise,
      getHealthMonitorDetailsPath: getHealthMonitorDetailsPath,
      isActionable: isActionable
    };

    return service;

    ////////////

    function nullFilter(input) {
      if (none.hasOwnProperty(input)) {
        return none[input];
      }
      return input;
    }

    function getMemberDetailsPath(item) {
      return 'project/load_balancer/' + item.loadbalancerId +
        '/listeners/' + item.listenerId +
        '/pools/' + item.poolId +
        '/members/' + item.id;
    }

    function getMembersPromise(params) {
      return api.getMembers(params.poolId).then(modifyResponse);

      function modifyResponse(response) {
        return {data: {items: response.data.items.map(modifyItem)}};

        function modifyItem(item) {
          item.trackBy = item.id + item.updated_at;
          item.loadbalancerId = params.loadbalancerId;
          item.listenerId = params.listenerId;
          item.poolId = params.poolId;
          return item;
        }
      }
    }

    function getMemberPromise(poolId, memberId) {
      return api.getMember(poolId, memberId);
    }

    function getHealthMonitorDetailsPath(item) {
      return 'project/load_balancer/' + item.loadbalancerId +
        '/listeners/' + item.listenerId +
        '/pools/' + item.poolId +
        '/healthmonitors/' + item.id;
    }

    function getHealthMonitorsPromise(params) {
      return api.getHealthMonitors(params.poolId).then(modifyResponse);

      function modifyResponse(response) {
        return {data: {items: response.data.items.map(modifyItem)}};

        function modifyItem(item) {
          item.trackBy = item.id + item.updated_at;
          item.loadbalancerId = params.loadbalancerId;
          item.listenerId = params.listenerId;
          item.poolId = params.poolId;
          return item;
        }
      }
    }

    function getHealthMonitorPromise(identifier) {
      return api.getHealthMonitor(identifier);
    }

    function getPoolsPromise(params) {
      return api.getPools(params.loadbalancerId, params.listenerId).then(modifyResponse);

      function modifyResponse(response) {
        return {data: {items: response.data.items.map(modifyItem)}};

        function modifyItem(item) {
          item.trackBy = item.id + item.updated_at;
          item.loadbalancerId = params.loadbalancerId;
          item.listenerId = params.listenerId;
          return item;
        }
      }
    }

    function getPoolPromise(identifier) {
      return api.getPool(identifier);
    }

    function getPoolDetailsPath(item) {
      return 'project/load_balancer/' +
        item.loadbalancerId + '/listeners/' +
        item.listeners[0].id + '/pools/' + item.id;
    }

    function getListenersPromise(params) {
      return api.getListeners(params.loadbalancerId).then(modifyResponse);

      function modifyResponse(response) {
        return {data: {items: response.data.items.map(modifyItem)}};

        function modifyItem(item) {
          item.trackBy = item.id + item.updated_at;
          item.loadbalancerId = params.loadbalancerId;
          return item;
        }
      }
    }

    function getListenerPromise(identifier) {
      return api.getListener(identifier);
    }

    function getListenerDetailsPath(item) {
      return 'project/load_balancer/' + item.loadbalancerId + '/listeners/' + item.id;
    }

    function getLoadBalancersPromise() {
      return api.getLoadBalancers(true).then(modifyResponse);

      function modifyResponse(response) {
        return {data: {items: response.data.items.map(modifyItem)}};

        function modifyItem(item) {
          item.trackBy = item.id + item.updated_at;
          item.floating_ip_address = item.floating_ip.ip;
          return item;
        }
      }
    }

    function getLoadBalancerPromise(identifier) {
      return api.getLoadBalancer(identifier, true);
    }

    function getDetailsPath(item) {
      return 'project/load_balancer/' + item.id;
    }

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
