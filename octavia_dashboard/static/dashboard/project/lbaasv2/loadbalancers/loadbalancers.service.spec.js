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

  describe('LBaaS v2 Load Balancers Service', function() {
    var service, $q, $scope, api;

    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      $scope = $injector.get('$rootScope').$new();
      service = $injector.get('horizon.dashboard.project.lbaasv2.loadbalancers.service');
      api = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
    }));

    it('should define value mappings', function() {
      expect(service.operatingStatus).toBeDefined();
      expect(service.provisioningStatus).toBeDefined();
    });

    it('should filter null property', function() {
      expect(service.nullFilter('null')).toBe(gettext('None'));
      expect(service.nullFilter('something else')).toBe('something else');
    });

    it('getDetailsPath creates urls using the item\'s ID', function() {
      var myItem = {id: '1234'};
      expect(service.getDetailsPath(myItem)).toBe('project/load_balancer/1234');
    });

    it("getLoadBalancersPromise provides a promise", inject(function($timeout) {
      var deferred = $q.defer();
      spyOn(api, 'getLoadBalancers').and.returnValue(deferred.promise);
      var result = service.getLoadBalancersPromise({});
      deferred.resolve({data: {items: [{id: 1, updated_at: 'feb8', floating_ip: {}}]}});
      $timeout.flush();
      expect(result.$$state.value.data.items[0].id).toBe(1);
      expect(result.$$state.value.data.items[0].updated_at).toBe('feb8');
      expect(result.$$state.value.data.items[0].trackBy).toBe('1feb8');
    }));

    it("getLoadBalancerPromise provides a promise", inject(function() {
      var deferred = $q.defer();
      spyOn(api, 'getLoadBalancer').and.returnValue(deferred.promise);
      var result = service.getLoadBalancerPromise({});
      deferred.resolve({data: {id: 1, updated_at: 'feb8', floating_ip: {}}});
      expect(result.$$state.value.data.id).toBe(1);
      expect(result.$$state.value.data.updated_at).toBe('feb8');
    }));

    it('getListenerDetailsPath creates urls using the item\'s ID', function() {
      var myItem = {loadbalancerId: '123', id: '456'};
      expect(service.getListenerDetailsPath(myItem))
        .toBe('project/load_balancer/123/listeners/456');
    });

    it("getListenersPromise provides a promise", inject(function($timeout) {
      var deferred = $q.defer();
      spyOn(api, 'getListeners').and.returnValue(deferred.promise);
      var result = service.getListenersPromise({loadbalancerId: 3});
      deferred.resolve({data: {items: [{id: 1, updated_at: 'feb8'}]}});
      $timeout.flush();
      expect(result.$$state.value.data.items[0].id).toBe(1);
      expect(result.$$state.value.data.items[0].updated_at).toBe('feb8');
      expect(result.$$state.value.data.items[0].trackBy).toBe('1feb8');
      expect(result.$$state.value.data.items[0].loadbalancerId).toBe(3);
    }));

    it("getListenerPromise provides a promise", inject(function() {
      var deferred = $q.defer();
      spyOn(api, 'getListener').and.returnValue(deferred.promise);
      var result = service.getListenerPromise({loadbalancerId: 3});
      deferred.resolve({data: {id: 1, updated_at: 'feb8', floating_ip: {}}});
      expect(result.$$state.value.data.id).toBe(1);
      expect(result.$$state.value.data.updated_at).toBe('feb8');
    }));

    it('getL7PolicyDetailsPath creates urls using the item\'s ID', function() {
      var myItem = {loadbalancerId: '123', id: '789', listenerId: '456'};
      expect(service.getL7PolicyDetailsPath(myItem))
        .toBe('project/load_balancer/123/listeners/456/l7policies/789');
    });

    it("getL7PoliciesPromise provides a promise", inject(function($timeout) {
      var deferred = $q.defer();
      spyOn(api, 'getL7Policies').and.returnValue(deferred.promise);
      var result = service.getL7PoliciesPromise({listenerId: 3});
      deferred.resolve({data: {items: [{id: 1, updated_at: 'feb8'}]}});
      $timeout.flush();
      expect(result.$$state.value.data.items[0].id).toBe(1);
      expect(result.$$state.value.data.items[0].updated_at).toBe('feb8');
      expect(result.$$state.value.data.items[0].trackBy).toBe('1feb8');
      expect(result.$$state.value.data.items[0].listenerId).toBe(3);
    }));

    it("getL7PolicyPromise provides a promise", inject(function() {
      var deferred = $q.defer();
      spyOn(api, 'getL7Policy').and.returnValue(deferred.promise);
      var result = service.getL7PolicyPromise(1);
      deferred.resolve({data: {id: 1, updated_at: 'feb8'}});
      expect(result.$$state.value.data.id).toBe(1);
      expect(result.$$state.value.data.updated_at).toBe('feb8');
    }));

    it('getL7RuleDetailsPath creates urls using the item\'s ID', function() {
      var myItem = {loadbalancerId: '1', id: '5', listenerId: '2', l7policyId: '3'};
      expect(service.getL7RuleDetailsPath(myItem))
        .toBe('project/load_balancer/1/listeners/2/l7policies/3/l7rules/5');
    });

    it("getL7RulesPromise provides a promise", inject(function($timeout) {
      var deferred = $q.defer();
      spyOn(api, 'getL7Rules').and.returnValue(deferred.promise);
      var result = service.getL7RulesPromise({listenerId: 3, l7policyId: 5});
      deferred.resolve({data: {items: [{id: 1, updated_at: 'feb8'}]}});
      $timeout.flush();
      expect(result.$$state.value.data.items[0].id).toBe(1);
      expect(result.$$state.value.data.items[0].updated_at).toBe('feb8');
      expect(result.$$state.value.data.items[0].trackBy).toBe('1feb8');
      expect(result.$$state.value.data.items[0].listenerId).toBe(3);
      expect(result.$$state.value.data.items[0].l7policyId).toBe(5);
    }));

    it("getL7RulePromise provides a promise", inject(function() {
      var deferred = $q.defer();
      spyOn(api, 'getL7Rule').and.returnValue(deferred.promise);
      var result = service.getL7RulePromise(2, 1);
      deferred.resolve({data: {id: 1, updated_at: 'feb8'}});
      expect(result.$$state.value.data.id).toBe(1);
      expect(result.$$state.value.data.updated_at).toBe('feb8');
    }));

    it('getPoolDetailsPath creates urls using the item\'s ID', function() {
      var myItem = {loadbalancerId: '123', id: '789', listeners: [{id: '456'}]};
      expect(service.getPoolDetailsPath(myItem))
        .toBe('project/load_balancer/123/listeners/456/pools/789');
      myItem = {loadbalancerId: '123', id: '789', listeners: []};
      expect(service.getPoolDetailsPath(myItem))
        .toBe('project/load_balancer/123/pools/789');
    });

    it("getPoolsPromise provides a promise", inject(function($timeout) {
      var deferred = $q.defer();
      spyOn(api, 'getPools').and.returnValue(deferred.promise);
      var result = service.getPoolsPromise({loadbalancerId: 3});
      deferred.resolve({data: {items: [{id: 1, updated_at: 'feb8'}]}});
      $timeout.flush();
      expect(result.$$state.value.data.items[0].id).toBe(1);
      expect(result.$$state.value.data.items[0].updated_at).toBe('feb8');
      expect(result.$$state.value.data.items[0].trackBy).toBe('1feb8');
      expect(result.$$state.value.data.items[0].loadbalancerId).toBe(3);
    }));

    it("getPoolPromise provides a promise", inject(function() {
      var deferred = $q.defer();
      spyOn(api, 'getPool').and.returnValue(deferred.promise);
      var result = service.getPoolPromise({loadbalancerId: 3});
      deferred.resolve({data: {id: 1, updated_at: 'feb8'}});
      expect(result.$$state.value.data.id).toBe(1);
      expect(result.$$state.value.data.updated_at).toBe('feb8');
    }));

    it('getMemberDetailsPath creates urls using the item\'s ID', function() {
      var myItem = {
        loadbalancerId: '1',
        listenerId: '2',
        poolId: '3',
        id: '4'
      };
      expect(service.getMemberDetailsPath(myItem))
        .toBe('project/load_balancer/1/listeners/2/pools/3/members/4');
      myItem = {
        loadbalancerId: '1',
        poolId: '3',
        id: '4'
      };
      expect(service.getMemberDetailsPath(myItem))
        .toBe('project/load_balancer/1/pools/3/members/4');
    });

    it("getMembersPromise provides a promise", inject(function($timeout) {
      var deferred = $q.defer();
      spyOn(api, 'getMembers').and.returnValue(deferred.promise);
      var result = service.getMembersPromise({
        loadbalancerId: 1,
        listenerId: 2,
        poolId: 3
      });
      deferred.resolve({data: {items: [{id: 4, updated_at: 'feb8'}]}});
      $timeout.flush();
      expect(result.$$state.value.data.items[0].id).toBe(4);
      expect(result.$$state.value.data.items[0].updated_at).toBe('feb8');
      expect(result.$$state.value.data.items[0].trackBy).toBe('4feb8');
      expect(result.$$state.value.data.items[0].loadbalancerId).toBe(1);
      expect(result.$$state.value.data.items[0].listenerId).toBe(2);
      expect(result.$$state.value.data.items[0].poolId).toBe(3);
    }));

    it("getMemberPromise provides a promise", inject(function() {
      var deferred = $q.defer();
      spyOn(api, 'getMember').and.returnValue(deferred.promise);
      var result = service.getMemberPromise(2, 1);
      deferred.resolve({data: {id: 1, updated_at: 'feb8'}});
      expect(result.$$state.value.data.id).toBe(1);
      expect(result.$$state.value.data.updated_at).toBe('feb8');
    }));

    it('getHealthMonitorDetailsPath creates urls using the item\'s ID', function() {
      var myItem = {
        loadbalancerId: '1',
        listenerId: '2',
        poolId: '3',
        id: '4'
      };
      expect(service.getHealthMonitorDetailsPath(myItem))
        .toBe('project/load_balancer/1/listeners/2/pools/3/healthmonitors/4');
      myItem = {
        loadbalancerId: '1',
        poolId: '3',
        id: '4'
      };
      expect(service.getHealthMonitorDetailsPath(myItem))
        .toBe('project/load_balancer/1/pools/3/healthmonitors/4');
    });

    it("getHealthMonitorsPromise provides a promise", inject(function($timeout) {
      var deferred = $q.defer();
      spyOn(api, 'getHealthMonitors').and.returnValue(deferred.promise);
      var result = service.getHealthMonitorsPromise({
        loadbalancerId: 1,
        listenerId: 2,
        poolId: 3
      });
      deferred.resolve({data: {items: [{id: 4, updated_at: 'feb8'}]}});
      $timeout.flush();
      expect(result.$$state.value.data.items[0].id).toBe(4);
      expect(result.$$state.value.data.items[0].updated_at).toBe('feb8');
      expect(result.$$state.value.data.items[0].trackBy).toBe('4feb8');
      expect(result.$$state.value.data.items[0].loadbalancerId).toBe(1);
      expect(result.$$state.value.data.items[0].listenerId).toBe(2);
      expect(result.$$state.value.data.items[0].poolId).toBe(3);
    }));

    it("getHealthMonitorPromise provides a promise", inject(function() {
      var deferred = $q.defer();
      spyOn(api, 'getHealthMonitor').and.returnValue(deferred.promise);
      var result = service.getHealthMonitorPromise(1);
      deferred.resolve({data: {id: 1, updated_at: 'feb8'}});
      expect(result.$$state.value.data.id).toBe(1);
      expect(result.$$state.value.data.updated_at).toBe('feb8');
    }));

    it('should allow checking active status of load balancer', function() {
      var active = null;
      var deferred = $q.defer();
      spyOn(api, 'getLoadBalancer').and.returnValue(deferred.promise);
      deferred.resolve({data: { provisioning_status: 'ACTIVE'}});
      service.isActionable(0).then(function() {
        active = true;
      });
      $scope.$apply();
      expect(active).toBe(true);
    });

    it('should allow checking transitional status of load balancer', function() {
      var active = null;
      var deferred = $q.defer();
      spyOn(api, 'getLoadBalancer').and.returnValue(deferred.promise);
      deferred.resolve({data: { provisioning_status: 'PENDING_UPDATE'}});
      service.isActionable(0).then(angular.noop, function() {
        active = false;
      });
      $scope.$apply();
      expect(active).toBe(false);
    });
  });

})();
