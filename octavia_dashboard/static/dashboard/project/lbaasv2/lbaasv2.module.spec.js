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

  describe('LBaaS v2 Module', function () {
    it('should be defined', function () {
      expect(angular.module('horizon.dashboard.project.lbaasv2')).toBeDefined();
    });
  });

  describe('LBaaS v2 Module Base Path', function () {
    var basePath, staticUrl;

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(inject(function ($injector) {
      basePath = $injector.get('horizon.dashboard.project.lbaasv2.basePath');
      staticUrl = $injector.get('$window').STATIC_URL;
    }));

    it('should be defined', function () {
      expect(basePath).toBeDefined();
    });

    it('should be correct', function () {
      expect(basePath).toEqual(staticUrl + 'dashboard/project/lbaasv2/');
    });
  });

  describe('LBaaS v2 Module Constants', function () {
    var patterns, popovers;

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(inject(function ($injector) {
      patterns = $injector.get('horizon.dashboard.project.lbaasv2.patterns');
      popovers = $injector.get('horizon.dashboard.project.lbaasv2.popovers');
    }));

    it('should define patterns', function () {
      expect(patterns).toBeDefined();
    });

    it('should define expected patterns', function () {
      expect(Object.keys(patterns).length).toBe(4);
      var keys = ['ipv4', 'ipv6', 'httpStatusCodes', 'urlPath'];
      angular.forEach(keys, function(key) {
        expect(patterns[key]).toBeDefined();
      });
    });

    it('should define correct pattern for health monitor status codes', function () {
      expect(Object.keys(patterns).length).toBe(4);
      var regex = patterns.httpStatusCodes;
      expect(regex.test('200')).toBe(true);
      expect(regex.test('200-204')).toBe(true);
      expect(regex.test('200,203,204')).toBe(true);
      expect(regex.test('foo')).toBe(false);
      expect(regex.test('200,202-204')).toBe(false);
    });

    it('should define popovers', function () {
      expect(popovers).toBeDefined();
    });

    it('should define expected popover templates', function () {
      expect(Object.keys(popovers).length).toBe(1);
      var keys = ['ipAddresses'];
      angular.forEach(keys, function(key) {
        expect(popovers[key]).toBeDefined();
      });
    });
  });

  describe('LBaaS v2 Module Config', function () {
    var $routeProvider, basePath;

    beforeEach(function() {
      // Create a dummy module so that we can test $routeProvider calls in our actual
      // config block.
      angular.module('configTest', [])
        .config(function(_$routeProvider_, $windowProvider) {
          $routeProvider = _$routeProvider_;
          basePath = $windowProvider.$get().STATIC_URL + 'dashboard/project/lbaasv2/';
          spyOn($routeProvider, 'when').and.callThrough();
        });
      module('ngRoute');
      module('configTest');
      module('horizon.dashboard.project.lbaasv2');
      inject();
    });

    it('should route URLs', function () {
      var loadbalancers = '/project/ngloadbalancersv2';
      var listener = loadbalancers + '/:loadbalancerId/listeners/:listenerId';
      var pool = listener + '/pools/:poolId';
      var member = pool + '/members/:memberId';
      var healthmonitor = pool + '/healthmonitors/:healthmonitorId';
      var routes = [[
        loadbalancers, {
          templateUrl: basePath + 'loadbalancers/table.html'
        }
      ], [
        loadbalancers + '/:loadbalancerId', {
          templateUrl: basePath + 'loadbalancers/detail.html'
        }
      ], [
        listener, {
          templateUrl: basePath + 'listeners/detail.html'
        }
      ], [
        pool, {
          templateUrl: basePath + 'pools/detail.html'
        }
      ], [
        member, {
          templateUrl: basePath + 'members/detail.html'
        }
      ], [
        healthmonitor, {
          templateUrl: basePath + 'healthmonitors/detail.html'
        }
      ]];

      expect($routeProvider.when.calls.count()).toBe(6);
      angular.forEach($routeProvider.when.calls.all(), function(call, i) {
        expect(call.args).toEqual(routes[i]);
      });
    });
  });

})();
