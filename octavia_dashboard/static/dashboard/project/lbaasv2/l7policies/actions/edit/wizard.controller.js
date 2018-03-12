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
(function () {
  'use strict';

  angular
    .module('horizon.dashboard.project.lbaasv2.loadbalancers')
    .controller('EditL7PolicyWizardController', EditL7PolicyWizardController);

  EditL7PolicyWizardController.$inject = [
    '$scope',
    '$routeParams',
    '$q',
    'horizon.dashboard.project.lbaasv2.workflow.model',
    'horizon.dashboard.project.lbaasv2.workflow.workflow',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc controller
   * @name EditL7PolicyWizardController
   *
   * @description
   * Controller for the LBaaS v2 edit l7policy wizard.
   *
   * @param $scope The angular scope object.
   * @param $routeParams The angular $routeParams service.
   * @param $q The angular service for promises.
   * @param model The LBaaS V2 workflow model service.
   * @param workflowService The LBaaS V2 workflow service.
   * @param gettext The horizon gettext function for translation.
   * @returns undefined
   */

  function EditL7PolicyWizardController($scope, $routeParams, $q, model, workflowService, gettext) {
    var scope = $scope;
    var loadbalancerId = $routeParams.loadbalancerId;
    var listenerId = $routeParams.listenerId;
    scope.model = model;
    scope.submit = scope.model.submit;
    scope.workflow = workflowService(
        gettext('Update L7 Policy'),
        'fa fa-pencil', ['l7policy']);
    scope.model.initialize('l7policy', scope.launchContext.id, loadbalancerId, listenerId);
  }

})();
