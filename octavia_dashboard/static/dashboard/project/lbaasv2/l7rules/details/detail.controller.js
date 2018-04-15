/*
 * Copyright 2018 Walmart.
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
    .module('horizon.dashboard.project.lbaasv2.l7rules')
    .controller('L7RuleDetailController', L7RuleDetailController);

  L7RuleDetailController.$inject = [
    '$timeout',
    'horizon.dashboard.project.lbaasv2.events',
    '$scope',
    'loadbalancer',
    'listener',
    'l7policy',
    'l7rule',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.l7rules.resourceType',
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.framework.widgets.modal-wait-spinner.service',
    '$q'
  ];

  /**
   * @ngdoc controller
   * @name L7RuleDetailController
   *
   * @description
   * Controller for the LBaaS v2 l7rule detail page.
   *
   * @param $timeout The angular timeout object.
   * @param events The LBaaS v2 events object.
   * @param $scope The angular scope object.
   * @param loadbalancer The loadbalancer object.
   * @param listener The listener object.
   * @param l7policy The l7policy object.
   * @param l7rule The l7rule object.
   * @param loadBalancersService The LBaaS v2 load balancers service.
   * @param resourceType The load balancer resource type.
   * @param typeRegistry The horizon type registry service.
   * @param spinnerService The horizon modal wait spinner service.
   * @param $q The angular service for promises.
   *
   * @returns undefined
   */

  function L7RuleDetailController(
    $timeout, events,
    $scope, loadbalancer, listener, l7policy, l7rule, loadBalancersService,
    resourceType, typeRegistry, spinnerService, $q
  ) {
    var ctrl = this;

    ctrl.operatingStatus = loadBalancersService.operatingStatus;
    ctrl.provisioningStatus = loadBalancersService.provisioningStatus;
    ctrl.l7ruleType = loadBalancersService.l7ruleType;
    ctrl.l7ruleCompareType = loadBalancersService.l7ruleCompareType;
    ctrl.loadbalancer = loadbalancer;
    ctrl.listener = listener;
    ctrl.l7policy = l7policy;
    ctrl.l7rule = l7rule;
    ctrl.listFunctionExtraParams = {
      loadbalancerId: ctrl.loadbalancer.id,
      listenerId: ctrl.listener.id,
      l7policyId: ctrl.l7policy.id,
      l7ruleId: ctrl.l7rule.id
    };
    ctrl.resourceType = typeRegistry.getResourceType(resourceType);
    ctrl.context = {};
    ctrl.context.l7policyId = l7policy.id;
    ctrl.context.l7ruleId = l7rule.id;

    ctrl.resultHandler = actionResultHandler;

    $scope.$watch(
      function() {
        return ctrl.l7rule;
      },
      function() {
        $timeout.cancel($scope.loadTimeout);
        $scope.loadTimeout = $timeout(function() {
          ctrl.context.loadPromise = ctrl.resourceType.load(
            ctrl.context.l7policyId,
            ctrl.context.l7ruleId
          );
          ctrl.context.loadPromise.then(loadData);
        }, loadBalancersService.backoff.duration());
      }
    );

    $scope.$on(
      events.ACTION_DONE,
      function() {
        loadBalancersService.backoff.reset();
      }
    );

    $scope.$on(
      '$destroy',
      function() {
        $timeout.cancel($scope.loadTimeout);
      }
    );

    function actionResultHandler(returnValue) {
      return $q.when(returnValue, actionSuccessHandler);
    }

    function loadData(response) {
      spinnerService.hideModalSpinner();
      ctrl.showDetails = true;
      ctrl.resourceType.initActions();
      ctrl.l7rule = response.data;
      ctrl.l7rule.loadbalancerId = ctrl.loadbalancer.id;
      ctrl.l7rule.listenerId = ctrl.listener.id;
      ctrl.l7rule.l7policyId = ctrl.l7policy.id;
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
          ctrl.context.l7policyId,
          ctrl.context.l7ruleId
        );
        ctrl.context.loadPromise.then(loadData);
      }
    }
  }

})();
