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
(function () {
  'use strict';

  angular
    .module('horizon.app.core.openstack-service-api')
    .factory('horizon.app.core.openstack-service-api.lbaasv2', lbaasv2API);

  lbaasv2API.$inject = [
    'horizon.framework.util.http.service',
    'horizon.framework.widgets.toast.service'
  ];

  /**
   * @ngdoc service
   * @name horizon.app.core.openstack-service-api.loadbalancers
   * @description Provides direct pass through to Octavia with NO abstraction.
   * @param apiService The horizon core API service.
   * @param toastService The horizon toast service.
   * @returns The LBaaS V2 service API.
   */

  function lbaasv2API(apiService, toastService) {
    var service = {
      getLoadBalancers: getLoadBalancers,
      getLoadBalancer: getLoadBalancer,
      deleteLoadBalancer: deleteLoadBalancer,
      createLoadBalancer: createLoadBalancer,
      editLoadBalancer: editLoadBalancer,
      getListeners: getListeners,
      getListener: getListener,
      createListener: createListener,
      editListener: editListener,
      deleteListener: deleteListener,
      getPools: getPools,
      getPool: getPool,
      createPool: createPool,
      editPool: editPool,
      deletePool: deletePool,
      getMembers: getMembers,
      getMember: getMember,
      deleteMember: deleteMember,
      editMember: editMember,
      getHealthMonitors: getHealthMonitors,
      getHealthMonitor: getHealthMonitor,
      deleteHealthMonitor: deleteHealthMonitor,
      createHealthMonitor: createHealthMonitor,
      editHealthMonitor: editHealthMonitor,
      updateMemberList: updateMemberList
    };

    return service;

    ///////////////

    // Load Balancers

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getLoadBalancers
     * @description
     * Get a list of load balancers.
     * @param {boolean} full
     * The listing result is an object with property "items". Each item is
     * a load balancer.
     */

    function getLoadBalancers(full) {
      var params = { full: full };
      return apiService.get('/api/lbaas/loadbalancers/', { params: params })
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve load balancers.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getLoadBalancer
     * @description
     * Get a single load balancer by ID
     * @param {string} id
     * @param {boolean} full
     * Specifies the id of the load balancer to request.
     */

    function getLoadBalancer(id, full) {
      var params = { full: full };
      return apiService.get('/api/lbaas/loadbalancers/' + id + '/', { params: params })
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve load balancer.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteLoadBalancer
     * @description
     * Delete a single load balancer by ID
     * @param {string} id
     * @param {boolean} quiet
     * Specifies the id of the load balancer to delete.
     */

    function deleteLoadBalancer(id, quiet) {
      var promise = apiService.delete('/api/lbaas/loadbalancers/' + id + '/');
      return quiet ? promise : promise.error(function () {
        toastService.add('error', gettext('Unable to delete load balancer.'));
      });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.createLoadBalancer
     * @description
     * Create a new load balancer
     * @param {object} spec
     * Specifies the data used to create the new load balancer.
     */

    function createLoadBalancer(spec) {
      return apiService.post('/api/lbaas/loadbalancers/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to create load balancer.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.editLoadBalancer
     * @description
     * Edit a load balancer
     * @param {string} id
     * @param {object} spec
     * Specifies the data used to update the load balancer.
     */

    function editLoadBalancer(id, spec) {
      return apiService.put('/api/lbaas/loadbalancers/' + id + '/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to update load balancer.'));
        });
    }

    // Listeners

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getListeners
     * @description
     * Get the list of listeners.
     * If a loadbalancer ID is passed as a parameter, the returning list of
     * listeners will be filtered to include only those listeners under the
     * specified loadbalancer.
     * @param {string} id
     * Specifies the id of the loadbalancer to request listeners for.
     *
     * The listing result is an object with property "items". Each item is
     * a listener.
     */

    function getListeners(id) {
      var params = id ? {params: {loadbalancerId: id}} : {};
      return apiService.get('/api/lbaas/listeners/', params)
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve listeners.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getListener
     * @description
     * Get a single listener by ID.
     * @param {string} id
     * Specifies the id of the listener to request.
     * @param {boolean} includeChildResources
     * If truthy, all child resources below the listener will be included in the response.
     */

    function getListener(id, includeChildResources) {
      var params = includeChildResources
          ? {params: {includeChildResources: includeChildResources}}
          : {};
      return apiService.get('/api/lbaas/listeners/' + id + '/', params)
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve listener.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.createListener
     * @description
     * Create a new listener
     * @param {object} spec
     * Specifies the data used to create the new listener.
     */

    function createListener(spec) {
      return apiService.post('/api/lbaas/listeners/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to create listener.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.editListener
     * @description
     * Edit a listener
     * @param {string} id
     * Specifies the id of the listener to update.
     * @param {object} spec
     * Specifies the data used to update the listener.
     */

    function editListener(id, spec) {
      return apiService.put('/api/lbaas/listeners/' + id + '/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to update listener.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteListener
     * @description
     * Delete a single listener by ID
     * @param {string} id
     * @param {boolean} quiet
     * Specifies the id of the listener to delete.
     */

    function deleteListener(id, quiet) {
      var promise = apiService.delete('/api/lbaas/listeners/' + id + '/');
      return quiet ? promise : promise.error(function () {
        toastService.add('error', gettext('Unable to delete listener.'));
      });
    }

    // Pools

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getPools
     * @description
     * Get the list of pools.
     * If a loadbalancer ID is passed as a parameter, the returning list of
     * pools will be filtered to include only those pools under the
     * specified loadbalancer.
     * @param {string} loadbalancerId
     * Specifies the id of the loadbalancer to request pools for.
     * @param {string} listenerId
     * Specifies the id of the listener to request pools for.
     *
     * The listing result is an object with property "items". Each item is
     * a pool.
     */

    function getPools(loadbalancerId, listenerId) {
      var params = $.extend({},
        {
          loadbalancerId: loadbalancerId,
          listenerId: listenerId
        }
      );
      if (!$.isEmptyObject(params)) {
        params = { params: params };
      }
      return apiService.get('/api/lbaas/pools/', params)
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve pools.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getPool
     * @description
     * Get a single Pool by ID.
     * @param {string} id
     * Specifies the id of the pool to request.
     * @param {boolean} includeChildResources
     * If truthy, all child resources below the pool will be included in the response.
     */

    function getPool(id, includeChildResources) {
      var params = includeChildResources
          ? {params: {includeChildResources: includeChildResources}}
          : {};
      return apiService.get('/api/lbaas/pools/' + id + '/', params)
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve pool.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.createPool
     * @description
     * Create a new pool
     * @param {object} spec
     * Specifies the data used to create the new pool.
     */

    function createPool(spec) {
      return apiService.post('/api/lbaas/pools/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to create pool.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.editPool
     * @description
     * Edit a pool
     * @param {string} id
     * Specifies the id of the pool to update.
     * @param {object} spec
     * Specifies the data used to update the pool.
     */

    function editPool(id, spec) {
      return apiService.put('/api/lbaas/pools/' + id + '/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to update pool.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deletePool
     * @description
     * Delete a single pool by ID
     * @param {string} id
     * @param {boolean} quiet
     * Specifies the id of the pool to delete.
     */

    function deletePool(id, quiet) {
      var promise = apiService.delete('/api/lbaas/pools/' + id + '/');
      return quiet ? promise : promise.error(function () {
        toastService.add('error', gettext('Unable to delete pool.'));
      });
    }

    // Members

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getMembers
     * @description
     * Get a list of members.
     * @param {string} poolId
     * Specifies the id of the pool the members belong to.
     *
     * The listing result is an object with property "items". Each item is
     * a member.
     */

    function getMembers(poolId) {
      return apiService.get('/api/lbaas/pools/' + poolId + '/members/')
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve members.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getMember
     * @description
     * Get a single pool Member by ID.
     * @param {string} poolId
     * Specifies the id of the pool the member belongs to.
     * @param {string} memberId
     * Specifies the id of the member to request.
     */

    function getMember(poolId, memberId) {
      return apiService.get('/api/lbaas/pools/' + poolId + '/members/' + memberId + '/')
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve member.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteMember
     * @description
     * Delete a single pool Member by ID.
     * @param {string} poolId
     * Specifies the id of the pool the member belongs to.
     * @param {string} memberId
     * Specifies the id of the member to request.
     */

    function deleteMember(poolId, memberId) {
      return apiService.delete('/api/lbaas/pools/' + poolId + '/members/' + memberId + '/')
        .error(function () {
          toastService.add('error', gettext('Unable to delete member.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.editMember
     * @description
     * Edit a pool member.
     * @param {string} id
     * Specifies the id of the member to update.
     * @param {object} spec
     * Specifies the data used to update the member.
     */

    function editMember(poolId, memberId, spec) {
      return apiService.put('/api/lbaas/pools/' + poolId + '/members/' + memberId + '/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to update member.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.updateMemberList
     * @description
     * Update the list of pool members by adding or removing the necessary members.
     * @param {string} poolId
     * Specifies the id of the pool the members belong to.
     * @param {object} spec
     * Specifies the data used to update the member list.
     */

    function updateMemberList(poolId, spec) {
      return apiService.put('/api/lbaas/pools/' + poolId + '/members/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to update member list.'));
        });
    }

    // Health Monitors

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getHealthMonitor
     * @description
     * Get a single pool health monitor by ID.
     * @param {string} monitorId
     * Specifies the id of the health monitor.
     */

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getHealthMonitors
     * @description
     * Get the list of healthmonitors.
     * If a pool ID is passed as a parameter, the returning list of
     * healthmonitors will be filtered to include only those healthmonitors under the
     * specified pool.
     * @param {string} id
     * Specifies the id of the pool to request healthmonitors for.
     *
     * The listing result is an object with property "items". Each item is
     * a healthmonitor.
     */

    function getHealthMonitors(id) {
      var params = id ? {params: {poolId: id}} : {};
      return apiService.get('/api/lbaas/healthmonitors/', params)
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve health monitors.'));
        });
    }

    function getHealthMonitor(monitorId) {
      return apiService.get('/api/lbaas/healthmonitors/' + monitorId + '/')
        .error(function () {
          toastService.add('error', gettext('Unable to retrieve health monitor.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.editHealthMonitor
     * @description
     * Edit a health monitor
     * @param {string} id
     * Specifies the id of the health monitor to update.
     * @param {object} spec
     * Specifies the data used to update the health monitor.
     */

    function editHealthMonitor(id, spec) {
      return apiService.put('/api/lbaas/healthmonitors/' + id + '/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to update health monitor.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteHealthMonitor
     * @description
     * Delete a single health monitor by ID
     * @param {string} id
     * @param {boolean} quiet
     * Specifies the id of the health monitor to delete.
     */

    function deleteHealthMonitor(id, quiet) {
      var promise = apiService.delete('/api/lbaas/healthmonitors/' + id + '/');
      return quiet ? promise : promise.error(function () {
        toastService.add('error', gettext('Unable to delete health monitor.'));
      });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.createHealthMonitor
     * @description
     * Create a new health monitor
     * @param {object} spec
     * Specifies the data used to create the new health monitor.
     */

    function createHealthMonitor(spec) {
      return apiService.post('/api/lbaas/healthmonitors/', spec)
        .error(function () {
          toastService.add('error', gettext('Unable to create health monitor.'));
        });
    }

  }
}());
