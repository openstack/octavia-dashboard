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
    .module('horizon.dashboard.project.lbaasv2.members')
    .factory('horizon.dashboard.project.lbaasv2.members.service', membersService);

  membersService.$inject = [
    'horizon.app.core.openstack-service-api.lbaasv2'
  ];

  /**
   * @ngdoc service
   * @name horizon.dashboard.project.lbaasv2.members.service
   * @description General service for LBaaS v2 members.
   * @param api The LBaaS V2 service API.
   * @returns The members service.
   */

  function membersService(api) {
    var service = {
      associateMemberStatuses: associateMemberStatuses
    };

    return service;

    ////////////

    /**
     * @ngdoc method
     * @name horizon.dashboard.project.lbaasv2.members.service.associateMemberStatuses
     * @description Associates the list of specified members with their corresponding statuses
     * that are retrieved from the load balancer status tree.
     * @param loadBalancerId The load balancer ID.
     * @param listenerId The listener ID that the members belong to.
     * @param poolId The pool ID that the members belong to.
     * @param members The list of members to associate with their corresponding health statuses.
     * @returns None
     */

    function associateMemberStatuses(loadBalancerId, listenerId, poolId, members) {
      api.getLoadBalancerStatusTree(loadBalancerId).then(function(response) {

        // Collect the member status data for all specified members
        var memberStatusData = [];
        var listeners = response.data.statuses.loadbalancer.listeners;
        for (var listenerIndex = 0; listenerIndex < listeners.length; listenerIndex++) {
          var listener = listeners[listenerIndex];
          if (listener.id === listenerId) {
            var pools = listener.pools;
            for (var poolIndex = 0; poolIndex < pools.length; poolIndex++) {
              var pool = pools[poolIndex];
              if (pool.id === poolId) {
                memberStatusData = pool.members;
                break;
              }
            }
            break;
          }
        }

        // Attach the status properties to each member object
        members.forEach(mapStatusToMember);
        function mapStatusToMember(member) {
          for (var memberIndex = 0; memberIndex < memberStatusData.length; memberIndex++) {
            var memberWithStatuses = memberStatusData[memberIndex];
            if (memberWithStatuses.id === member.id) {
              member.operating_status = memberWithStatuses.operating_status;
              member.provisioning_status = memberWithStatuses.provisioning_status;
              break;
            }
          }
        }
      });
    }
  }
}());
