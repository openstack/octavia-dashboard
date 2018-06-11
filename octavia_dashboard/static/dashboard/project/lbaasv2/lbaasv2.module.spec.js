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
    var $routeProvider, basePath; // eslint-disable-line no-unused-vars

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

    it('should route resolved loadbalancer panel',
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/loadbalancers/panel.html'
        ).respond({});
        $location.path('/project/load_balancer/');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      })
    );

    it('should route resolved loadbalancer detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/loadbalancers/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1');
        $rootScope.$digest();
        expect($route.current).toBeDefined();

      });
    }));

    it('should route resolved listener detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      function listenerAPI() {
        var listener = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(listener);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(lbaasv2API, 'getListener').and.callFake(listenerAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/listeners/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1/listeners/2');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      });
    }));

    it('should route resolved listener pool detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      function listenerAPI() {
        var listener = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(listener);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function poolAPI() {
        var pool = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(pool);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(lbaasv2API, 'getListener').and.callFake(listenerAPI);
      spyOn(lbaasv2API, 'getPool').and.callFake(poolAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/pools/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1/listeners/2/pools/3');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      });
    }));

    it('should route resolved listener l7 policy detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      function listenerAPI() {
        var listener = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(listener);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function l7policyAPI() {
        var l7policy = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(l7policy);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(lbaasv2API, 'getListener').and.callFake(listenerAPI);
      spyOn(lbaasv2API, 'getL7Policy').and.callFake(l7policyAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/l7policies/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1/listeners/2/l7policies/3');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      });
    }));

    it('should route resolved listener l7 rule detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      function listenerAPI() {
        var listener = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(listener);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function l7policyAPI() {
        var l7policy = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(l7policy);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function l7ruleAPI() {
        var l7rule = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(l7rule);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(lbaasv2API, 'getListener').and.callFake(listenerAPI);
      spyOn(lbaasv2API, 'getL7Policy').and.callFake(l7policyAPI);
      spyOn(lbaasv2API, 'getL7Rule').and.callFake(l7ruleAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/l7rules/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1/listeners/2/l7policies/3/l7rules/4');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      });
    }));

    it('should route resolved listener pool member detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      function listenerAPI() {
        var listener = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(listener);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function poolAPI() {
        var pool = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(pool);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function memberAPI() {
        var member = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(member);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(lbaasv2API, 'getListener').and.callFake(listenerAPI);
      spyOn(lbaasv2API, 'getPool').and.callFake(poolAPI);
      spyOn(lbaasv2API, 'getMember').and.callFake(memberAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/members/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1/listeners/2/pools/3/members/4');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      });
    }));

    it('should route resolved listener pool health monitor detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      function listenerAPI() {
        var listener = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(listener);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function poolAPI() {
        var pool = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(pool);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function healthmonitorAPI() {
        var healthmonitor = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(healthmonitor);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(lbaasv2API, 'getListener').and.callFake(listenerAPI);
      spyOn(lbaasv2API, 'getPool').and.callFake(poolAPI);
      spyOn(lbaasv2API, 'getHealthMonitor').and.callFake(healthmonitorAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/healthmonitors/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1/listeners/2/pools/3/healthmonitors/4');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      });
    }));

    it('should route resolved loadbalancer pool detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      function poolAPI() {
        var pool = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(pool);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(lbaasv2API, 'getPool').and.callFake(poolAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/pools/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1/pools/3');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      });
    }));

    it('should route resolved loadbalancer pool member detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      function poolAPI() {
        var pool = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(pool);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function memberAPI() {
        var member = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(member);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(lbaasv2API, 'getPool').and.callFake(poolAPI);
      spyOn(lbaasv2API, 'getMember').and.callFake(memberAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/members/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1/pools/3/members/4');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      });
    }));

    it('should route resolved loadbalancer pool health monitor detail', inject(function($injector) {
      function loadbalancerAPI() {
        var loadbalancer = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(loadbalancer);
          },
          then: function(callback) {
            callback({ data: { id: 1, floating_ip: {}}});
          }
        };
      }

      function poolAPI() {
        var pool = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(pool);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      function healthmonitorAPI() {
        var healthmonitor = { provisioning_status: 'ACTIVE' };
        return {
          success: function(callback) {
            callback(healthmonitor);
          },
          then: function(callback) {
            callback({ data: { id: 1}});
          }
        };
      }

      var lbaasv2API = $injector.get('horizon.app.core.openstack-service-api.lbaasv2');
      spyOn(lbaasv2API, 'getLoadBalancer').and.callFake(loadbalancerAPI);
      spyOn(lbaasv2API, 'getPool').and.callFake(poolAPI);
      spyOn(lbaasv2API, 'getHealthMonitor').and.callFake(healthmonitorAPI);
      inject(function($route, $location, $rootScope, $httpBackend) {
        $httpBackend.expectGET(
          '/static/dashboard/project/lbaasv2/healthmonitors/details/detail.html'
        ).respond({});
        $location.path('/project/load_balancer/1/pools/3/healthmonitors/4');
        $rootScope.$digest();
        expect($route.current).toBeDefined();
      });
    }));

    it('should redirect to project home on route change error',
      inject(function($location, $rootScope) {
        spyOn($location, 'path').and.callThrough();
        $rootScope.$emit('$routeChangeError', null, null, null, 'routeChangeError');
        expect($location.path).toHaveBeenCalledWith('project/load_balancer');
      })
    );

  });

})();
