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
    .factory('horizon.dashboard.project.lbaasv2.members.actions.rowActions', rowActions);

  rowActions.$inject = [
    'horizon.framework.util.i18n.gettext',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.members.actions.edit-weight.modal.service'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.members.actions.rowActions
   *
   * @description
   * Provides the service for the pool members row actions.
   *
   * @param gettext The horizon gettext function for translation.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @param editWeight The LBaaS v2 pool member edit weight service.
   * @returns Members row actions service object.
   */

  function rowActions(gettext, loadBalancersService, editWeight) {
    var loadBalancerIsActionable, poolId;

    var service = {
      actions: actions,
      init: init
    };

    return service;

    ///////////////

    function init(loadbalancerId, _poolId_) {
      loadBalancerIsActionable = loadBalancersService.isActionable(loadbalancerId);
      poolId = _poolId_;
      return service;
    }

    function actions() {
      return [{
        service: editWeight.init(poolId, loadBalancerIsActionable),
        template: {
          text: gettext('Update Weight')
        }
      }];
    }
  }

})();
