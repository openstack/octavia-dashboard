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
(function() {
  'use strict';

  describe('LBaaS v2 API', function() {
    var testCall, service;
    var apiService = {};
    var toastService = {};

    beforeEach(module('horizon.mock.openstack-service-api', function($provide, initServices) {
      testCall = initServices($provide, apiService, toastService);
    }));

    beforeEach(module('horizon.app.core.openstack-service-api'));

    beforeEach(inject(['horizon.app.core.openstack-service-api.lbaasv2', function(lbaasv2API) {
      service = lbaasv2API;
    }]));

    it('defines the service', function() {
      expect(service).toBeDefined();
    });

    var tests = [
      {
        func: 'getLoadBalancers',
        method: 'get',
        path: '/api/lbaas/loadbalancers/',
        error: 'Unable to retrieve load balancers.',
        testInput: [ true ],
        data: { params: { full: true } }
      },
      {
        func: 'getLoadBalancer',
        method: 'get',
        path: '/api/lbaas/loadbalancers/1234/',
        error: 'Unable to retrieve load balancer.',
        testInput: [ '1234', true ],
        data: { params: { full: true } }
      },
      {
        func: 'deleteLoadBalancer',
        method: 'delete',
        path: '/api/lbaas/loadbalancers/1234/',
        error: 'Unable to delete load balancer.',
        testInput: [ '1234' ]
      },
      {
        func: 'getListeners',
        method: 'get',
        path: '/api/lbaas/listeners/',
        error: 'Unable to retrieve listeners.',
        testInput: [ '1234' ],
        data: { params: { loadbalancerId: '1234' } }
      },
      {
        func: 'getListeners',
        method: 'get',
        path: '/api/lbaas/listeners/',
        data: {},
        error: 'Unable to retrieve listeners.'
      },
      {
        func: 'getListener',
        method: 'get',
        path: '/api/lbaas/listeners/1234/',
        data: { params: { includeChildResources: true } },
        error: 'Unable to retrieve listener.',
        testInput: [ '1234', true ]
      },
      {
        func: 'getListener',
        method: 'get',
        path: '/api/lbaas/listeners/1234/',
        data: {},
        error: 'Unable to retrieve listener.',
        testInput: [ '1234', false ]
      },
      {
        func: 'getL7Policies',
        method: 'get',
        path: '/api/lbaas/l7policies/',
        error: 'Unable to retrieve l7 policies.',
        testInput: [ '1234' ],
        data: { params: { listenerId: '1234' } }
      },
      {
        func: 'getL7Policies',
        method: 'get',
        path: '/api/lbaas/l7policies/',
        data: {},
        error: 'Unable to retrieve l7 policies.'
      },
      {
        func: 'getL7Policy',
        method: 'get',
        path: '/api/lbaas/l7policies/1234/',
        data: { params: { includeChildResources: true } },
        error: 'Unable to retrieve l7 policy.',
        testInput: [ '1234', true ]
      },
      {
        func: 'getL7Policy',
        method: 'get',
        path: '/api/lbaas/l7policies/1234/',
        data: {},
        error: 'Unable to retrieve l7 policy.',
        testInput: [ '1234', false ]
      },
      {
        func: 'deleteL7Policy',
        method: 'delete',
        path: '/api/lbaas/l7policies/1234/',
        error: 'Unable to delete l7 policy.',
        testInput: [ '1234' ]
      },
      {
        func: 'getL7Rules',
        method: 'get',
        path: '/api/lbaas/l7policies/1234/l7rules/',
        error: 'Unable to retrieve l7 rules.',
        testInput: [ '1234' ]
      },
      {
        func: 'getL7Rule',
        method: 'get',
        path: '/api/lbaas/l7policies/1234/l7rules/5678/',
        error: 'Unable to retrieve l7 rule.',
        testInput: [ '1234', '5678' ]
      },
      {
        func: 'deleteL7Rule',
        method: 'delete',
        path: '/api/lbaas/l7policies/1234/l7rules/5678/',
        error: 'Unable to delete l7 rule.',
        testInput: [ '1234', '5678' ]
      },
      {
        func: 'getPools',
        method: 'get',
        path: '/api/lbaas/pools/',
        error: 'Unable to retrieve pools.',
        testInput: [ '1234' ],
        data: { params: { loadbalancerId: '1234' } }
      },
      {
        func: 'getPools',
        method: 'get',
        path: '/api/lbaas/pools/',
        error: 'Unable to retrieve pools.',
        testInput: [ '1234', '5678' ],
        data: { params: { loadbalancerId: '1234', listenerId: '5678' } }
      },
      {
        func: 'getPools',
        method: 'get',
        path: '/api/lbaas/pools/',
        error: 'Unable to retrieve pools.',
        testInput: [ undefined, '5678' ],
        data: { params: { listenerId: '5678' } }
      },
      {
        func: 'getPools',
        method: 'get',
        path: '/api/lbaas/pools/',
        data: {},
        error: 'Unable to retrieve pools.'
      },
      {
        func: 'getPool',
        method: 'get',
        path: '/api/lbaas/pools/1234/',
        data: { params: { includeChildResources: true } },
        error: 'Unable to retrieve pool.',
        testInput: [ '1234', true ]
      },
      {
        func: 'getPool',
        method: 'get',
        path: '/api/lbaas/pools/1234/',
        data: {},
        error: 'Unable to retrieve pool.',
        testInput: [ '1234', false ]
      },
      {
        func: 'deletePool',
        method: 'delete',
        path: '/api/lbaas/pools/1234/',
        error: 'Unable to delete pool.',
        testInput: [ '1234' ]
      },
      {
        func: 'getMembers',
        method: 'get',
        path: '/api/lbaas/pools/1234/members/',
        error: 'Unable to retrieve members.',
        testInput: [ '1234' ]
      },
      {
        func: 'getMember',
        method: 'get',
        path: '/api/lbaas/pools/1234/members/5678/',
        error: 'Unable to retrieve member.',
        testInput: [ '1234', '5678' ]
      },
      {
        func: 'deleteMember',
        method: 'delete',
        path: '/api/lbaas/pools/1234/members/5678/',
        error: 'Unable to delete member.',
        testInput: [ '1234', '5678' ]
      },
      {
        func: 'editMember',
        method: 'put',
        path: '/api/lbaas/pools/1234/members/5678/',
        error: 'Unable to update member.',
        data: { weight: 2 },
        testInput: [ '1234', '5678', { weight: 2 } ]
      },
      {
        func: 'getHealthMonitors',
        method: 'get',
        path: '/api/lbaas/healthmonitors/',
        error: 'Unable to retrieve health monitors.',
        testInput: [ '1234' ],
        data: { params: { poolId: '1234' } }
      },
      {
        func: 'getHealthMonitors',
        method: 'get',
        path: '/api/lbaas/healthmonitors/',
        data: {},
        error: 'Unable to retrieve health monitors.'
      },
      {
        func: 'getHealthMonitor',
        method: 'get',
        path: '/api/lbaas/healthmonitors/1234/',
        error: 'Unable to retrieve health monitor.',
        testInput: [ '1234' ]
      },
      {
        func: 'editHealthMonitor',
        method: 'put',
        path: '/api/lbaas/healthmonitors/1234/',
        error: 'Unable to update health monitor.',
        data: { name: 'healthmonitor-1' },
        testInput: [ '1234', { name: 'healthmonitor-1' } ]
      },
      {
        func: 'deleteHealthMonitor',
        method: 'delete',
        path: '/api/lbaas/healthmonitors/1234/',
        error: 'Unable to delete health monitor.',
        testInput: [ '1234' ]
      },
      {
        func: 'getFlavors',
        method: 'get',
        path: '/api/lbaas/flavors/',
        error: 'Unable to retrieve flavors.',
        testInput: [],
        data: { params: {} }
      },
      {
        func: 'getFlavor',
        method: 'get',
        path: '/api/lbaas/flavors/1234/',
        error: 'Unable to retrieve flavor.',
        testInput: [ '1234' ]
      },
      {
        func: 'editFlavor',
        method: 'put',
        path: '/api/lbaas/flavors/1234/',
        error: 'Unable to update flavor.',
        data: { name: 'flavor-1' },
        testInput: [ '1234', { name: 'flavor-1' } ]
      },
      {
        func: 'deleteFlavor',
        method: 'delete',
        path: '/api/lbaas/flavors/1234/',
        error: 'Unable to delete flavor.',
        testInput: [ '1234' ]
      },
      {
        func: 'getFlavorProfiles',
        method: 'get',
        path: '/api/lbaas/flavorprofiles/',
        error: 'Unable to retrieve flavor profiles.',
        testInput: [],
        data: { params: {} }
      },
      {
        func: 'getFlavorProfile',
        method: 'get',
        path: '/api/lbaas/flavorprofiles/1234/',
        error: 'Unable to retrieve flavor profile.',
        testInput: [ '1234' ]
      },
      {
        func: 'editFlavorProfile',
        method: 'put',
        path: '/api/lbaas/flavorprofiles/1234/',
        error: 'Unable to update flavor profile.',
        data: { name: 'flavorprofile-1' },
        testInput: [ '1234', { name: 'flavorprofile-1' } ]
      },
      {
        func: 'deleteFlavorProfile',
        method: 'delete',
        path: '/api/lbaas/flavorprofiles/1234/',
        error: 'Unable to delete flavor profile.',
        testInput: [ '1234' ]
      },
      {
        func: 'getAvailabilityZones',
        method: 'get',
        path: '/api/lbaas/availabilityzones/',
        error: 'Unable to retrieve availability zones.',
        testInput: [],
        data: { params: {} }
      },
      {
        func: 'createLoadBalancer',
        method: 'post',
        path: '/api/lbaas/loadbalancers/',
        error: 'Unable to create load balancer.',
        data: { name: 'loadbalancer-1' },
        testInput: [ { name: 'loadbalancer-1' } ]
      },
      {
        func: 'editLoadBalancer',
        method: 'put',
        path: '/api/lbaas/loadbalancers/1234/',
        error: 'Unable to update load balancer.',
        data: { name: 'loadbalancer-1' },
        testInput: [ '1234', { name: 'loadbalancer-1' } ]
      },
      {
        func: 'createListener',
        method: 'post',
        path: '/api/lbaas/listeners/',
        error: 'Unable to create listener.',
        data: { name: 'listener-1' },
        testInput: [ { name: 'listener-1' } ]
      },
      {
        func: 'editListener',
        method: 'put',
        path: '/api/lbaas/listeners/1234/',
        error: 'Unable to update listener.',
        data: { name: 'listener-1' },
        testInput: [ '1234', { name: 'listener-1' } ]
      },
      {
        func: 'deleteListener',
        method: 'delete',
        path: '/api/lbaas/listeners/1234/',
        error: 'Unable to delete listener.',
        testInput: [ '1234' ]
      },
      {
        func: 'createL7Policy',
        method: 'post',
        path: '/api/lbaas/l7policies/',
        error: 'Unable to create l7 policy.',
        data: { name: 'l7policy-1' },
        testInput: [ { name: 'l7policy-1' } ]
      },
      {
        func: 'editL7Policy',
        method: 'put',
        path: '/api/lbaas/l7policies/1234/',
        error: 'Unable to update l7 policy.',
        data: { name: 'l7policy-1' },
        testInput: [ '1234', { name: 'l7policy-1' } ]
      },
      {
        func: 'createL7Rule',
        method: 'post',
        path: '/api/lbaas/l7policies/1234/l7rules/',
        error: 'Unable to create l7 rule.',
        data: { name: 'l7rule-1' },
        testInput: [ '1234', { name: 'l7rule-1' } ]
      },
      {
        func: 'editL7Rule',
        method: 'put',
        path: '/api/lbaas/l7policies/1234/l7rules/5678/',
        error: 'Unable to update l7 rule.',
        data: { name: 'l7rule-1' },
        testInput: [ '1234', '5678', { name: 'l7rule-1' } ]
      },
      {
        func: 'createPool',
        method: 'post',
        path: '/api/lbaas/pools/',
        error: 'Unable to create pool.',
        data: { name: 'pool-1' },
        testInput: [ { name: 'pool-1' } ]
      },
      {
        func: 'editPool',
        method: 'put',
        path: '/api/lbaas/pools/1234/',
        error: 'Unable to update pool.',
        data: { name: 'pool-1' },
        testInput: [ '1234', { name: 'pool-1' } ]
      },
      {
        func: 'createHealthMonitor',
        method: 'post',
        path: '/api/lbaas/healthmonitors/',
        error: 'Unable to create health monitor.',
        data: { name: 'healthmonitor-1' },
        testInput: [ { name: 'healthmonitor-1' } ]
      },
      {
        func: 'createFlavor',
        method: 'post',
        path: '/api/lbaas/flavors/',
        error: 'Unable to create flavor.',
        data: { name: 'flavor-1' },
        testInput: [ { name: 'flavor-1' } ]
      },
      {
        func: 'createFlavorProfile',
        method: 'post',
        path: '/api/lbaas/flavorprofiles/',
        error: 'Unable to create flavor profile.',
        data: { name: 'flavorprofile-1' },
        testInput: [ { name: 'flavorprofile-1' } ]
      },
      {
        func: 'updateMemberList',
        method: 'put',
        path: '/api/lbaas/pools/1234/members/',
        error: 'Unable to update member list.',
        data: { name: 'member-1' },
        testInput: [ '1234', { name: 'member-1' } ]
      }
    ];

    // Iterate through the defined tests and apply as Jasmine specs.
    angular.forEach(tests, function(params) {
      it('defines the ' + params.func + ' call properly', function() {
        var callParams = [apiService, service, toastService, params];
        testCall.apply(this, callParams);
      });
    });

    it('supresses the error if instructed for deleteLoadBalancer', function() {
      spyOn(apiService, 'delete').and.returnValue("promise");
      expect(service.deleteLoadBalancer("whatever", true)).toBe("promise");
    });

    it('supresses the error if instructed for deleteListener', function() {
      spyOn(apiService, 'delete').and.returnValue("promise");
      expect(service.deleteListener("whatever", true)).toBe("promise");
    });

    it('supresses the error if instructed for deleteL7Policy', function() {
      spyOn(apiService, 'delete').and.returnValue("promise");
      expect(service.deleteL7Policy("whatever", true)).toBe("promise");
    });

    it('supresses the error if instructed for deleteL7Rule', function() {
      spyOn(apiService, 'delete').and.returnValue("promise");
      expect(service.deleteL7Rule("whatever", "whatever", true)).toBe("promise");
    });

    it('supresses the error if instructed for deletePool', function() {
      spyOn(apiService, 'delete').and.returnValue("promise");
      expect(service.deletePool("whatever", true)).toBe("promise");
    });

    it('supresses the error if instructed for deleteHealthMonitor', function() {
      spyOn(apiService, 'delete').and.returnValue("promise");
      expect(service.deleteHealthMonitor("whatever", true)).toBe("promise");
    });

    it('supresses the error if instructed for deleteFlavor', function() {
      spyOn(apiService, 'delete').and.returnValue("promise");
      expect(service.deleteFlavor("whatever", true)).toBe("promise");
    });

    it('supresses the error if instructed for deleteFlavorProfile', function() {
      spyOn(apiService, 'delete').and.returnValue("promise");
      expect(service.deleteFlavorProfile("whatever", true)).toBe("promise");
    });

  });

})();
