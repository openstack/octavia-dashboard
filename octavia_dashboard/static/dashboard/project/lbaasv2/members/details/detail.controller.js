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
(function() {
  'use strict';

  angular
    .module('horizon.dashboard.project.lbaasv2.members')
    .controller('MemberDetailController', MemberDetailController);

  MemberDetailController.$inject = [
    'loadbalancer',
    'listener',
    'pool',
    'member',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.members.resourceType',
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.framework.widgets.modal-wait-spinner.service',
    '$q'
  ];

  /**
   * @ngdoc controller
   * @name MemberDetailController
   *
   * @description
   * Controller for the LBaaS v2 member detail page.
   *
   * @param loadbalancer The loadbalancer object.
   * @param listener The listener object.
   * @param pool The pool object.
   * @param member The member object.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @param resourceType The member resource type.
   * @param typeRegistry The horizon resource type registry service.
   * @param spinnerService The horizon modal wait spinner service.
   * @param $q The angular service for promises.
   *
   * @returns undefined
   */

  function MemberDetailController(
    loadbalancer, listener, pool, member, loadBalancersService,
    resourceType, typeRegistry, spinnerService, $q
  ) {
    var ctrl = this;

    ctrl.operatingStatus = loadBalancersService.operatingStatus;
    ctrl.provisioningStatus = loadBalancersService.provisioningStatus;
    ctrl.loadbalancer = loadbalancer;
    ctrl.listener = listener;
    ctrl.pool = pool;
    ctrl.member = member;
    ctrl.resourceType = typeRegistry.getResourceType(resourceType);
    ctrl.context = {};
    ctrl.context.memberId = member.id;
    ctrl.context.poolId = pool.id;

    ctrl.resultHandler = actionResultHandler;

    function actionResultHandler(returnValue) {
      return $q.when(returnValue, actionSuccessHandler);
    }

    function loadData(response) {
      spinnerService.hideModalSpinner();
      ctrl.showDetails = true;
      ctrl.resourceType.initActions();
      ctrl.member = response.data;
      ctrl.member.loadbalancerId = ctrl.loadbalancer.id;
      ctrl.member.listenerId = ctrl.listener.id;
      ctrl.member.poolId = ctrl.pool.id;
    }

    function actionSuccessHandler(result) {
      // The action has completed (for whatever "complete" means to that
      // action. Notice the view doesn't really need to know the semantics of the
      // particular action because the actions return data in a standard form.
      // That return includes the id and type of each created, updated, deleted
      // and failed item.
      // Currently just refreshes the display each time.
      if (result) {
        if (result.failed.length === 0 && result.deleted.length > 0) {
          // handle a race condition where the resource is already deleted
          return;
        }
        spinnerService.showModalSpinner(gettext('Please Wait'));
        ctrl.showDetails = false;
        ctrl.context.loadPromise = ctrl.resourceType.load(
          ctrl.context.poolId,
          ctrl.context.memberId
        );
        ctrl.context.loadPromise.then(loadData);
      }
    }
  }

})();
