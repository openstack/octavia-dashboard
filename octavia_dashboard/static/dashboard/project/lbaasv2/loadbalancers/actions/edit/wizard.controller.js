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
    .controller('EditLoadBalancerWizardController', EditLoadBalancerWizardController);

  EditLoadBalancerWizardController.$inject = [
    '$scope',
    'horizon.dashboard.project.lbaasv2.workflow.model',
    'horizon.dashboard.project.lbaasv2.workflow.workflow',
    'horizon.framework.util.i18n.gettext'
  ];

  function EditLoadBalancerWizardController($scope, model, workflowService, gettext) {
    var scope = $scope;
    // Note: We set these attributes on the $scope so that the scope inheritance used all through
    // the wizard continues to work. Using local var to appease eslint angular/ng_controller_as.
    scope.model = model;
    scope.submit = scope.model.submit;
    scope.workflow = workflowService(gettext('Update Load Balancer'),
                                     'fa fa-pencil',
                                     ['loadbalancer']);
    scope.model.initialize('loadbalancer', scope.launchContext.id);
  }

})();
