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
   * @ngname horizon.dashboard.project.lbaasv2.l7rules
   *
   * @description
   * Provides the services and widgets required to support and display the project l7 rules
   * for the load balancers v2 panel.
   */

  angular
    .module('horizon.dashboard.project.lbaasv2.l7rules', [])
    .constant('horizon.dashboard.project.lbaasv2.l7rules.resourceType',
      'OS::Octavia::L7Rule')
    .run(run);

  run.$inject = [
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.dashboard.project.lbaasv2.basePath',
    'horizon.dashboard.project.lbaasv2.loadbalancers.service',
    'horizon.dashboard.project.lbaasv2.l7rules.actions.create',
    'horizon.dashboard.project.lbaasv2.l7rules.actions.edit',
    'horizon.dashboard.project.lbaasv2.l7rules.actions.delete',
    'horizon.dashboard.project.lbaasv2.l7rules.resourceType'
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
    var l7ruleResourceType = registry.getResourceType(resourceType);

    l7ruleResourceType
      .setNames(gettext('L7 Rule'), gettext('L7 Rules'))
      .setSummaryTemplateUrl(basePath + 'l7rules/details/drawer.html')
      .setProperties(l7ruleProperties(loadBalancerService))
      .setListFunction(loadBalancerService.getL7RulesPromise)
      .setLoadFunction(loadBalancerService.getL7RulePromise)
      .tableColumns
      .append({
        id: 'type',
        priority: 1,
        urlFunction: loadBalancerService.getL7RuleDetailsPath
      })
      .append({
        id: 'compare_type',
        priority: 1
      })
      .append({
        id: 'key',
        priority: 1
      })
      .append({
        id: 'rule_value',
        priority: 1
      })
      .append({
        id: 'invert',
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

    l7ruleResourceType.itemActions
      .append({
        id: 'l7ruleEdit',
        service: editService,
        template: {
          text: gettext('Edit L7 Rule')
        }
      })
      .append({
        id: 'l7ruleDelete',
        service: deleteService,
        template: {
          text: gettext('Delete L7 Rule'),
          type: 'delete'
        }
      });

    l7ruleResourceType.globalActions
      .append({
        id: 'l7ruleCreate',
        service: createService,
        template: {
          type: 'create',
          text: gettext('Create L7 Rule')
        }
      });

    l7ruleResourceType.batchActions
      .append({
        id: 'l7ruleBatchDelete',
        service: deleteService,
        template: {
          text: gettext('Delete L7 Rules'),
          type: 'delete-selected'
        }
      });
  }

  function l7ruleProperties(loadBalancerService) {
    return {
      id: gettext('ID'),
      type: {
        label: gettext('Type'),
        values: loadBalancerService.l7ruleType
      },
      compare_type: {
        label: gettext('Compare Type'),
        values: loadBalancerService.l7ruleCompareType
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
      key: {
        label: gettext('Key'),
        filters: ['noValue']
      },
      rule_value: {
        label: gettext('Value'),
        filters: ['noValue']
      },
      invert: {
        label: gettext('Invert'),
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
      }
    };
  }

})();
