/*
 * Copyright 2015 IBM Corp.
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
      'ngRoute',
      'horizon.dashboard.project.lbaasv2.loadbalancers',
      'horizon.dashboard.project.lbaasv2.listeners',
      'horizon.dashboard.project.lbaasv2.pools',
      'horizon.dashboard.project.lbaasv2.members',
      'horizon.dashboard.project.lbaasv2.healthmonitors'
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
    });

  config.$inject = [
    '$provide',
    '$windowProvider',
    '$routeProvider'
  ];

  function config($provide, $windowProvider, $routeProvider) {
    var basePath = $windowProvider.$get().STATIC_URL + 'dashboard/project/lbaasv2/';
    $provide.constant('horizon.dashboard.project.lbaasv2.basePath', basePath);

    var loadbalancers = '/project/ngloadbalancersv2';
    var listener = loadbalancers + '/:loadbalancerId/listeners/:listenerId';
    var pool = listener + '/pools/:poolId';
    var member = pool + '/members/:memberId';
    var healthmonitor = pool + '/healthmonitors/:healthmonitorId';

    $routeProvider
      .when(loadbalancers, {
        templateUrl: basePath + 'loadbalancers/table.html'
      })
      .when(loadbalancers + '/:loadbalancerId', {
        templateUrl: basePath + 'loadbalancers/detail.html'
      })
      .when(listener, {
        templateUrl: basePath + 'listeners/detail.html'
      })
      .when(pool, {
        templateUrl: basePath + 'pools/detail.html'
      })
      .when(member, {
        templateUrl: basePath + 'members/detail.html'
      })
      .when(healthmonitor, {
        templateUrl: basePath + 'healthmonitors/detail.html'
      });
  }

}());
