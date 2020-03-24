/*
 * Copyright 2015 IBM Corp.
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
   * @ngname horizon.dashboard.project.lbaasv2.loadbalancers
   *
   * @description
   * Provides the services and widgets required to support and display the project load
   * balancers v2 panel.
   */

  angular
    .module('horizon.dashboard.project.lbaasv2.loadbalancers', [])
    .constant('horizon.dashboard.project.lbaasv2.loadbalancers.resourceType',
      'OS::Octavia::LoadBalancer')
    .run(run);

  run.$inject = [
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.create',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.edit',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.associate-ip',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.disassociate-ip',
    'horizon.dashboard.project.lbaasv2.loadbalancers.actions.delete',
    'horizon.dashboard.project.lbaasv2.loadbalancers.resourceType'
  ];

  function run(
    registry,
    basePath,
    loadBalancerService,
    createService,
    editService,
    associateIpService,
    disassociateIpService,
    deleteService,
    resourceType
  ) {
    var loadBalancerResourceType = registry.getResourceType(resourceType);

    loadBalancerResourceType
      .setNames(gettext('Load Balancer'), gettext('Load Balancers'))
      .setSummaryTemplateUrl(basePath + 'loadbalancers/details/drawer.html')
      .setProperties(loadBalancerProperties(loadBalancerService))
      .setListFunction(loadBalancerService.getLoadBalancersPromise)
      .setLoadFunction(loadBalancerService.getLoadBalancerPromise)
      .tableColumns
      .append({
        id: 'name',
        priority: 1,
        sortDefault: true,
        urlFunction: loadBalancerService.getDetailsPath
      })
      .append({
        id: 'vip_address',
        priority: 1
      })
      .append({
        id: 'availability_zone',
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

    loadBalancerResourceType.itemActions
      .append({
        id: 'loadBalancerEdit',
        service: editService,
        template: {
          text: gettext('Edit Load Balancer')
        }
      })
      .append({
        id: 'loadBalancerAssociateFloatingIp',
        service: associateIpService,
        template: {
          text: gettext('Associate Floating IP')
        }
      })
      .append({
        id: 'loadBalancerDisassociateFloatingIp',
        service: disassociateIpService,
        template: {
          text: gettext('Disassociate Floating IP')
        }
      })
      .append({
        id: 'loadBalancerDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Load Balancer'),
          type: 'delete'
        }
      });

    loadBalancerResourceType.globalActions
      .append({
        id: 'loadBalancerCreate',
        service: createService,
        template: {
          type: 'create',
          text: gettext('Create Load Balancer')
        }
      });

    loadBalancerResourceType.batchActions
      .append({
        id: 'loadBalancerBatchDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Load Balancers'),
          type: 'delete-selected'
        }
      });
  }

  function loadBalancerProperties(loadBalancerService) {
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
      project_id: gettext('Project ID'),
      created_at: {
        label: gettext('Created At'),
        filters: ['noValue']
      },
      updated_at: {
        label: gettext('Updated At'),
        filters: ['noValue']
      },
      vip_address: gettext('IP Address'),
      vip_port_id: gettext('Port ID'),
      vip_subnet_id: gettext('Subnet ID'),
      vip_network_id: gettext('Network ID'),
      listeners: gettext('Listeners'),
      pools: gettext('Pools'),
      provider: gettext('Provider'),
      availability_zone: {
        label: gettext('Availability Zone'),
        filters: ['noValue']
      },
      flavor_id: {
        label: gettext('Flavor ID'),
        filters: ['noValue']
      },
      floating_ip_address: {
        label: gettext('Floating IP'),
        filters: ['noValue']
      }
    };
  }

})();
