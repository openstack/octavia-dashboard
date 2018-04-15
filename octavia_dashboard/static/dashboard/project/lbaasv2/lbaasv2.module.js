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
(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @name horizon.dashboard.project.lbaasv2
   * @description
   * The LBaaS v2 dashboard's top level module.
   */

  angular
    .module('horizon.dashboard.project.lbaasv2', [
      'horizon.dashboard.project.lbaasv2.loadbalancers',
      'horizon.dashboard.project.lbaasv2.listeners',
      'horizon.dashboard.project.lbaasv2.l7policies',
      'horizon.dashboard.project.lbaasv2.l7rules',
      'horizon.dashboard.project.lbaasv2.pools',
      'horizon.dashboard.project.lbaasv2.members',
      'horizon.dashboard.project.lbaasv2.healthmonitors',
      'horizon.framework.conf',
      'horizon.framework.widgets',
      'horizon.framework.util',
      'horizon.app.core'
    ])
    .config(config)
    .constant('horizon.dashboard.project.lbaasv2.patterns', {
      /* eslint-disable max-len */
      ipv4: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$',
      ipv6: '^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?$',
      /* eslint-enable max-len */
      // HTTP status codes - a single number, comma separated numbers, or a range of numbers.
      httpStatusCodes: /^\d+((\s*-\s*\d+)|(\s*,\s*\d+)+)?$/,
      // URL path - must start with "/" and can include anything after that
      urlPath: /^((\/)|(\/[^/]+)+)$/
    })
    .constant('horizon.dashboard.project.lbaasv2.popovers', {
      ipAddresses: '<ul><li ng-repeat="addr in member.addresses">{$ addr.ip $}</li></ul>'
    })
    .constant('horizon.dashboard.project.lbaasv2.events', events())
    .run(['$rootScope', '$location', function ($rootScope, $location) {
      $rootScope.$on('$routeChangeError', function() {
        $location.path('project/load_balancer');
      });
    }]);

  config.$inject = [
    '$provide',
    '$windowProvider',
    '$routeProvider'
  ];

  function events() {
    return {
      ACTION_DONE: 'horizon.dashboard.project.lbaasv2.ACTION_DONE'
    };
  }

  function config($provide, $windowProvider, $routeProvider) {
    var basePath = $windowProvider.$get().STATIC_URL + 'dashboard/project/lbaasv2/';
    $provide.constant('horizon.dashboard.project.lbaasv2.basePath', basePath);

    var loadbalancers = '/project/load_balancer';
    var listener = loadbalancers + '/:loadbalancerId/listeners/:listenerId';
    var listenerL7Policy = listener + '/l7policies/:l7policyId';
    var listenerL7Rule = listenerL7Policy + '/l7rules/:l7ruleId';
    var listenerPool = listener + '/pools/:poolId';
    var listenerPoolMember = listenerPool + '/members/:memberId';
    var listenerPoolHealthmonitor = listenerPool + '/healthmonitors/:healthmonitorId';
    var loadbalancerPool = loadbalancers + '/:loadbalancerId/pools/:poolId';
    var loadbalancerPoolMember = loadbalancerPool + '/members/:memberId';
    var loadbalancerPoolHealthmonitor = loadbalancerPool + '/healthmonitors/:healthmonitorId';

    $routeProvider
      .when(loadbalancers, {
        templateUrl: basePath + 'loadbalancers/panel.html',
        controller: 'PanelController',
        controllerAs: 'ctrl'
      })
      .when(loadbalancers + '/:loadbalancerId', {
        templateUrl: basePath + 'loadbalancers/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'LoadBalancerDetailController',
        controllerAs: 'ctrl'
      })
      .when(listener, {
        templateUrl: basePath + 'listeners/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ],
          listener: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getListener($route.current.params.listenerId).then(
                function success(response) {
                  response.data.loadbalancerId = $route.current.params.loadbalancerId;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'ListenerDetailController',
        controllerAs: 'ctrl'
      })
      .when(listenerL7Policy, {
        templateUrl: basePath + 'l7policies/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ],
          listener: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getListener($route.current.params.listenerId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          l7policy: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getL7Policy($route.current.params.l7policyId).then(
                function success(response) {
                  response.data.loadbalancerId = $route.current.params.loadbalancerId;
                  response.data.listenerId = $route.current.params.listenerId;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'L7PolicyDetailController',
        controllerAs: 'ctrl'
      })
      .when(listenerL7Rule, {
        templateUrl: basePath + 'l7rules/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ],
          listener: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getListener($route.current.params.listenerId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          l7policy: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getL7Policy($route.current.params.l7policyId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          l7rule: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getL7Rule($route.current.params.l7policyId,
                $route.current.params.l7ruleId).then(
                function success(response) {
                  response.data.loadbalancerId = $route.current.params.loadbalancerId;
                  response.data.listenerId = $route.current.params.listenerId;
                  response.data.l7policyId = $route.current.params.l7policyId;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'L7RuleDetailController',
        controllerAs: 'ctrl'
      })
      .when(listenerPool, {
        templateUrl: basePath + 'pools/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ],
          listener: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getListener($route.current.params.listenerId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          pool: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getPool($route.current.params.poolId).then(
                function success(response) {
                  response.data.loadbalancerId = $route.current.params.loadbalancerId;
                  response.data.listenerId = $route.current.params.listenerId;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'PoolDetailController',
        controllerAs: 'ctrl'
      })
      .when(listenerPoolMember, {
        templateUrl: basePath + 'members/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ],
          listener: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getListener($route.current.params.listenerId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          pool: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getPool($route.current.params.poolId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          member: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getMember($route.current.params.poolId,
                $route.current.params.memberId).then(
                function success(response) {
                  response.data.loadbalancerId = $route.current.params.loadbalancerId;
                  response.data.listenerId = $route.current.params.listenerId;
                  response.data.poolId = $route.current.params.poolId;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'MemberDetailController',
        controllerAs: 'ctrl'
      })
      .when(listenerPoolHealthmonitor, {
        templateUrl: basePath + 'healthmonitors/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ],
          listener: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getListener($route.current.params.listenerId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          pool: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getPool($route.current.params.poolId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          healthmonitor: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getHealthMonitor(
                $route.current.params.healthmonitorId).then(
                function success(response) {
                  response.data.loadbalancerId = $route.current.params.loadbalancerId;
                  response.data.listenerId = $route.current.params.listenerId;
                  response.data.poolId = $route.current.params.poolId;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'HealthMonitorDetailController',
        controllerAs: 'ctrl'
      })
      .when(loadbalancerPool, {
        templateUrl: basePath + 'pools/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ],
          listener: function() {
            return {};
          },
          pool: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getPool($route.current.params.poolId).then(
                function success(response) {
                  response.data.loadbalancerId = $route.current.params.loadbalancerId;
                  response.data.listenerId = $route.current.params.listenerId;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'PoolDetailController',
        controllerAs: 'ctrl'
      })
      .when(loadbalancerPoolMember, {
        templateUrl: basePath + 'members/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ],
          listener: function() {
            return {};
          },
          pool: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getPool($route.current.params.poolId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          member: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getMember($route.current.params.poolId,
                $route.current.params.memberId).then(
                function success(response) {
                  response.data.loadbalancerId = $route.current.params.loadbalancerId;
                  response.data.listenerId = $route.current.params.listenerId;
                  response.data.poolId = $route.current.params.poolId;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'MemberDetailController',
        controllerAs: 'ctrl'
      })
      .when(loadbalancerPoolHealthmonitor, {
        templateUrl: basePath + 'healthmonitors/details/detail.html',
        resolve: {
          loadbalancer: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getLoadBalancer($route.current.params.loadbalancerId, true).then(
                function success(response) {
                  response.data.floating_ip_address = response.data.floating_ip.ip;
                  return response.data;
                }
              );
            }
          ],
          listener: function() {
            return {};
          },
          pool: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getPool($route.current.params.poolId).then(
                function success(response) {
                  return response.data;
                }
              );
            }
          ],
          healthmonitor: [
            '$route',
            'horizon.app.core.openstack-service-api.lbaasv2',
            function($route, api) {
              return api.getHealthMonitor(
                $route.current.params.healthmonitorId).then(
                function success(response) {
                  response.data.loadbalancerId = $route.current.params.loadbalancerId;
                  response.data.listenerId = $route.current.params.listenerId;
                  response.data.poolId = $route.current.params.poolId;
                  return response.data;
                }
              );
            }
          ]
        },
        controller: 'HealthMonitorDetailController',
        controllerAs: 'ctrl'
      });
  }

}());
