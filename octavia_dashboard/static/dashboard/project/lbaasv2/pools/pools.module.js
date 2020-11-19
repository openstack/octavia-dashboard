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
   * @ngname horizon.dashboard.project.lbaasv2.pools
   *
   * @description
   * Provides the services and widgets required to support and display the project pools
   * for the load balancers v2 panel.
   */

  angular
    .module('horizon.dashboard.project.lbaasv2.pools', [])
    .constant('horizon.dashboard.project.lbaasv2.pools.resourceType',
      'OS::Octavia::Pool')
    .run(run);

  run.$inject = [
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.pools.actions.create',
    'horizon.dashboard.project.lbaasv2.pools.actions.edit',
    'horizon.dashboard.project.lbaasv2.pools.actions.delete',
    'horizon.dashboard.project.lbaasv2.pools.resourceType'
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
    var poolResourceType = registry.getResourceType(resourceType);

    poolResourceType
      .setNames(gettext('Pool'), gettext('Pools'))
      .setSummaryTemplateUrl(basePath + 'pools/details/drawer.html')
      .setProperties(poolProperties(loadBalancerService))
      .setListFunction(loadBalancerService.getPoolsPromise)
      .setLoadFunction(loadBalancerService.getPoolPromise)
      .tableColumns
      .append({
        id: 'name',
        priority: 1,
        sortDefault: true,
        urlFunction: loadBalancerService.getPoolDetailsPath
      })
      .append({
        id: 'protocol',
        priority: 1
      })
      .append({
        id: 'lb_algorithm',
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

    poolResourceType.itemActions
      .append({
        id: 'poolEdit',
        service: editService,
        template: {
          text: gettext('Edit Pool')
        }
      })
      .append({
        id: 'poolDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Pool'),
          type: 'delete'
        }
      });

    poolResourceType.globalActions
      .append({
        id: 'poolCreate',
        service: createService,
        template: {
          type: 'create',
          text: gettext('Create Pool')
        }
      });

    poolResourceType.batchActions
      .append({
        id: 'poolBatchDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Pools'),
          type: 'delete-selected'
        }
      });
  }

  function poolProperties(loadBalancerService) {
    return {
      id: gettext('ID'),
      name: {
        label: gettext('Name'),
        filters: ['noName']
      },
      description: {
        label: gettext('Description'),
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
      protocol: gettext('Protocol'),
      lb_algorithm: {
        label: gettext('Algorithm'),
        values: loadBalancerService.loadBalancerAlgorithm
      },
      session_persistence: {
        label: gettext('Session Persistence'),
        filters: [
          'json',
          loadBalancerService.nullFilter
        ]
      },
      health_monitor_id: {
        label: gettext('Health Monitor ID'),
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
      loadbalancers: gettext('Load Balancers'),
      listeners: gettext('Listeners'),
      members: gettext('Members'),
      tls_enabled: {
        label: gettext('TLS Enabled'),
        filters: ['yesno']
      },
      tls_ciphers: gettext('TLS Cipher String')
    };
  }

})();
