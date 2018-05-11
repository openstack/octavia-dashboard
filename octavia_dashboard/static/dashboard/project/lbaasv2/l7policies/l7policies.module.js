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

  /**
   * @ngdoc overview
   * @ngname horizon.dashboard.project.lbaasv2.l7policies
   *
   * @description
   * Provides the services and widgets required to support and display the project l7 policies
   * for the load balancers v2 panel.
   */

  angular
    .module('horizon.dashboard.project.lbaasv2.l7policies', [])
    .constant('horizon.dashboard.project.lbaasv2.l7policies.resourceType',
      'OS::Octavia::L7Policy')
    .run(run);

  run.$inject = [
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.l7policies.actions.create',
    'horizon.dashboard.project.lbaasv2.l7policies.actions.edit',
    'horizon.dashboard.project.lbaasv2.l7policies.actions.delete',
    'horizon.dashboard.project.lbaasv2.l7policies.resourceType'
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
    var l7policyResourceType = registry.getResourceType(resourceType);

    l7policyResourceType
      .setNames(gettext('L7 Policy'), gettext('L7 Policies'))
      .setSummaryTemplateUrl(basePath + 'l7policies/details/drawer.html')
      .setProperties(l7policyProperties(loadBalancerService))
      .setListFunction(loadBalancerService.getL7PoliciesPromise)
      .setLoadFunction(loadBalancerService.getL7PolicyPromise)
      .tableColumns
      .append({
        id: 'name',
        priority: 1,
        urlFunction: loadBalancerService.getL7PolicyDetailsPath
      })
      .append({
        id: 'position',
        sortDefault: true,
        priority: 1
      })
      .append({
        id: 'action',
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

    l7policyResourceType.itemActions
      .append({
        id: 'l7policyEdit',
        service: editService,
        template: {
          text: gettext('Edit L7 Policy')
        }
      })
      .append({
        id: 'l7policyDelete',
        service: deleteService,
        template: {
          text: gettext('Delete L7 Policy'),
          type: 'delete'
        }
      });

    l7policyResourceType.globalActions
      .append({
        id: 'l7policyCreate',
        service: createService,
        template: {
          type: 'create',
          text: gettext('Create L7 Policy')
        }
      });

    l7policyResourceType.batchActions
      .append({
        id: 'l7policyBatchDelete',
        service: deleteService,
        template: {
          text: gettext('Delete L7 Policies'),
          type: 'delete-selected'
        }
      });
  }

  function l7policyProperties(loadBalancerService) {
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
      action: {
        label: gettext('Action'),
        values: loadBalancerService.l7policyAction
      },
      redirect_url: {
        label: gettext('Redirect URL'),
        filters: ['noValue']
      },
      redirect_pool_id: {
        label: gettext('Redirect Pool ID'),
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
      position: gettext('Position'),
      listener_id: gettext('Listener ID'),
      rules: gettext('Rules')
    };
  }

})();
