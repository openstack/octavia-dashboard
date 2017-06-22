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
    .module('horizon.dashboard.project.lbaasv2.healthmonitors')
    .factory('horizon.dashboard.project.lbaasv2.healthmonitors.actions.create', createService);

  createService.$inject = [
    '$q',
    '$location',
    'horizon.dashboard.project.lbaasv2.workflow.modal',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.i18n.gettext',
    'horizon.framework.util.q.extensions'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.healthmonitors.actions.createService
   * @description
   * Provides the service for creating a health monitor resource.
   * @param $q The angular service for promises.
   * @param $location The angular $location service.
   * @param workflowModal The LBaaS workflow modal service.
   * @param policy The horizon policy service.
   * @param gettext The horizon gettext function for translation.
   * @param qExtensions Horizon extensions to the $q service.
   * @returns The health monitor create service.
   */

  function createService($q, $location, workflowModal, policy, gettext, qExtensions) {
    var loadbalancerId, listenerId, poolId, statePromise;

    var create = workflowModal.init({
      controller: 'CreateHealthMonitorWizardController',
      message: gettext('A new health monitor is being created.'),
      handle: onCreate,
      allowed: allowed
    });

    var service = {
      init: init,
      create: create
    };

    return service;

    //////////////

    function init(_loadbalancerId_, _listenerId_, _statePromise_) {
      loadbalancerId = _loadbalancerId_;
      listenerId = _listenerId_;
      statePromise = _statePromise_;
      return service;
    }

    function allowed(pool) {
      poolId = pool.id;
      return $q.all([
        statePromise,
        qExtensions.booleanAsPromise(!pool.healthmonitor_id),
        policy.ifAllowed({ rules: [['neutron', 'create_health_monitor']] })
      ]);
    }

    function onCreate(response) {
      var healthMonitorId = response.data.id;
      $location.path('project/ngloadbalancersv2/' + loadbalancerId + '/listeners/' +
          listenerId + '/pools/' + poolId + '/healthmonitors/' + healthMonitorId);
    }

  }
})();
