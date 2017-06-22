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
(function() {
  'use strict';

  angular
    .module('horizon.dashboard.project.lbaasv2.members')
    .factory('horizon.dashboard.project.lbaasv2.members.actions.batchActions',
      tableBatchActions);

  tableBatchActions.$inject = [
    'horizon.framework.util.i18n.gettext',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.members.actions.update-member-list'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.pools.actions.batchActions
   *
   * @description
   * Provides the service for the Members table batch actions.
   *
   * @param gettext The horizon gettext function for translation.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @param updateMemberListService The LBaaS v2 update member list service.
   * @returns Members table batch actions service object.
   */

  function tableBatchActions(
    gettext, loadBalancersService, updateMemberListService
  ) {
    var loadBalancerIsActionable, loadBalancerId;

    var service = {
      actions: actions,
      init: init
    };

    return service;

    ///////////////

    function init(_loadBalancerId_) {
      loadBalancerId = _loadBalancerId_;
      loadBalancerIsActionable = loadBalancersService.isActionable(loadBalancerId);
      return service;
    }

    function actions() {
      return [{
        service: updateMemberListService.init(loadBalancerIsActionable).update,
        template: {
          text: gettext('Add/Remove Pool Members')
        }
      }];
    }
  }

})();
