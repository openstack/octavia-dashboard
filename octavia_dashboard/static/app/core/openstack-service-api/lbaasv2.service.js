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
      getL7Policies: getL7Policies,
      getL7Policy: getL7Policy,
      createL7Policy: createL7Policy,
      editL7Policy: editL7Policy,
      deleteL7Policy: deleteL7Policy,
      getL7Rules: getL7Rules,
      getL7Rule: getL7Rule,
      createL7Rule: createL7Rule,
      editL7Rule: editL7Rule,
      deleteL7Rule: deleteL7Rule,
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
      updateMemberList: updateMemberList,
      getAvailabilityZones: getAvailabilityZones,
      getFlavors: getFlavors,
      getFlavor: getFlavor,
      deleteFlavor: deleteFlavor,
      createFlavor: createFlavor,
      editFlavor: editFlavor,
      getFlavorProfiles: getFlavorProfiles,
      getFlavorProfile: getFlavorProfile,
      deleteFlavorProfile: deleteFlavorProfile,
      createFlavorProfile: createFlavorProfile,
      editFlavorProfile: editFlavorProfile
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
        .catch(function () {
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
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve load balancer.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteLoadBalancer
     * @description
     * Delete a single load balancer by ID
     * @param {string} id
     * Specifies the id of the load balancer to delete.
     * @param {boolean} quiet
     */

    function deleteLoadBalancer(id, quiet) {
      var promise = apiService.delete('/api/lbaas/loadbalancers/' + id + '/');
      return quiet ? promise : promise.catch(function () {
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
          toastService.add('error', gettext('Unable to update listener.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteListener
     * @description
     * Delete a single listener by ID
     * @param {string} id
     * Specifies the id of the listener to delete.
     * @param {boolean} quiet
     */

    function deleteListener(id, quiet) {
      var promise = apiService.delete('/api/lbaas/listeners/' + id + '/');
      return quiet ? promise : promise.catch(function () {
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
          toastService.add('error', gettext('Unable to update pool.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deletePool
     * @description
     * Delete a single pool by ID
     * @param {string} id
     * Specifies the id of the pool to delete.
     * @param {boolean} quiet
     */

    function deletePool(id, quiet) {
      var promise = apiService.delete('/api/lbaas/pools/' + id + '/');
      return quiet ? promise : promise.catch(function () {
        toastService.add('error', gettext('Unable to delete pool.'));
      });
    }

    // L7 Policies

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getL7Policies
     * @description
     * Get the list of l7 policies.
     * If a listener ID is passed as a parameter, the returning list of
     * l7 policies will be filtered to include only those l7 policies under the
     * specified listener.
     * @param {string} listenerId
     * Specifies the id of the listener to request l7policies for.
     *
     * The listing result is an object with property "items". Each item is
     * a l7 policy.
     */

    function getL7Policies(listenerId) {
      var params = $.extend({},
        {
          listenerId: listenerId
        }
      );
      if (!$.isEmptyObject(params)) {
        params = { params: params };
      }
      return apiService.get('/api/lbaas/l7policies/', params)
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve l7 policies.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getL7Policy
     * @description
     * Get a single L7Policy by ID.
     * @param {string} id
     * Specifies the id of the l7 policy to request.
     * @param {boolean} includeChildResources
     * If truthy, all child resources below the l7 policy will be included in the response.
     */

    function getL7Policy(id, includeChildResources) {
      var params = includeChildResources
          ? {params: {includeChildResources: includeChildResources}}
          : {};
      return apiService.get('/api/lbaas/l7policies/' + id + '/', params)
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve l7 policy.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.createL7Policy
     * @description
     * Create a new l7 policy
     * @param {object} spec
     * Specifies the data used to create the new l7 policy.
     */

    function createL7Policy(spec) {
      return apiService.post('/api/lbaas/l7policies/', spec)
        .catch(function () {
          toastService.add('error', gettext('Unable to create l7 policy.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.editL7Policy
     * @description
     * Edit a l7 policy
     * @param {string} id
     * Specifies the id of the l7 policy to update.
     * @param {object} spec
     * Specifies the data used to update the l7 policy.
     */

    function editL7Policy(id, spec) {
      return apiService.put('/api/lbaas/l7policies/' + id + '/', spec)
        .catch(function () {
          toastService.add('error', gettext('Unable to update l7 policy.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteL7Policy
     * @description
     * Delete a single l7 policy by ID
     * @param {string} id
     * Specifies the id of the l7 policy to delete.
     * @param {boolean} quiet
     */

    function deleteL7Policy(id, quiet) {
      var promise = apiService.delete('/api/lbaas/l7policies/' + id + '/');
      return quiet ? promise : promise.catch(function () {
        toastService.add('error', gettext('Unable to delete l7 policy.'));
      });
    }

    // L7 Rules

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getL7Rules
     * @description
     * Get the list of l7 rules under the specified l7 policy.
     * @param {string} l7policyId
     * Specifies the id of the l7 policy to request l7rules for.
     *
     * The listing result is an object with property "items".
     * Each item is a l7 rule.
     */

    function getL7Rules(l7policyId) {
      return apiService.get('/api/lbaas/l7policies/' + l7policyId + '/l7rules/')
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve l7 rules.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getL7Rule
     * @description
     * Get a single L7Rule by ID.
     * @param {string} l7policyId
     * Specifies the id of the l7 policy the l7 rule belongs to.
     * @param {string} l7ruleId
     * Specifies the id of the l7 rule to request.
     */

    function getL7Rule(l7policyId, l7ruleId) {
      return apiService.get('/api/lbaas/l7policies/' + l7policyId + '/l7rules/' + l7ruleId + '/')
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve l7 rule.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.createL7Rule
     * @description
     * Create a new l7 rule
     * @param {string} l7policyId
     * Specifies the id of the l7 policy the l7 rule belongs to.
     * @param {object} spec
     * Specifies the data used to create the new l7 rule.
     */

    function createL7Rule(l7policyId, spec) {
      return apiService.post('/api/lbaas/l7policies/' + l7policyId + '/l7rules/', spec)
        .catch(function () {
          toastService.add('error', gettext('Unable to create l7 rule.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.editL7Rule
     * @description
     * Edit a l7 rule
     * @param {string} l7policyId
     * Specifies the id of the l7 policy the l7 rule belongs to.
     * @param {string} l7ruleId
     * Specifies the id of the l7 rule to update.
     * @param {object} spec
     * Specifies the data used to update the l7 rule.
     */

    function editL7Rule(l7policyId, l7ruleId, spec) {
      return apiService.put('/api/lbaas/l7policies/' + l7policyId +
        '/l7rules/' + l7ruleId + '/', spec)
        .catch(function () {
          toastService.add('error', gettext('Unable to update l7 rule.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteL7Rule
     * @description
     * Delete a single l7 rule by ID
     * @param {string} l7policyId
     * Specifies the id of the l7 policy the l7 rule belongs to.
     * @param {string} l7ruleId
     * Specifies the id of the l7 rule to delete.
     * @param {boolean} quiet
     */

    function deleteL7Rule(l7policyId, l7ruleId, quiet) {
      var promise = apiService.delete('/api/lbaas/l7policies/' + l7policyId +
        '/l7rules/' + l7ruleId + '/');
      return quiet ? promise : promise.catch(function () {
        toastService.add('error', gettext('Unable to delete l7 rule.'));
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
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
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve health monitors.'));
        });
    }

    function getHealthMonitor(monitorId) {
      return apiService.get('/api/lbaas/healthmonitors/' + monitorId + '/')
        .catch(function () {
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
        .catch(function () {
          toastService.add('error', gettext('Unable to update health monitor.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteHealthMonitor
     * @description
     * Delete a single health monitor by ID
     * @param {string} id
     * Specifies the id of the health monitor to delete.
     * @param {boolean} quiet
     */

    function deleteHealthMonitor(id, quiet) {
      var promise = apiService.delete('/api/lbaas/healthmonitors/' + id + '/');
      return quiet ? promise : promise.catch(function () {
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
        .catch(function () {
          toastService.add('error', gettext('Unable to create health monitor.'));
        });
    }

    // Flavors

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getFlavor
     * @description
     * Get a single load balancer flavor by ID.
     * @param {string} flavorId
     * Specifies the id of the flavor.
     */

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getFlavors
     * @description
     * Get the list of flavors.
     *
     * The listing result is an object with property "items". Each item is
     * a flavor.
     */

    function getFlavors() {
      var params = {params: {}};
      return apiService.get('/api/lbaas/flavors/', params)
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve flavors.'));
        });
    }

    function getFlavor(flavorId) {
      return apiService.get('/api/lbaas/flavors/' + flavorId + '/')
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve flavor.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.editFlavor
     * @description
     * Edit a flavor
     * @param {string} id
     * Specifies the id of the flavor to update.
     * @param {object} spec
     * Specifies the data used to update the flavor.
     */

    function editFlavor(id, spec) {
      return apiService.put('/api/lbaas/flavors/' + id + '/', spec)
        .catch(function () {
          toastService.add('error', gettext('Unable to update flavor.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteFlavor
     * @description
     * Delete a single flavor by ID
     * @param {string} id
     * Specifies the id of the flavor to delete.
     * @param {boolean} quiet
     */

    function deleteFlavor(id, quiet) {
      var promise = apiService.delete('/api/lbaas/flavors/' + id + '/');
      return quiet ? promise : promise.catch(function () {
        toastService.add('error', gettext('Unable to delete flavor.'));
      });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.createFlavor
     * @description
     * Create a new flavor
     * @param {object} spec
     * Specifies the data used to create the new flavor.
     */

    function createFlavor(spec) {
      return apiService.post('/api/lbaas/flavors/', spec)
        .catch(function () {
          toastService.add('error', gettext('Unable to create flavor.'));
        });
    }

    // Flavor Profiles

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getFlavorProfile
     * @description
     * Get a single load balancer flavor profile by ID.
     * @param {string} flavorProfileId
     * Specifies the id of the flavor profile.
     */

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getFlavorProfiles
     * @description
     * Get the list of flavor profiles.
     *
     * The listing result is an object with property "items". Each item is
     * a flavor profile.
     */

    function getFlavorProfiles() {
      var params = {params: {}};
      return apiService.get('/api/lbaas/flavorprofiles/', params)
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve flavor profiles.'));
        });
    }

    function getFlavorProfile(flavorProfileId) {
      return apiService.get('/api/lbaas/flavorprofiles/' + flavorProfileId + '/')
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve flavor profile.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.editFlavorProfile
     * @description
     * Edit a flavor Profile
     * @param {string} id
     * Specifies the id of the flavor profile to update.
     * @param {object} spec
     * Specifies the data used to update the flavor profile.
     */

    function editFlavorProfile(id, spec) {
      return apiService.put('/api/lbaas/flavorprofiles/' + id + '/', spec)
        .catch(function () {
          toastService.add('error', gettext('Unable to update flavor profile.'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.deleteFlavorProfile
     * @description
     * Delete a single flavor profile by ID
     * @param {string} id
     * Specifies the id of the flavor profile to delete.
     * @param {boolean} quiet
     */

    function deleteFlavorProfile(id, quiet) {
      var promise = apiService.delete('/api/lbaas/flavorprofiles/' + id + '/');
      return quiet ? promise : promise.catch(function () {
        toastService.add('error', gettext('Unable to delete flavor profile.'));
      });
    }

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.createFlavorProfile
     * @description
     * Create a new flavor profile
     * @param {object} spec
     * Specifies the data used to create the new flavor profile.
     */

    function createFlavorProfile(spec) {
      return apiService.post('/api/lbaas/flavorprofiles/', spec)
        .catch(function () {
          toastService.add('error', gettext('Unable to create flavor profile.'));
        });
    }

    // Availability Zones

    /**
     * @name horizon.app.core.openstack-service-api.lbaasv2.getAvailabilityZones
     * @description
     * Get the list of availability zones.
     *
     * The listing result is an object with property "items". Each item is
     * an availability zone.
     */

    function getAvailabilityZones() {
      var params = {params: {}};
      return apiService.get('/api/lbaas/availabilityzones/', params)
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve availability zones.'));
        });
    }

  }
}());
