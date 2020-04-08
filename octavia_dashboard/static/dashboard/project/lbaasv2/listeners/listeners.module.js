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
   * @ngname horizon.dashboard.project.lbaasv2.listeners
   *
   * @description
   * Provides the services and widgets required to support and display the project listeners
   * for the load balancers v2 panel.
   */

  angular
    .module('horizon.dashboard.project.lbaasv2.listeners', [])
    .constant('horizon.dashboard.project.lbaasv2.listeners.resourceType',
      'OS::Octavia::Listener')
    .run(run);

  run.$inject = [
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.listeners.actions.create',
    'horizon.dashboard.project.lbaasv2.listeners.actions.edit',
    'horizon.dashboard.project.lbaasv2.listeners.actions.delete',
    'horizon.dashboard.project.lbaasv2.listeners.resourceType'
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
    var listenerResourceType = registry.getResourceType(resourceType);

    listenerResourceType
      .setNames(gettext('Listener'), gettext('Listeners'))
      .setSummaryTemplateUrl(basePath + 'listeners/details/drawer.html')
      .setProperties(listenerProperties(loadBalancerService))
      .setListFunction(loadBalancerService.getListenersPromise)
      .setLoadFunction(loadBalancerService.getListenerPromise)
      .tableColumns
      .append({
        id: 'name',
        priority: 1,
        sortDefault: true,
        urlFunction: loadBalancerService.getListenerDetailsPath
      })
      .append({
        id: 'protocol',
        priority: 1
      })
      .append({
        id: 'protocol_port',
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

    listenerResourceType.itemActions
      .append({
        id: 'listenerEdit',
        service: editService,
        template: {
          text: gettext('Edit Listener')
        }
      })
      .append({
        id: 'listenerDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Listener'),
          type: 'delete'
        }
      });

    listenerResourceType.globalActions
      .append({
        id: 'listenerCreate',
        service: createService,
        template: {
          type: 'create',
          text: gettext('Create Listener')
        }
      });

    listenerResourceType.batchActions
      .append({
        id: 'listenerBatchDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Listeners'),
          type: 'delete-selected'
        }
      });
  }

  function listenerProperties(loadBalancerService) {
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
      protocol_port: gettext('Port'),
      project_id: gettext('Project ID'),
      created_at: {
        label: gettext('Created At'),
        filters: ['noValue']
      },
      updated_at: {
        label: gettext('Updated At'),
        filters: ['noValue']
      },
      connection_limit: {
        label: gettext('Connection Limit'),
        filters: ['limit']
      },
      default_tls_container_ref: gettext('Default TLS Container Ref'),
      sni_container_refs: gettext('SNI Container Refs'),
      default_pool_id: {
        label: gettext('Default Pool ID'),
        filters: ['noValue']
      },
      l7_policies: gettext('L7 Policies'),
      insert_headers: {
        label: gettext('Insert Headers'),
        filters: [
          'json',
          loadBalancerService.nullFilter
        ]
      },
      allowed_cidrs: {
        label: gettext('Allowed Cidrs'),
        filters: ['noValue']
      },
      timeout_client_data: gettext('Client Data Timeout'),
      timeout_member_connect: gettext('Member Connect Timeout'),
      timeout_member_data: gettext('Member Data Timeout'),
      timeout_tcp_inspect: gettext('TCP Inspect Timeout'),
      load_balancers: gettext('Load Balancers'),
      tls_ciphers: gettext('TLS Cipher String')
    };
  }

})();
