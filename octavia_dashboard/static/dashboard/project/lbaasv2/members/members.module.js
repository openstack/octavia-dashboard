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
   * @ngname horizon.dashboard.project.lbaasv2.members
   *
   * @description
   * Provides the services and widgets required to support and display the project members
   * for the load balancers v2 panel.
   */

  angular
    .module('horizon.dashboard.project.lbaasv2.members', [])
    .constant('horizon.dashboard.project.lbaasv2.members.resourceType',
      'OS::Octavia::Member')
    .run(run);

  run.$inject = [
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.members.actions.update-member-list',
    'horizon.dashboard.project.lbaasv2.members.actions.edit-member',
    'horizon.dashboard.project.lbaasv2.members.actions.delete',
    'horizon.dashboard.project.lbaasv2.members.resourceType'
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
    var memberResourceType = registry.getResourceType(resourceType);

    memberResourceType
      .setNames(gettext('Member'), gettext('Members'))
      .setSummaryTemplateUrl(basePath + 'members/details/drawer.html')
      .setProperties(memberProperties(loadBalancerService))
      .setListFunction(loadBalancerService.getMembersPromise)
      .setLoadFunction(loadBalancerService.getMemberPromise)
      .tableColumns
      .append({
        id: 'name',
        priority: 1,
        sortDefault: true,
        urlFunction: loadBalancerService.getMemberDetailsPath
      })
      .append({
        id: 'address',
        priority: 1
      })
      .append({
        id: 'protocol_port',
        priority: 1
      })
      .append({
        id: 'weight',
        priority: 1
      })
      .append({
        id: 'backup',
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

    memberResourceType.itemActions
      .append({
        id: 'memberEdit',
        service: editService,
        template: {
          text: gettext('Edit Member')
        }
      })
      .append({
        id: 'memberDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Member'),
          type: 'delete'
        }
      });

    memberResourceType.globalActions
      .append({
        id: 'memberCreate',
        service: createService,
        template: {
          type: 'create',
          text: gettext('Add/Remove Members')
        }
      });

    memberResourceType.batchActions
      .append({
        id: 'memberBatchDelete',
        service: deleteService,
        template: {
          text: gettext('Delete Members'),
          type: 'delete-selected'
        }
      });
  }

  function memberProperties(loadBalancerService) {
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
      backup: {
        label: gettext('Backup'),
        filters: ['yesno']
      },
      address: gettext('IP Address'),
      protocol_port: gettext('Port'),
      weight: gettext('Weight'),
      subnet_id: gettext('Subnet ID'),
      project_id: gettext('Project ID'),
      created_at: {
        label: gettext('Created At'),
        filters: ['noValue']
      },
      updated_at: {
        label: gettext('Updated At'),
        filters: ['noValue']
      },
      monitor_address: {
        label: gettext('Monitor Address'),
        filters: ['noValue']
      },
      monitor_port: {
        label: gettext('Monitor Port'),
        filters: ['noValue']
      }
    };
  }

})();
