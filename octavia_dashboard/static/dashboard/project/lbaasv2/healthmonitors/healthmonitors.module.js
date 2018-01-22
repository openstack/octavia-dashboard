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

  /**
   * @ngdoc overview
   * @ngname horizon.dashboard.project.lbaasv2.healthmonitors
   *
   * @description
   * Provides the services and widgets required to support and display the project healthmonitors
   * for the load balancers v2 panel.
   */

  angular
    .module('horizon.dashboard.project.lbaasv2.healthmonitors', [])
    .constant('horizon.dashboard.project.lbaasv2.healthmonitors.resourceType',
      'OS::Octavia::HealthMonitor')
    .run(run);

  run.$inject = [
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.healthmonitors.actions.create',
    'horizon.dashboard.project.lbaasv2.healthmonitors.actions.edit',
    'horizon.dashboard.project.lbaasv2.healthmonitors.actions.delete',
    'horizon.dashboard.project.lbaasv2.healthmonitors.resourceType'
  ];

  function run(
    registry,
    basePath,
    loadBalancerService,
    createService,
    editService,
    deleteService,
    resourceType
  ) {
    var healthMonitorResourceType = registry.getResourceType(resourceType);

    healthMonitorResourceType
      .setNames(gettext('Health Monitor'), gettext('Health Monitors'))
      .setSummaryTemplateUrl(basePath + 'healthmonitors/details/drawer.html')
      .setProperties(healthMonitorProperties(loadBalancerService))
      .setListFunction(loadBalancerService.getHealthMonitorsPromise)
      .setLoadFunction(loadBalancerService.getHealthMonitorPromise)
      .tableColumns
      .append({
        id: 'name',
        priority: 1,
        sortDefault: true,
        urlFunction: loadBalancerService.getHealthMonitorDetailsPath
      })
      .append({
        id: 'type',
        priority: 1
      })
      .append({
        id: 'operating_status',
        priority: 1
      })
      .append({
        id: 'provisioning_status',
        priority: 1
      })
      .append({
        id: 'admin_state_up',
        priority: 1
      });

    healthMonitorResourceType.itemActions
      .append({
        id: 'healthMonitorEdit',
        service: editService,
        template: {
          text: gettext('Edit Health Monitor')
        }
      })
      .append({
        id: 'healthMonitorDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Health Monitor'),
          type: 'delete'
        }
      });

    healthMonitorResourceType.globalActions
      .append({
        id: 'healthMonitorCreate',
        service: createService,
        template: {
          type: 'create',
          text: gettext('Create Health Monitor')
        }
      });

    healthMonitorResourceType.batchActions
      .append({
        id: 'healthMonitorBatchDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Health Monitors'),
          type: 'delete-selected'
        }
      });
  }

  function healthMonitorProperties(loadBalancerService) {
    return {
      id: gettext('ID'),
      name: {
        label: gettext('Name'),
        filters: ['noName']
      },
      provisioning_status: {
        label: gettext('Provisioning Status'),
        values: loadBalancerService.provisioningStatus
      },
      operating_status: {
        label: gettext('Operating Status'),
        values: loadBalancerService.operatingStatus
      },
      admin_state_up: {
        label: gettext('Admin State Up'),
        filters: ['yesno']
      },
      type: gettext('Type'),
      delay: gettext('Delay'),
      timeout: gettext('Timeout'),
      max_retries: gettext('Max Retries'),
      max_retries_down: gettext('Max Retries Down'),
      http_method: {
        label: gettext('HTTP Method'),
        filters: ['noValue']
      },
      url_path: {
        label: gettext('URL Path'),
        filters: ['noValue']
      },
      expected_codes: {
        label: gettext('Expected Codes'),
        filters: ['noValue']
      },
      project_id: gettext('Project ID'),
      created_at: {
        label: gettext('Created At'),
        filters: ['noValue']
      },
      updated_at: {
        label: gettext('Updated At'),
        filters: ['noValue']
      },
      pools: gettext('Pools')
    };
  }

})();
