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

  describe('LBaaS v2 Workflow Model Service', function() {
    var model, $q, scope, listenerResources, barbicanEnabled,
      certificatesError, mockNetworks, mockFlavors,
      mockAvailabilityZones;
    var includeChildResources = true;

    beforeEach(module('horizon.framework.util.i18n'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(function() {
      listenerResources = {
        listener: {
          admin_state_up: true,
          id: '1234',
          name: 'Listener 1',
          description: 'listener description',
          protocol: 'HTTP',
          protocol_port: 80,
          connection_limit: 999,
          load_balancers: [{id: '1234'}],
          sni_container_refs: ['container2'],
          insert_headers: {
            'X-Forwarded-For': 'True',
            'X-Forwarded-Port': 'True',
            'X-Forwarded-Proto': 'True'
          }
        },
        pool: {
          admin_state_up: true,
          id: '1234',
          name: 'Pool 1',
          protocol: 'HTTP',
          lb_algorithm: 'ROUND_ROBIN',
          session_persistence: {
            type: 'APP_COOKIE',
            cookie_name: 'cookie_name'
          },
          description: 'pool description'
        },
        members: [
          {
            id: '1234',
            address: '1.2.3.4',
            subnet_id: 'subnet-1',
            protocol_port: 80,
            weight: 1
          },
          {
            id: '5678',
            address: '5.6.7.8',
            subnet_id: 'subnet-1',
            protocol_port: 80,
            weight: 1
          }
        ],
        monitor: {
          admin_state_up: true,
          id: '1234',
          type: 'HTTP',
          delay: 1,
          timeout: 1,
          max_retries: 1,
          max_retries_down: 1,
          http_method: 'POST',
          expected_codes: '200',
          url_path: '/test'
        }
      };
      barbicanEnabled = true;
      certificatesError = false;
      mockNetworks = {
        a1: {
          name: 'network_1',
          id: 'a1'
        },
        b2: {
          name: 'network_2',
          id: 'b2'
        }
      };
      mockFlavors = {
        f1: {
          name: 'flavor_1',
          id: 'f1'
        },
        f2: {
          name: 'flavor_2',
          id: 'f2'
        }
      };
      mockAvailabilityZones = {
        az_1: {
          name: 'az_1',
          id: 'az1'
        },
        az_2: {
          name: 'az_2',
          id: 'az2'
        }
      };
    });

    beforeEach(module(function($provide) {
      $provide.value('horizon.app.core.openstack-service-api.lbaasv2', {
        getLoadBalancers: function() {
          var loadbalancers = [
            {id: '1234', name: 'Load Balancer 1'},
            {id: '5678', name: 'Load Balancer 2'},
            {id: '9012', name: 'myLoadBalancer3'}
          ];

          var deferred = $q.defer();
          deferred.resolve({data: {items: loadbalancers}});

          return deferred.promise;
        },
        getLoadBalancer: function() {
          var loadbalancer = {
            admin_state_up: true,
            id: '1234',
            name: 'Load Balancer 1',
            vip_address: '1.2.3.4',
            vip_subnet_id: 'subnet-1',
            flavor_id: 'flavor-1',
            availability_zone: 'az-1',
            description: ''
          };

          var deferred = $q.defer();
          deferred.resolve({data: loadbalancer});

          return deferred.promise;
        },
        getListeners: function() {
          var listeners = [
            {id: '1234', name: 'Listener 1', protocol_port: 80},
            {id: '5678', name: 'Listener 2', protocol_port: 81},
            {id: '9012', name: 'myListener3', protocol_port: 82}
          ];

          var deferred = $q.defer();
          deferred.resolve({data: {items: listeners}});

          return deferred.promise;
        },
        getPools: function() {
          var pools = [
            {
              id: '1234',
              name: 'Pool 1',
              listeners: ['1234'],
              protocol: 'HTTP'
            },
            {id: '5678', name: 'Pool 2', listeners: [], protocol: 'HTTP'},
            {id: '9012', name: 'Pool 3', listeners: [], protocol: 'HTTPS'}
          ];

          var deferred = $q.defer();
          deferred.resolve({data: {items: pools}});

          return deferred.promise;
        },
        getListener: function() {
          var deferred = $q.defer();
          var listenerData;
          listenerData = includeChildResources ? listenerResources : listenerResources.listener;
          deferred.resolve({data: listenerData});
          return deferred.promise;
        },
        getL7Policy: function() {
          var l7policy = {
            admin_state_up: true,
            id: '1234',
            name: 'L7 Policy 1',
            description: 'l7 policy description',
            action: 'REDIRECT_TO_URL',
            position: 1,
            redirect_url: 'http://example.com'
          };

          var deferred = $q.defer();
          deferred.resolve({data: l7policy});

          return deferred.promise;
        },
        getL7Rule: function() {
          var l7rule = {
            admin_state_up: true,
            id: '1234',
            type: 'HOST_NAME',
            compare_type: 'EQUAL_TO',
            value: 'api.example.com',
            invert: false
          };

          var deferred = $q.defer();
          deferred.resolve({data: l7rule});

          return deferred.promise;
        },
        getPool: function() {
          var poolResources = angular.copy(listenerResources);
          delete poolResources.listener;
          var deferred = $q.defer();
          var poolData;
          poolData = includeChildResources ? poolResources : poolResources.pool;
          deferred.resolve({data: poolData});
          return deferred.promise;
        },
        getMembers: function() {
          var members = [
            {
              id: '1234',
              address: '1.2.3.4',
              subnet_id: 'subnet-1',
              protocol_port: 80,
              weight: 1
            },
            {
              id: '5678',
              address: '5.6.7.8',
              subnet_id: 'subnet-1',
              protocol_port: 80,
              weight: 1
            }];

          var deferred = $q.defer();
          deferred.resolve({data: {items: members}});

          return deferred.promise;
        },
        getHealthMonitor: function() {
          var monitor = {
            id: '1234',
            type: 'HTTP',
            delay: 1,
            timeout: 1,
            max_retries: 1,
            max_retries_down: 1,
            http_method: 'POST',
            expected_codes: '200',
            url_path: '/test'
          };

          var deferred = $q.defer();
          deferred.resolve({data: monitor});

          return deferred.promise;
        },
        getFlavors: function() {
          var flavors = [{
            name: 'flavor_1',
            id: 'f1'
          }, {
            name: 'flavor_2',
            id: 'f2'
          }];

          var deferred = $q.defer();
          deferred.resolve({data: {items: flavors}});
          return deferred.promise;
        },
        getAvailabilityZones: function() {
          var availabilityZones = [{
            name: 'az_1',
            id: 'az1'
          }, {
            name: 'az_2',
            id: 'az2'
          }];

          var deferred = $q.defer();
          deferred.resolve({data: {items: availabilityZones}});
          return deferred.promise;
        },
        createLoadBalancer: function(spec) {
          return spec;
        },
        editLoadBalancer: function(id, spec) {
          return spec;
        },
        createListener: function(spec) {
          return spec;
        },
        editListener: function(id, spec) {
          return spec;
        },
        createL7Policy: function(spec) {
          return spec;
        },
        editL7Policy: function(id, spec) {
          return spec;
        },
        createL7Rule: function(l7policyId, spec) {
          return spec;
        },
        editL7Rule: function(l7policyId, l7ruleId, spec) {
          return spec;
        },
        createPool: function(spec) {
          return spec;
        },
        editPool: function(id, spec) {
          return spec;
        },
        createHealthMonitor: function(spec) {
          return spec;
        },
        editHealthMonitor: function(id, spec) {
          return spec;
        },
        updateMemberList: function(id, spec) {
          return spec;
        }
      });

      $provide.value('horizon.app.core.openstack-service-api.octavia-barbican', {
        getCertificates: function() {
          var containers = [
            {
              container_ref: 'container1',
              secret_refs: [{name: 'certificate', secret_ref: 'secret1'}]
            }, {
              container_ref: 'container2',
              secret_refs: [{name: 'certificate', secret_ref: 'certificate1'},
                {name: 'private_key', secret_ref: 'privatekey1'}]
            },
            {
              container_ref: 'container3',
              secret_refs: [{name: 'certificate', secret_ref: 'certificate2'},
                {name: 'private_key', secret_ref: 'privatekey2'}]
            }
          ];

          var deferred = $q.defer();
          if (certificatesError) {
            deferred.reject();
          } else {
            deferred.resolve({data: {items: containers}});
          }

          return deferred.promise;
        },
        getSecrets: function() {
          var secrets = [
            {
              name: 'foo',
              expiration: '2016-03-26T21:10:45.417835',
              secret_ref: 'certificate1'
            }, {
              expiration: '2016-03-28T21:10:45.417835',
              secret_ref: 'certificate2',
              secret_type: 'opaque'
            }, {
              secret_ref: 'privatekey1'
            }, {
              secret_ref: 'privatekey2'
            }, {
              secret_ref: 'pkcs12',
              secret_type: 'opaque'
            }
          ];

          var deferred = $q.defer();
          deferred.resolve({data: {items: secrets}});

          return deferred.promise;
        }
      });

      $provide.value('horizon.app.core.openstack-service-api.neutron', {
        getSubnets: function() {
          var subnets = [{id: 'subnet-1', name: 'subnet-1'},
            {id: 'subnet-2', name: 'subnet-2'}];

          var deferred = $q.defer();
          deferred.resolve({data: {items: subnets}});

          return deferred.promise;
        },
        getPorts: function() {
          var ports = [{
            device_id: '1',
            fixed_ips: [{ip_address: '1.2.3.4', subnet_id: '1'},
              {ip_address: '2.3.4.5', subnet_id: '2'}]
          },
            {
              device_id: '2',
              fixed_ips: [{ip_address: '3.4.5.6', subnet_id: '1'},
                {ip_address: '4.5.6.7', subnet_id: '2'}]
            }];

          var deferred = $q.defer();
          deferred.resolve({data: {items: ports}});

          return deferred.promise;
        },
        getNetworks: function() {
          var networks = [{
            name: 'network_1',
            id: 'a1'
          }, {
            name: 'network_2',
            id: 'b2'
          }];

          var deferred = $q.defer();
          deferred.resolve({data: {items: networks}});
          return deferred.promise;
        }
      });

      $provide.value('horizon.app.core.openstack-service-api.nova', {
        getServers: function() {
          var servers = [{id: '1', name: 'server-1', addresses: {foo: 'bar'}},
            {id: '2', name: 'server-2', addresses: {foo: 'bar'}},
            {id: '3', name: 'server-3'}];

          var deferred = $q.defer();
          deferred.resolve({data: {items: servers}});

          return deferred.promise;
        }
      });

      $provide.value('horizon.app.core.openstack-service-api.serviceCatalog', {
        ifTypeEnabled: function() {
          var deferred = $q.defer();
          deferred[barbicanEnabled ? 'resolve' : 'reject']();
          return deferred.promise;
        }
      });
    }));

    beforeEach(inject(function($injector) {
      model = $injector.get(
        'horizon.dashboard.project.lbaasv2.workflow.model'
      );
      $q = $injector.get('$q');
      scope = $injector.get('$rootScope').$new();
    }));

    describe('Initial model (pre-initialize)', function() {

      it('is defined', function() {
        expect(model).toBeDefined();
      });

      it('has initialization status parameters', function() {
        expect(model.initializing).toBeDefined();
        expect(model.initialized).toBeDefined();
      });

      it('does not yet have a spec', function() {
        expect(model.spec).toBeNull();
      });

      it('has empty subnets array', function() {
        expect(model.subnets).toEqual([]);
      });

      it('has empty networks', function() {
        expect(model.networks).toEqual({});
      });

      it('has empty members array', function() {
        expect(model.members).toEqual([]);
      });

      it('has empty certificates array', function() {
        expect(model.certificates).toEqual([]);
      });

      it('has empty listener protocol_ports array', function() {
        expect(model.listenerPorts).toEqual([]);
      });

      it('has array of listener protocols', function() {
        expect(model.listenerProtocols).toEqual(['HTTP', 'TCP', 'TERMINATED_HTTPS', 'HTTPS',
          'UDP', 'SCTP']);
      });

      it('has array of pool lb_algorithms', function() {
        expect(model.methods).toEqual(['LEAST_CONNECTIONS', 'ROUND_ROBIN', 'SOURCE_IP']);
      });

      it('has array of pool session persistence types', function() {
        expect(model.types).toEqual(['SOURCE_IP', 'HTTP_COOKIE', 'APP_COOKIE']);
      });

      it('has array of monitor types', function() {
        expect(model.monitorTypes).toEqual(['HTTP', 'HTTPS', 'PING', 'TCP', 'TLS-HELLO',
          'UDP-CONNECT', 'SCTP']);
      });

      it('has array of monitor http_methods', function() {
        expect(model.monitorMethods).toEqual(['GET', 'HEAD', 'POST', 'PUT', 'DELETE',
          'TRACE', 'OPTIONS', 'PATCH', 'CONNECT']);
      });

      it('has an "initialize" function', function() {
        expect(model.initialize).toBeDefined();
      });

      it('has a "submit" function', function() {
        expect(model.submit).toBeDefined();
      });

      it('has a "context" object', function() {
        expect(model.context).toBeDefined();
      });
    });

    describe('Post initialize model (create loadbalancer)', function() {

      beforeEach(function() {
        model.initialize('loadbalancer');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(2);
        expect(model.networks).toEqual(mockNetworks);
        expect(model.flavors).toEqual(mockFlavors);
        expect(model.availability_zones).toEqual(mockAvailabilityZones);
        expect(model.members.length).toBe(2);
        expect(model.certificates.length).toBe(3);
        expect(model.listenerPorts.length).toBe(0);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBeUndefined();
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.spec.members).toEqual([]);
        expect(model.spec.certificates).toEqual([]);
        expect(model.spec.monitor).toBeDefined();
        expect(model.certificatesError).toBe(false);
      });

      it('should initialize names', function() {
        expect(model.spec.loadbalancer.name).toBeNull();
        expect(model.spec.listener.name).toBeNull();
        expect(model.spec.pool.name).toBeNull();
      });

      it('should initialize context properties', function() {
        expect(model.context.resource).toBe('loadbalancer');
        expect(model.context.id).toBeUndefined();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (create listener)', function() {

      beforeEach(function() {
        model.initialize('listener', false, '1234');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(2);
        expect(model.members.length).toBe(2);
        expect(model.certificates.length).toBe(3);
        expect(model.listenerPorts.length).toBe(3);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBe('1234');
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.spec.members).toEqual([]);
        expect(model.spec.certificates).toEqual([]);
        expect(model.spec.monitor).toBeDefined();
        expect(model.certificatesError).toBe(false);
      });

      it('should initialize names', function() {
        expect(model.spec.listener.name).toBeNull();
        expect(model.spec.pool.name).toBeNull();
      });

      it('should initialize context properties', function() {
        expect(model.context.resource).toBe('listener');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (create l7 policy)', function() {

      beforeEach(function() {
        includeChildResources = false;
        model.initialize('l7policy', false, '1234', '5678');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(0);
        expect(model.members.length).toBe(0);
        expect(model.certificates.length).toBe(0);
        expect(model.listenerPorts.length).toBe(0);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBe('1234');
        expect(model.spec.parentResourceId).toBe('5678');
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.spec.members.length).toBe(0);
        expect(model.spec.certificates).toEqual([]);
        expect(model.spec.monitor).toBeDefined();
        expect(model.certificatesError).toBe(false);
      });

      it('should initialize names', function() {
        expect(model.spec.l7policy.name).toBeNull();
      });

      it('should initialize context properties', function() {
        expect(model.context.resource).toBe('l7policy');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (create l7 rule)', function() {

      beforeEach(function() {
        includeChildResources = false;
        model.initialize('l7rule', false, '1234', '5678');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(0);
        expect(model.members.length).toBe(0);
        expect(model.certificates.length).toBe(0);
        expect(model.listenerPorts.length).toBe(0);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBe('1234');
        expect(model.spec.parentResourceId).toBe('5678');
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.spec.members.length).toBe(0);
        expect(model.spec.certificates).toEqual([]);
        expect(model.spec.monitor).toBeDefined();
        expect(model.certificatesError).toBe(false);
      });

      it('should initialize invert', function() {
        expect(model.spec.l7rule.invert).toBe(false);
      });

      it('should initialize context properties', function() {
        expect(model.context.resource).toBe('l7rule');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (create pool with listener)', function() {

      beforeEach(function() {
        includeChildResources = false;
        model.initialize('pool', false, '1234', '5678');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(2);
        expect(model.members.length).toBe(2);
        expect(model.certificates.length).toBe(0);
        expect(model.listenerPorts.length).toBe(0);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBe('1234');
        expect(model.spec.parentResourceId).toBe('5678');
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.spec.members.length).toBe(0);
        expect(model.spec.certificates).toEqual([]);
        expect(model.spec.monitor).toBeDefined();
        expect(model.certificatesError).toBe(false);
      });

      it('should initialize names', function() {
        expect(model.spec.pool.name).toBeNull();
      });

      it('should initialize context properties', function() {
        expect(model.context.resource).toBe('pool');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (create pool without listener)', function() {

      beforeEach(function() {
        includeChildResources = false;
        model.initialize('pool', false, '1234');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(2);
        expect(model.members.length).toBe(2);
        expect(model.certificates.length).toBe(0);
        expect(model.listenerPorts.length).toBe(0);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBe('1234');
        expect(model.spec.parentResourceId).toBeUndefined();
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.spec.members.length).toBe(0);
        expect(model.spec.certificates).toEqual([]);
        expect(model.spec.monitor).toBeDefined();
        expect(model.certificatesError).toBe(false);
      });

      it('should initialize names', function() {
        expect(model.spec.pool.name).toBeNull();
      });

      it('should initialize context properties', function() {
        expect(model.context.resource).toBe('pool');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (create health monitor)', function() {

      beforeEach(function() {
        model.initialize('monitor', null, 'loadbalancer1', 'pool1');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(0);
        expect(model.members.length).toBe(0);
        expect(model.certificates.length).toBe(0);
        expect(model.listenerPorts.length).toBe(0);
        expect(model.spec.loadbalancer_id).toBe('loadbalancer1');
        expect(model.spec.parentResourceId).toBe('pool1');
        expect(model.spec.members.length).toBe(0);
        expect(model.spec.certificates).toEqual([]);
        expect(model.certificatesError).toBe(false);
      });

      it('should initialize context properties', function() {
        expect(model.context.resource).toBe('monitor');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit.name).toBe('createHealthMonitor');
      });
    });

    describe('Post initialize model (edit loadbalancer)', function() {

      beforeEach(function() {
        model.initialize('loadbalancer', '1234');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(2);
        expect(model.networks).toEqual(mockNetworks);
        expect(model.flavors).toEqual(mockFlavors);
        expect(model.availability_zones).toEqual(mockAvailabilityZones);
        expect(model.members.length).toBe(0);
        expect(model.certificates.length).toBe(0);
        expect(model.listenerPorts.length).toBe(0);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBeUndefined();
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.spec.members).toEqual([]);
        expect(model.spec.certificates).toEqual([]);
        expect(model.spec.monitor).toBeDefined();
        expect(model.certificatesError).toBe(false);
      });

      it('should initialize loadbalancer model spec properties', function() {
        expect(model.spec.loadbalancer.name).toEqual('Load Balancer 1');
        expect(model.spec.loadbalancer.description).toEqual('');
        expect(model.spec.loadbalancer.vip_address).toEqual('1.2.3.4');
        expect(model.spec.loadbalancer.vip_subnet_id).toEqual({
          id: 'subnet-1',
          name: 'subnet-1'
        });
      });

      it('should not initialize listener model spec properties', function() {
        expect(model.spec.listener.id).toBeNull();
        expect(model.spec.listener.name).toBeNull();
        expect(model.spec.listener.description).toBeNull();
        expect(model.spec.listener.protocol).toBeNull();
        expect(model.spec.listener.protocol_port).toBeNull();
        expect(model.spec.listener.connection_limit).toBe(-1);
      });

      it('should not initialize pool model spec properties', function() {
        expect(model.spec.pool.id).toBeNull();
        expect(model.spec.pool.name).toBeNull();
        expect(model.spec.pool.description).toBeNull();
        expect(model.spec.pool.protocol).toBeNull();
        expect(model.spec.pool.lb_algorithm).toBeNull();
        expect(model.spec.pool.session_persistence.type).toBeNull();
        expect(model.spec.pool.session_persistence.cookie_name).toBeNull();
      });

      it('should initialize monitor model spec properties', function() {
        expect(model.spec.monitor.type).toBeNull();
        expect(model.spec.monitor.delay).toBe(5);
        expect(model.spec.monitor.max_retries).toBe(3);
        expect(model.spec.monitor.max_retries_down).toBe(3);
        expect(model.spec.monitor.timeout).toBe(5);
        expect(model.spec.monitor.http_method).toBe('GET');
        expect(model.spec.monitor.expected_codes).toBe('200');
        expect(model.spec.monitor.url_path).toBe('/');
      });

      it('should not initialize any members in the model spec', function() {
        expect(model.spec.members).toEqual([]);
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('loadbalancer');
        expect(model.context.id).toBe('1234');
        expect(model.context.submit).toBeDefined();
      });

      it('should initialize listener protocols', function() {
        expect(model.listenerProtocols.length).toBe(6);
        expect(model.listenerProtocols.indexOf('TERMINATED_HTTPS')).toBe(2);
      });
    });

    describe('Post initialize model (edit health monitor)', function() {

      beforeEach(function() {
        model.initialize('monitor', 'healthmonitor1');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(0);
        expect(model.members.length).toBe(0);
        expect(model.certificates.length).toBe(0);
        expect(model.listenerPorts.length).toBe(0);
        expect(model.spec.loadbalancer_id).toBeUndefined();
        expect(model.spec.parentResourceId).toBeUndefined();
        expect(model.spec.members.length).toBe(0);
        expect(model.spec.certificates).toEqual([]);
        expect(model.certificatesError).toBe(false);
        expect(model.spec.monitor.id).toBe('1234');
        expect(model.spec.monitor.type).toBe('HTTP');
        expect(model.spec.monitor.delay).toBe(1);
        expect(model.spec.monitor.timeout).toBe(1);
        expect(model.spec.monitor.max_retries).toBe(1);
        expect(model.spec.monitor.max_retries_down).toBe(1);
        expect(model.spec.monitor.http_method).toBe('POST');
        expect(model.spec.monitor.expected_codes).toBe('200');
        expect(model.spec.monitor.url_path).toBe('/test');
      });

      it('should initialize context properties', function() {
        expect(model.context.resource).toBe('monitor');
        expect(model.context.id).toBe('healthmonitor1');
        expect(model.context.submit.name).toBe('editHealthMonitor');
      });
    });

    describe('Post initialize model (without barbican)', function() {

      beforeEach(function() {
        barbicanEnabled = false;
        model.initialize('loadbalancer');
        scope.$apply();
      });

      it('should initialize listener protocols', function() {
        expect(model.listenerProtocols.length).toBe(5);
        expect(model.listenerProtocols.indexOf('TERMINATED_HTTPS')).toBe(-1);
      });
    });

    describe('Post initialize model (certificates error)', function() {

      beforeEach(function() {
        certificatesError = true;
        model.initialize('loadbalancer');
        scope.$apply();
      });

      it('should initialize listener protocols', function() {
        expect(model.certificates).toEqual([]);
        expect(model.certificatesError).toBe(true);
      });
    });

    describe('Post initialize model (edit listener)', function() {

      beforeEach(function() {
        includeChildResources = true;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(2);
        expect(model.members.length).toEqual(2);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBeDefined();
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.subnets.length).toBe(2);
        expect(model.spec.monitor).toBeDefined();
      });

      it('should initialize the loadbalancer_id property', function() {
        expect(model.spec.loadbalancer_id).toBe('1234');
      });

      it('should initialize all loadbalancer properties to null', function() {
        expect(model.spec.loadbalancer.name).toBeNull();
        expect(model.spec.loadbalancer.description).toBeNull();
        expect(model.spec.loadbalancer.vip_address).toBeNull();
        expect(model.spec.loadbalancer.vip_subnet_id).toBeNull();
      });

      it('should initialize all listener properties', function() {
        expect(model.spec.listener.id).toBe('1234');
        expect(model.spec.listener.name).toBe('Listener 1');
        expect(model.spec.listener.description).toBe('listener description');
        expect(model.spec.listener.protocol).toBe('HTTP');
        expect(model.spec.listener.protocol_port).toBe(80);
        expect(model.spec.listener.connection_limit).toBe(999);
      });

      it('should initialize all pool properties', function() {
        expect(model.spec.pool.id).toBe('1234');
        expect(model.spec.pool.name).toBe('Pool 1');
        expect(model.spec.pool.description).toBe('pool description');
        expect(model.spec.pool.protocol).toBe('HTTP');
        expect(model.spec.pool.lb_algorithm).toBe('ROUND_ROBIN');
        expect(model.spec.pool.session_persistence.type).toBe('APP_COOKIE');
        expect(model.spec.pool.session_persistence.cookie_name).toBe('cookie_name');
      });

      it('should initialize all monitor properties', function() {
        expect(model.spec.monitor.id).toBe('1234');
        expect(model.spec.monitor.type).toBe('HTTP');
        expect(model.spec.monitor.delay).toBe(1);
        expect(model.spec.monitor.max_retries).toBe(1);
        expect(model.spec.monitor.max_retries_down).toBe(1);
        expect(model.spec.monitor.timeout).toBe(1);
        expect(model.spec.monitor.http_method).toBe('POST');
        expect(model.spec.monitor.expected_codes).toBe('200');
        expect(model.spec.monitor.url_path).toBe('/test');
      });

      it('should initialize members and properties', function() {
        expect(model.spec.members[0].id).toBe('1234');
        expect(model.spec.members[0].address).toBe('1.2.3.4');
        expect(model.spec.members[0].subnet_id).toEqual({
          id: 'subnet-1',
          name: 'subnet-1'
        });
        expect(model.spec.members[0].protocol_port).toBe(80);
        expect(model.spec.members[0].weight).toBe(1);
        expect(model.spec.members[1].id).toBe('5678');
        expect(model.spec.members[1].address).toBe('5.6.7.8');
        expect(model.spec.members[1].subnet_id).toEqual({
          id: 'subnet-1',
          name: 'subnet-1'
        });
        expect(model.spec.members[1].protocol_port).toBe(80);
        expect(model.spec.members[1].weight).toBe(1);
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('listener');
        expect(model.context.id).toBeDefined();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (edit listener) no pool children', function() {

      beforeEach(function() {
        includeChildResources = true;
        delete listenerResources.members;
        delete listenerResources.monitor;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(2);
        expect(model.members.length).toEqual(2);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBeDefined();
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.subnets.length).toBe(2);
        expect(model.spec.monitor).toBeDefined();
      });

      it('should initialize the loadbalancer_id property', function() {
        expect(model.spec.loadbalancer_id).toBe('1234');
      });

      it('should initialize all loadbalancer properties to null', function() {
        expect(model.spec.loadbalancer.name).toBeNull();
        expect(model.spec.loadbalancer.description).toBeNull();
        expect(model.spec.loadbalancer.vip_address).toBeNull();
        expect(model.spec.loadbalancer.vip_subnet_id).toBeNull();
      });

      it('should initialize all listener properties', function() {
        expect(model.spec.listener.id).toBe('1234');
        expect(model.spec.listener.name).toBe('Listener 1');
        expect(model.spec.listener.description).toBe('listener description');
        expect(model.spec.listener.protocol).toBe('HTTP');
        expect(model.spec.listener.protocol_port).toBe(80);
        expect(model.spec.listener.connection_limit).toBe(999);
      });

      it('should initialize all pool properties', function() {
        expect(model.spec.pool.id).toBe('1234');
        expect(model.spec.pool.name).toBe('Pool 1');
        expect(model.spec.pool.description).toBe('pool description');
        expect(model.spec.pool.protocol).toBe('HTTP');
        expect(model.spec.pool.lb_algorithm).toBe('ROUND_ROBIN');
        expect(model.spec.pool.session_persistence.type).toBe('APP_COOKIE');
        expect(model.spec.pool.session_persistence.cookie_name).toBe('cookie_name');
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('listener');
        expect(model.context.id).toBeDefined();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (edit l7 policy)', function() {

      beforeEach(function() {
        model.initialize('l7policy', '1234', 'loadbalancerId', 'listenerId');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBeDefined();
        expect(model.spec.l7policy.id).toBe('1234');
        expect(model.spec.l7policy.name).toBe('L7 Policy 1');
        expect(model.spec.l7policy.description).toBe('l7 policy description');
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('l7policy');
        expect(model.context.id).toBeDefined();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (edit l7 rule)', function() {

      beforeEach(function() {
        model.initialize('l7rule', '1234', 'loadbalancerId', 'l7policyId');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBeDefined();
        expect(model.spec.l7rule.id).toBe('1234');
        expect(model.spec.l7rule.type).toBe('HOST_NAME');
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('l7rule');
        expect(model.context.id).toBeDefined();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (edit pool)', function() {

      beforeEach(function() {
        includeChildResources = true;
        model.initialize('pool', '1234', 'loadbalancerId');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(2);
        expect(model.members.length).toEqual(2);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBeDefined();
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.subnets.length).toBe(2);
        expect(model.spec.monitor).toBeDefined();
      });

      it('should initialize the loadbalancer_id property', function() {
        expect(model.spec.loadbalancer_id).toBe('loadbalancerId');
      });

      it('should initialize all loadbalancer properties to null', function() {
        expect(model.spec.loadbalancer.name).toBeNull();
        expect(model.spec.loadbalancer.description).toBeNull();
        expect(model.spec.loadbalancer.vip_address).toBeNull();
        expect(model.spec.loadbalancer.vip_subnet_id).toBeNull();
      });

      it('should initialize all listener properties to null', function() {
        expect(model.spec.listener.id).toBeNull();
        expect(model.spec.listener.name).toBeNull();
        expect(model.spec.listener.description).toBeNull();
        expect(model.spec.listener.protocol).toBeNull();
        expect(model.spec.listener.protocol_port).toBeNull();
        expect(model.spec.listener.connection_limit).toBe(-1);
      });

      it('should initialize all pool properties', function() {
        expect(model.spec.pool.id).toBe('1234');
        expect(model.spec.pool.name).toBe('Pool 1');
        expect(model.spec.pool.description).toBe('pool description');
        expect(model.spec.pool.protocol).toBe('HTTP');
        expect(model.spec.pool.lb_algorithm).toBe('ROUND_ROBIN');
        expect(model.spec.pool.session_persistence.type).toBe('APP_COOKIE');
        expect(model.spec.pool.session_persistence.cookie_name).toBe('cookie_name');
      });

      it('should initialize all monitor properties', function() {
        expect(model.spec.monitor.id).toBe('1234');
        expect(model.spec.monitor.type).toBe('HTTP');
        expect(model.spec.monitor.delay).toBe(1);
        expect(model.spec.monitor.max_retries).toBe(1);
        expect(model.spec.monitor.max_retries_down).toBe(1);
        expect(model.spec.monitor.timeout).toBe(1);
        expect(model.spec.monitor.http_method).toBe('POST');
        expect(model.spec.monitor.expected_codes).toBe('200');
        expect(model.spec.monitor.url_path).toBe('/test');
      });

      it('should initialize members and properties', function() {
        expect(model.spec.members[0].id).toBe('1234');
        expect(model.spec.members[0].address).toBe('1.2.3.4');
        expect(model.spec.members[0].subnet_id).toEqual({
          id: 'subnet-1',
          name: 'subnet-1'
        });
        expect(model.spec.members[0].protocol_port).toBe(80);
        expect(model.spec.members[0].weight).toBe(1);
        expect(model.spec.members[1].id).toBe('5678');
        expect(model.spec.members[1].address).toBe('5.6.7.8');
        expect(model.spec.members[1].subnet_id).toEqual({
          id: 'subnet-1',
          name: 'subnet-1'
        });
        expect(model.spec.members[1].protocol_port).toBe(80);
        expect(model.spec.members[1].weight).toBe(1);
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('pool');
        expect(model.context.id).toBeDefined();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (update member list)', function() {

      beforeEach(function() {
        includeChildResources = false;
        model.initialize('members', false, 'loadbalancerId', 'poolId');
        scope.$apply();
      });

      it('should initialize model properties', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(true);
        expect(model.subnets.length).toBe(2);
        expect(model.members.length).toEqual(2);
        expect(model.spec).toBeDefined();
        expect(model.spec.loadbalancer_id).toBeDefined();
        expect(model.spec.loadbalancer).toBeDefined();
        expect(model.spec.listener).toBeDefined();
        expect(model.spec.pool).toBeDefined();
        expect(model.subnets.length).toBe(2);
        expect(model.spec.monitor).toBeDefined();
      });

      it('should initialize the loadbalancer_id property', function() {
        expect(model.spec.loadbalancer_id).toBe('loadbalancerId');
      });

      it('should initialize all loadbalancer properties to null', function() {
        expect(model.spec.loadbalancer.name).toBeNull();
        expect(model.spec.loadbalancer.description).toBeNull();
        expect(model.spec.loadbalancer.vip_address).toBeNull();
        expect(model.spec.loadbalancer.vip_subnet_id).toBeNull();
      });

      it('should initialize all listener properties to null', function() {
        expect(model.spec.listener.id).toBeNull();
        expect(model.spec.listener.name).toBeNull();
        expect(model.spec.listener.description).toBeNull();
        expect(model.spec.listener.protocol).toBeNull();
        expect(model.spec.listener.protocol_port).toBeNull();
        expect(model.spec.listener.connection_limit).toBe(-1);
      });

      it('should initialize all pool properties', function() {
        expect(model.spec.pool.id).toBe('1234');
        expect(model.spec.pool.name).toBe('Pool 1');
        expect(model.spec.pool.description).toBe('pool description');
        expect(model.spec.pool.protocol).toBe('HTTP');
        expect(model.spec.pool.lb_algorithm).toBe('ROUND_ROBIN');
        expect(model.spec.pool.session_persistence.type).toBe('APP_COOKIE');
        expect(model.spec.pool.session_persistence.cookie_name).toBe('cookie_name');
      });

      it('should initialize all monitor properties to null', function() {
        expect(model.spec.monitor.id).toBeNull();
        expect(model.spec.monitor.type).toBeNull();
        expect(model.spec.monitor.delay).toBe(5);
        expect(model.spec.monitor.max_retries).toBe(3);
        expect(model.spec.monitor.max_retries_down).toBe(3);
        expect(model.spec.monitor.timeout).toBe(5);
        expect(model.spec.monitor.http_method).toBe('GET');
        expect(model.spec.monitor.expected_codes).toBe('200');
        expect(model.spec.monitor.url_path).toBe('/');
      });

      it('should initialize members and properties', function() {
        expect(model.spec.members[0].id).toBe('1234');
        expect(model.spec.members[0].address).toBe('1.2.3.4');
        expect(model.spec.members[0].subnet_id).toEqual({
          id: 'subnet-1',
          name: 'subnet-1'
        });
        expect(model.spec.members[0].protocol_port).toBe(80);
        expect(model.spec.members[0].weight).toBe(1);
        expect(model.spec.members[1].id).toBe('5678');
        expect(model.spec.members[1].address).toBe('5.6.7.8');
        expect(model.spec.members[1].subnet_id).toEqual({
          id: 'subnet-1',
          name: 'subnet-1'
        });
        expect(model.spec.members[1].protocol_port).toBe(80);
        expect(model.spec.members[1].weight).toBe(1);
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('members');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit).toBeDefined();
      });
    });

    describe('Post initialize model (edit listener TERMINATED_HTTPS)', function() {

      beforeEach(function() {
        includeChildResources = true;
        listenerResources.listener.protocol = 'TERMINATED_HTTPS';
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should initialize certificates', function() {
        expect(model.certificates.length).toBe(3);
        expect(model.spec.certificates.length).toBe(1);
        expect(model.spec.certificates[0].id).toBe('container2');
      });
    });

    describe('Post initialize model (edit listener TERMINATED_HTTPS no barbican)', function() {

      beforeEach(function() {
        listenerResources.listener.protocol = 'TERMINATED_HTTPS';
        barbicanEnabled = false;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should initialize certificates', function() {
        expect(model.certificates.length).toBe(0);
        expect(model.spec.certificates.length).toBe(0);
        expect(model.spec.listener.protocol).toBe('TERMINATED_HTTPS');
      });
    });

    describe('Post initialize model - Initializing', function() {

      beforeEach(function() {
        model.initializing = true;
        model.initialize('loadbalancer');
        scope.$apply();
      });

      // This is here to ensure that as people add/change spec properties, they don't forget
      // to implement tests for them.
      it('has the right number of properties', function() {
        expect(Object.keys(model.spec).length).toBe(11);
        expect(Object.keys(model.spec.loadbalancer).length).toBe(7);
        expect(Object.keys(model.spec.listener).length).toBe(16);
        expect(Object.keys(model.spec.l7policy).length).toBe(8);
        expect(Object.keys(model.spec.l7rule).length).toBe(7);
        expect(Object.keys(model.spec.pool).length).toBe(9);
        expect(Object.keys(model.spec.monitor).length).toBe(11);
        expect(model.spec.members).toEqual([]);
      });

      it('sets load balancer ID to undefined', function() {
        expect(model.spec.loadbalancer_id).toBeUndefined();
      });

      it('sets parent resource ID to undefined', function() {
        expect(model.spec.parentResourceId).toBeUndefined();
      });

      it('sets load balancer name to null', function() {
        expect(model.spec.loadbalancer.name).toBeNull();
      });

      it('sets load balancer description to null', function() {
        expect(model.spec.loadbalancer.description).toBeNull();
      });

      it('sets load balancer ip address to null', function() {
        expect(model.spec.loadbalancer.vip_address).toBeNull();
      });

      it('sets load balancer subnet to null', function() {
        expect(model.spec.loadbalancer.vip_subnet_id).toBeNull();
      });

      it('sets listener id to null', function() {
        expect(model.spec.listener.id).toBeNull();
      });

      it('sets listener name to reasonable default', function() {
        expect(model.spec.listener.name).toBeNull();
      });

      it('sets listener description to null', function() {
        expect(model.spec.listener.description).toBeNull();
      });

      it('sets listener protocol to null', function() {
        expect(model.spec.listener.protocol).toBeNull();
      });

      it('sets listener protocol_port to null', function() {
        expect(model.spec.listener.protocol_port).toBeNull();
      });

      it('sets listener connection limit to reasonable default', function() {
        expect(model.spec.listener.connection_limit).toBe(-1);
      });

      it('sets pool id to null', function() {
        expect(model.spec.pool.id).toBeNull();
      });

      it('sets pool name to reasonable default', function() {
        expect(model.spec.pool.name).toBeNull();
      });

      it('sets pool description to null', function() {
        expect(model.spec.pool.description).toBeNull();
      });

      it('sets pool protocol to null', function() {
        expect(model.spec.pool.protocol).toBeNull();
      });

      it('sets pool lb_algorithm to null', function() {
        expect(model.spec.pool.lb_algorithm).toBeNull();
      });

      it('sets monitor id to null', function() {
        expect(model.spec.monitor.id).toBeNull();
      });

      it('sets monitor type to null', function() {
        expect(model.spec.monitor.type).toBeNull();
      });

      it('sets monitor delay to 5', function() {
        expect(model.spec.monitor.delay).toBe(5);
      });

      it('sets monitor max_retries count to 3', function() {
        expect(model.spec.monitor.max_retries).toBe(3);
      });

      it('sets monitor max_retries down count to 3', function() {
        expect(model.spec.monitor.max_retries_down).toBe(3);
      });

      it('sets monitor timeout to 5', function() {
        expect(model.spec.monitor.timeout).toBe(5);
      });

      it('sets monitor http_method to default', function() {
        expect(model.spec.monitor.http_method).toBe('GET');
      });

      it('sets monitor expected_codes code to default', function() {
        expect(model.spec.monitor.expected_codes).toBe('200');
      });

      it('sets monitor URL path to default', function() {
        expect(model.spec.monitor.url_path).toBe('/');
      });
    });

    describe('Initialization failure', function() {

      beforeEach(inject(function($injector) {
        var neutronAPI = $injector.get('horizon.app.core.openstack-service-api.neutron');
        neutronAPI.getSubnets = function() {
          var deferred = $q.defer();
          deferred.reject('Error');
          return deferred.promise;
        };
      }));

      beforeEach(function() {
        model.initialize('loadbalancer');
        scope.$apply();
      });

      it('should fail to be initialized on subnets error', function() {
        expect(model.initializing).toBe(false);
        expect(model.initialized).toBe(false);
        expect(model.spec.loadbalancer.name).toBeNull();
        expect(model.subnets).toEqual([]);
      });
    });

    describe('context (create loadbalancer)', function() {

      beforeEach(function() {
        model.initialize('loadbalancer');
        scope.$apply();
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('loadbalancer');
        expect(model.context.id).toBeUndefined();
        expect(model.context.submit.name).toBe('createLoadBalancer');
      });
    });

    describe('context (edit loadbalancer)', function() {

      beforeEach(function() {
        model.initialize('loadbalancer', '1');
        scope.$apply();
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('loadbalancer');
        expect(model.context.id).toBe('1');
        expect(model.context.submit.name).toBe('editLoadBalancer');
      });
    });

    describe('context (create listener)', function() {

      beforeEach(function() {
        model.initialize('listener', false, '1234');
        scope.$apply();
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('listener');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit.name).toBe('createListener');
      });
    });

    describe('context (edit listener)', function() {

      beforeEach(function() {
        includeChildResources = true;
        model.initialize('listener', '1');
        scope.$apply();
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('listener');
        expect(model.context.id).toBe('1');
        expect(model.context.submit.name).toBe('editListener');
      });
    });

    describe('context (create pool)', function() {

      beforeEach(function() {
        model.initialize('pool', false, '1234', '5678');
        scope.$apply();
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('pool');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit.name).toBe('createPool');
      });
    });

    describe('context (edit pool)', function() {

      beforeEach(function() {
        includeChildResources = true;
        model.initialize('pool', 'poolId', 'loadbalancerId');
        scope.$apply();
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('pool');
        expect(model.context.id).toBe('poolId');
        expect(model.context.submit.name).toBe('editPool');
      });
    });

    describe('context (update member list)', function() {

      beforeEach(function() {
        model.initialize('members', false, 'loadbalancerId', 'poolId');
        scope.$apply();
      });

      it('should initialize context', function() {
        expect(model.context.resource).toBe('members');
        expect(model.context.id).toBeFalsy();
        expect(model.context.submit.name).toBe('updatePoolMemberList');
      });
    });

    describe('Model submit function (create loadbalancer)', function() {

      beforeEach(function() {
        model.initialize('loadbalancer');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.loadbalancer.flavor_id = model.flavors[Object.keys(model.flavors)[0]];
        model.spec.loadbalancer.availability_zone = model.availability_zones[
          Object.keys(model.availability_zones)[0]];
        model.spec.listener.protocol = 'TCP';
        model.spec.listener.protocol_port = 80;
        model.spec.listener.connection_limit = 999;
        model.spec.pool.name = 'pool name';
        model.spec.pool.description = 'pool description';
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.pool.session_persistence.type = 'SOURCE_IP';
        model.spec.members = [{
          address: {ip: '1.2.3.4', subnet: '1'},
          addresses: [{ip: '1.2.3.4', subnet: '1'},
            {ip: '2.3.4.5', subnet: '2'}],
          id: '1',
          name: 'foo',
          protocol_port: 80,
          weight: 1
        }, {
          id: 'external-member-0',
          address: '2.3.4.5',
          subnet_id: null,
          protocol_port: 80,
          weight: 1
        }, {
          id: 'external-member-1',
          address: null,
          subnet_id: null,
          protocol_port: 80,
          weight: 1
        }, {
          id: 'external-member-2',
          address: '3.4.5.6',
          subnet_id: {id: '1'},
          protocol_port: 80,
          weight: 1
        }];
        model.spec.monitor.type = 'PING';
        model.spec.monitor.delay = 1;
        model.spec.monitor.max_retries = 1;
        model.spec.monitor.max_retries_down = 1;
        model.spec.monitor.timeout = 1;
        model.spec.certificates = [{
          id: 'container1',
          name: 'foo',
          expiration: '2015-03-26T21:10:45.417835'
        }];

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer.name).toBeUndefined();
        expect(finalSpec.loadbalancer.description).toBeUndefined();
        expect(finalSpec.loadbalancer.vip_address).toBe('1.2.3.4');
        expect(finalSpec.loadbalancer.vip_subnet_id).toBe(model.subnets[0].id);
        expect(finalSpec.loadbalancer.admin_state_up).toBe(true);
        expect(finalSpec.loadbalancer.availability_zone).toBe('az_1');

        expect(finalSpec.listener.name).toBeUndefined();
        expect(finalSpec.listener.description).toBeUndefined();
        expect(finalSpec.listener.protocol).toBe('TCP');
        expect(finalSpec.listener.protocol_port).toBe(80);
        expect(finalSpec.listener.connection_limit).toBe(999);
        expect(finalSpec.listener.admin_state_up).toBe(true);

        expect(finalSpec.pool.name).toBe('pool name');
        expect(finalSpec.pool.description).toBe('pool description');
        expect(finalSpec.pool.protocol).toBe('TCP');
        expect(finalSpec.pool.lb_algorithm).toBe('LEAST_CONNECTIONS');
        expect(finalSpec.pool.session_persistence.type).toBe('SOURCE_IP');
        expect(finalSpec.pool.admin_state_up).toBe(true);

        expect(finalSpec.members.length).toBe(3);
        expect(finalSpec.members[0].address).toBe('1.2.3.4');
        expect(finalSpec.members[0].subnet_id).toBe('1');
        expect(finalSpec.members[0].protocol_port).toBe(80);
        expect(finalSpec.members[0].weight).toBe(1);
        expect(finalSpec.members[0].id).toBe('1');
        expect(finalSpec.members[0].addresses).toBeUndefined();
        expect(finalSpec.members[0].name).toBe('foo');
        expect(finalSpec.members[0].allocatedMember).toBeUndefined();
        expect(finalSpec.members[1].id).toBe('external-member-0');
        expect(finalSpec.members[1].address).toBe('2.3.4.5');
        expect(finalSpec.members[1].subnet_id).toBeUndefined();
        expect(finalSpec.members[1].protocol_port).toBe(80);
        expect(finalSpec.members[1].weight).toBe(1);
        expect(finalSpec.members[1].allocatedMember).toBeUndefined();
        expect(finalSpec.members[2].id).toBe('external-member-2');
        expect(finalSpec.members[2].address).toBe('3.4.5.6');
        expect(finalSpec.members[2].subnet_id).toBe('1');
        expect(finalSpec.members[2].protocol_port).toBe(80);
        expect(finalSpec.members[2].weight).toBe(1);
        expect(finalSpec.members[2].allocatedMember).toBeUndefined();

        expect(finalSpec.monitor.type).toBe('PING');
        expect(finalSpec.monitor.delay).toBe(1);
        expect(finalSpec.monitor.max_retries).toBe(1);
        expect(finalSpec.monitor.max_retries_down).toBe(1);
        expect(finalSpec.monitor.timeout).toBe(1);
        expect(finalSpec.certificates).toBeUndefined();
        expect(finalSpec.monitor.admin_state_up).toBe(true);
      });

      it('should set final spec certificates', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.loadbalancer.flavor_id = model.flavors[Object.keys(model.flavors)[0]];
        model.spec.loadbalancer.availability_zone = model.availability_zones[
          Object.keys(model.availability_zones)[0]];
        model.spec.listener.protocol = 'TERMINATED_HTTPS';
        model.spec.listener.protocol_port = 443;
        model.spec.listener.connection_limit = 9999;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.certificates = [{
          id: 'container1',
          name: 'foo',
          expiration: '2015-03-26T21:10:45.417835'
        }];

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer.name).toBeUndefined();
        expect(finalSpec.loadbalancer.description).toBeUndefined();
        expect(finalSpec.loadbalancer.vip_address).toBe('1.2.3.4');
        expect(finalSpec.loadbalancer.vip_subnet_id).toBe(model.subnets[0].id);
        expect(finalSpec.listener.name).toBeUndefined();
        expect(finalSpec.listener.description).toBeUndefined();
        expect(finalSpec.listener.protocol).toBe('TERMINATED_HTTPS');
        expect(finalSpec.listener.protocol_port).toBe(443);
        expect(finalSpec.listener.connection_limit).toBe(9999);
        expect(finalSpec.pool.protocol).toBe('HTTP');
        expect(finalSpec.certificates).toEqual(['container1']);
      });

      it('should delete load balancer if any required property is not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeUndefined();
      });

      it('should delete listener if any required property is not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeUndefined();
        expect(finalSpec.pool).toBeUndefined();
      });

      it('should delete certificates if not using TERMINATED_HTTPS', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.certificates = [{id: '1'}];

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.certificates).toBeUndefined();
      });

      it('should delete pool if any required property is not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeUndefined();
      });

      it('should delete members if none selected', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeDefined();
        expect(finalSpec.members).toBeUndefined();
      });

      it('should delete members if no members are valid', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.members = [{
          id: 'foo',
          address: '2.3.4.5',
          weight: 1
        }];

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeDefined();
        expect(finalSpec.members).toBeUndefined();
      });

      it('should delete monitor if any required property not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.monitor.type = 'PING';
        model.spec.monitor.delay = 1;
        model.spec.monitor.max_retries = 1;
        model.spec.monitor.max_retries_down = 1;
        model.spec.monitor.timeout = null;

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeDefined();
        expect(finalSpec.members).toBeUndefined();
        expect(finalSpec.monitor).toBeUndefined();
      });
    });

    describe('Model submit function (edit loadbalancer)', function() {

      beforeEach(function() {
        model.initialize('loadbalancer', '1234');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        model.spec.loadbalancer.description = 'new description';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer.name).toBe('Load Balancer 1');
        expect(finalSpec.loadbalancer.description).toBe('new description');
        expect(finalSpec.loadbalancer.vip_address).toBe('1.2.3.4');
        expect(finalSpec.loadbalancer.vip_subnet_id).toBe('subnet-1');
      });
    });

    describe('Model submit function (create listener)', function() {

      beforeEach(function() {
        model.initialize('listener', false, '1234');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        model.spec.listener.protocol = 'TCP';
        model.spec.listener.protocol_port = 80;
        model.spec.listener.connection_limit = 999;
        model.spec.pool.name = 'pool name';
        model.spec.pool.description = 'pool description';
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.members = [{
          address: {ip: '1.2.3.4', subnet: '1'},
          addresses: [{ip: '1.2.3.4', subnet: '1'},
            {ip: '2.3.4.5', subnet: '2'}],
          id: '1',
          name: 'foo',
          protocol_port: 80,
          weight: 1
        }, {
          id: 'external-member-0',
          address: '2.3.4.5',
          subnet_id: null,
          protocol_port: 80,
          weight: 1
        }, {
          id: 'external-member-1',
          address: null,
          subnet_id: null,
          protocol_port: 80,
          weight: 1
        }, {
          id: 'external-member-2',
          address: '3.4.5.6',
          subnet_id: {id: '1'},
          protocol_port: 80,
          weight: 1
        }];
        model.spec.monitor.type = 'PING';
        model.spec.monitor.delay = 1;
        model.spec.monitor.max_retries = 1;
        model.spec.monitor.max_retries_down = 1;
        model.spec.monitor.timeout = 1;
        model.spec.certificates = [{
          id: 'container1',
          name: 'foo',
          expiration: '2015-03-26T21:10:45.417835'
        }];

        var finalSpec = model.submit();

        expect(finalSpec.listener.name).toBeUndefined();
        expect(finalSpec.listener.description).toBeUndefined();
        expect(finalSpec.listener.protocol).toBe('TCP');
        expect(finalSpec.listener.protocol_port).toBe(80);
        expect(finalSpec.listener.connection_limit).toBe(999);

        expect(finalSpec.pool.name).toBe('pool name');
        expect(finalSpec.pool.description).toBe('pool description');
        expect(finalSpec.pool.protocol).toBe('TCP');
        expect(finalSpec.pool.lb_algorithm).toBe('LEAST_CONNECTIONS');

        expect(finalSpec.members.length).toBe(3);
        expect(finalSpec.members[0].address).toBe('1.2.3.4');
        expect(finalSpec.members[0].subnet_id).toBe('1');
        expect(finalSpec.members[0].protocol_port).toBe(80);
        expect(finalSpec.members[0].weight).toBe(1);
        expect(finalSpec.members[0].id).toBe('1');
        expect(finalSpec.members[0].addresses).toBeUndefined();
        expect(finalSpec.members[0].name).toBe('foo');
        expect(finalSpec.members[0].allocatedMember).toBeUndefined();
        expect(finalSpec.members[1].id).toBe('external-member-0');
        expect(finalSpec.members[1].address).toBe('2.3.4.5');
        expect(finalSpec.members[1].subnet_id).toBeUndefined();
        expect(finalSpec.members[1].protocol_port).toBe(80);
        expect(finalSpec.members[1].weight).toBe(1);
        expect(finalSpec.members[1].allocatedMember).toBeUndefined();
        expect(finalSpec.members[2].id).toBe('external-member-2');
        expect(finalSpec.members[2].address).toBe('3.4.5.6');
        expect(finalSpec.members[2].subnet_id).toBe('1');
        expect(finalSpec.members[2].protocol_port).toBe(80);
        expect(finalSpec.members[2].weight).toBe(1);
        expect(finalSpec.members[2].allocatedMember).toBeUndefined();

        expect(finalSpec.monitor.type).toBe('PING');
        expect(finalSpec.monitor.delay).toBe(1);
        expect(finalSpec.monitor.max_retries).toBe(1);
        expect(finalSpec.monitor.max_retries_down).toBe(1);
        expect(finalSpec.monitor.timeout).toBe(1);
        expect(finalSpec.certificates).toBeUndefined();
      });

      it('should set final spec certificates', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'TERMINATED_HTTPS';
        model.spec.listener.protocol_port = 443;
        model.spec.listener.connection_limit = 999;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.certificates = [{
          id: 'container1',
          name: 'foo',
          expiration: '2015-03-26T21:10:45.417835'
        }];

        var finalSpec = model.submit();

        expect(finalSpec.listener.name).toBeUndefined();
        expect(finalSpec.listener.description).toBeUndefined();
        expect(finalSpec.listener.protocol).toBe('TERMINATED_HTTPS');
        expect(finalSpec.listener.protocol_port).toBe(443);
        expect(finalSpec.listener.connection_limit).toBe(999);
        expect(finalSpec.pool.protocol).toBe('HTTP');
        expect(finalSpec.certificates).toEqual(['container1']);
      });

      it('should delete listener if any required property is not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeUndefined();
        expect(finalSpec.pool).toBeUndefined();
      });

      it('should delete certificates if not using TERMINATED_HTTPS', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.certificates = [{id: '1'}];

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.certificates).toBeUndefined();
      });

      it('should delete pool if any required property is not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeUndefined();
      });

      it('should delete members if none selected', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeDefined();
        expect(finalSpec.members).toBeUndefined();
      });

      it('should delete members if no members are valid', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.members = [{
          id: 'foo',
          address: '2.3.4.5',
          weight: 1
        }];

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeDefined();
        expect(finalSpec.members).toBeUndefined();
      });

      it('should delete monitor if any required property not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.monitor.type = 'PING';
        model.spec.monitor.delay = 1;
        model.spec.monitor.max_retries = 1;
        model.spec.monitor.max_retries_down = 1;
        model.spec.monitor.timeout = null;

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeDefined();
        expect(finalSpec.members).toBeUndefined();
        expect(finalSpec.monitor).toBeUndefined();
      });
    });

    describe('Model submit function (create l7 policy)', function() {

      beforeEach(function() {
        model.initialize('l7policy', null, '1234', 'listener1');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        model.spec.l7policy.action = 'REJECT';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer_id).toBe('1234');
        expect(finalSpec.parentResourceId).toBe('listener1');
        expect(finalSpec.loadbalancer).toBeUndefined();
        expect(finalSpec.listener).toBeDefined();

        expect(finalSpec.l7policy.action).toBe('REJECT');
      });
    });

    describe('Model submit function (create l7 rule)', function() {

      beforeEach(function() {
        model.initialize('l7rule', null, '1234', 'l7policy1');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        model.spec.l7rule.type = 'PATH';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer_id).toBe('1234');
        expect(finalSpec.parentResourceId).toBe('l7policy1');
        expect(finalSpec.loadbalancer).toBeUndefined();

        expect(finalSpec.l7rule.type).toBe('PATH');
      });
    });

    describe('Model submit function (create pool)', function() {

      beforeEach(function() {
        includeChildResources = false;
        model.initialize('pool', false, '1234', '5678');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        model.spec.listener.protocol = 'TCP';
        model.spec.pool.name = 'pool name';
        model.spec.pool.description = 'pool description';
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.members = [{
          address: {ip: '1.2.3.4', subnet: '1'},
          addresses: [{ip: '1.2.3.4', subnet: '1'},
            {ip: '2.3.4.5', subnet: '2'}],
          id: '1',
          name: 'foo',
          protocol_port: 80,
          weight: 1
        }, {
          id: 'external-member-0',
          address: '2.3.4.5',
          subnet_id: null,
          protocol_port: 80,
          weight: 1
        }, {
          id: 'external-member-1',
          address: null,
          subnet_id: null,
          protocol_port: 80,
          weight: 1
        }, {
          id: 'external-member-2',
          address: '3.4.5.6',
          subnet_id: {id: '1'},
          protocol_port: 80,
          weight: 1
        }];
        model.spec.monitor.type = 'PING';
        model.spec.monitor.delay = 1;
        model.spec.monitor.max_retries = 1;
        model.spec.monitor.max_retries_down = 1;
        model.spec.monitor.timeout = 1;
        model.spec.certificates = [{
          id: 'container1',
          name: 'foo',
          expiration: '2015-03-26T21:10:45.417835'
        }];

        var finalSpec = model.submit();

        expect(finalSpec.pool.name).toBe('pool name');
        expect(finalSpec.pool.description).toBe('pool description');
        expect(finalSpec.pool.protocol).toBe('TCP');
        expect(finalSpec.pool.lb_algorithm).toBe('LEAST_CONNECTIONS');

        expect(finalSpec.members.length).toBe(3);
        expect(finalSpec.members[0].address).toBe('1.2.3.4');
        expect(finalSpec.members[0].subnet_id).toBe('1');
        expect(finalSpec.members[0].protocol_port).toBe(80);
        expect(finalSpec.members[0].weight).toBe(1);
        expect(finalSpec.members[0].id).toBe('1');
        expect(finalSpec.members[0].addresses).toBeUndefined();
        expect(finalSpec.members[0].name).toBe('foo');
        expect(finalSpec.members[0].allocatedMember).toBeUndefined();
        expect(finalSpec.members[1].id).toBe('external-member-0');
        expect(finalSpec.members[1].address).toBe('2.3.4.5');
        expect(finalSpec.members[1].subnet_id).toBeUndefined();
        expect(finalSpec.members[1].protocol_port).toBe(80);
        expect(finalSpec.members[1].weight).toBe(1);
        expect(finalSpec.members[1].allocatedMember).toBeUndefined();
        expect(finalSpec.members[2].id).toBe('external-member-2');
        expect(finalSpec.members[2].address).toBe('3.4.5.6');
        expect(finalSpec.members[2].subnet_id).toBe('1');
        expect(finalSpec.members[2].protocol_port).toBe(80);
        expect(finalSpec.members[2].weight).toBe(1);
        expect(finalSpec.members[2].allocatedMember).toBeUndefined();

        expect(finalSpec.monitor.type).toBe('PING');
        expect(finalSpec.monitor.delay).toBe(1);
        expect(finalSpec.monitor.max_retries).toBe(1);
        expect(finalSpec.monitor.max_retries_down).toBe(1);
        expect(finalSpec.monitor.timeout).toBe(1);
        expect(finalSpec.certificates).toBeUndefined();
      });

      it('should delete listener if any required property is not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = '';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeUndefined();
        expect(finalSpec.pool).toBeUndefined();
      });

      it('should delete certificates if not using TERMINATED_HTTPS', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.certificates = [{id: '1'}];

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.certificates).toBeUndefined();
      });

      it('should delete pool if any required property is not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeUndefined();
      });

      it('should delete members if none selected', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeDefined();
        expect(finalSpec.members).toBeUndefined();
      });

      it('should delete members if no members are valid', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.members = [{
          id: 'foo',
          address: '2.3.4.5',
          weight: 1
        }];

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeDefined();
        expect(finalSpec.members).toBeUndefined();
      });

      it('should delete monitor if any required property not set', function() {
        model.spec.loadbalancer.vip_address = '1.2.3.4';
        model.spec.loadbalancer.vip_subnet_id = model.subnets[0];
        model.spec.listener.protocol = 'HTTP';
        model.spec.listener.protocol_port = 80;
        model.spec.pool.lb_algorithm = 'LEAST_CONNECTIONS';
        model.spec.monitor.type = 'PING';
        model.spec.monitor.delay = 1;
        model.spec.monitor.max_retries = 1;
        model.spec.monitor.max_retries_down = 1;
        model.spec.monitor.timeout = null;

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeDefined();
        expect(finalSpec.listener).toBeDefined();
        expect(finalSpec.pool).toBeDefined();
        expect(finalSpec.members).toBeUndefined();
        expect(finalSpec.monitor).toBeUndefined();
      });
    });

    describe('Model submit function (create health monitor)', function() {

      beforeEach(function() {
        model.initialize('monitor', null, 'loadbalancer1', 'pool1');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        model.spec.monitor.type = 'HTTP';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer_id).toBe('loadbalancer1');
        expect(finalSpec.parentResourceId).toBe('pool1');
        expect(finalSpec.loadbalancer).toBeUndefined();
        expect(finalSpec.listener).toBeUndefined();
        expect(finalSpec.pool).toBeUndefined();
        expect(finalSpec.members).toBeUndefined();
        expect(finalSpec.certificates).toBeUndefined();

        expect(finalSpec.monitor.type).toBe('HTTP');
        expect(finalSpec.monitor.delay).toBe(5);
        expect(finalSpec.monitor.max_retries).toBe(3);
        expect(finalSpec.monitor.max_retries_down).toBe(3);
        expect(finalSpec.monitor.timeout).toBe(5);
        expect(finalSpec.monitor.http_method).toBe('GET');
        expect(finalSpec.monitor.expected_codes).toBe('200');
        expect(finalSpec.monitor.url_path).toBe('/');
      });
    });

    describe('Model submit function (edit listener)', function() {

      beforeEach(function() {
        includeChildResources = true;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeUndefined();

        expect(finalSpec.listener.name).toBe('Listener 1');
        expect(finalSpec.listener.description).toBe('listener description');
        expect(finalSpec.listener.protocol).toBe('HTTP');
        expect(finalSpec.listener.protocol_port).toBe(80);

        expect(finalSpec.pool.name).toBe('Pool 1');
        expect(finalSpec.pool.description).toBe('pool description');
        expect(finalSpec.pool.protocol).toBe('HTTP');
        expect(finalSpec.pool.lb_algorithm).toBe('ROUND_ROBIN');
        expect(finalSpec.pool.session_persistence.type).toBe('APP_COOKIE');
        expect(finalSpec.pool.session_persistence.cookie_name).toBe('cookie_name');

        expect(finalSpec.members.length).toBe(2);
        expect(finalSpec.members[0].id).toBe('1234');
        expect(finalSpec.members[0].address).toBe('1.2.3.4');
        expect(finalSpec.members[0].subnet_id).toBe('subnet-1');
        expect(finalSpec.members[0].protocol_port).toBe(80);
        expect(finalSpec.members[0].weight).toBe(1);
        expect(finalSpec.members[1].id).toBe('5678');
        expect(finalSpec.members[1].address).toBe('5.6.7.8');
        expect(finalSpec.members[1].subnet_id).toBe('subnet-1');
        expect(finalSpec.members[1].protocol_port).toBe(80);
        expect(finalSpec.members[1].weight).toBe(1);

        expect(finalSpec.monitor.type).toBe('HTTP');
        expect(finalSpec.monitor.delay).toBe(1);
        expect(finalSpec.monitor.max_retries).toBe(1);
        expect(finalSpec.monitor.max_retries_down).toBe(1);
        expect(finalSpec.monitor.timeout).toBe(1);
      });
    });

    describe('Model submit function (edit l7 policy)', function() {

      beforeEach(function() {
        model.initialize('l7policy', 'l7policy1', '1234', '1234');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer_id).toBe('1234');
        expect(finalSpec.parentResourceId).toBe('1234');
        expect(finalSpec.loadbalancer).toBeUndefined();
        expect(finalSpec.listener).toBeDefined();

        expect(finalSpec.l7policy.action).toBe('REDIRECT_TO_URL');
      });

    });

    describe('Model submit function (edit l7 rule)', function() {

      beforeEach(function() {
        model.initialize('l7rule', '1234', '1234', '1234');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer_id).toBe('1234');
        expect(finalSpec.parentResourceId).toBe('1234');
        expect(finalSpec.loadbalancer).toBeUndefined();

        expect(finalSpec.l7rule.type).toBe('HOST_NAME');
      });

    });

    describe('Model submit function (edit pool)', function() {

      beforeEach(function() {
        includeChildResources = true;
        model.initialize('pool', 'poolId', 'loadbalancerId');
        scope.$apply();
      });

      it('should set final spec properties', function() {

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeUndefined();
        expect(finalSpec.listener).toBeUndefined();

        expect(finalSpec.pool.name).toBe('Pool 1');
        expect(finalSpec.pool.description).toBe('pool description');
        expect(finalSpec.pool.protocol).toBe('HTTP');
        expect(finalSpec.pool.lb_algorithm).toBe('ROUND_ROBIN');
        expect(finalSpec.pool.session_persistence.type).toBe('APP_COOKIE');
        expect(finalSpec.pool.session_persistence.cookie_name).toBe('cookie_name');
        expect(finalSpec.pool.tls_ciphers).toBeUndefined();

        expect(finalSpec.members.length).toBe(2);
        expect(finalSpec.members[0].id).toBe('1234');
        expect(finalSpec.members[0].address).toBe('1.2.3.4');
        expect(finalSpec.members[0].subnet_id).toBe('subnet-1');
        expect(finalSpec.members[0].protocol_port).toBe(80);
        expect(finalSpec.members[0].weight).toBe(1);
        expect(finalSpec.members[1].id).toBe('5678');
        expect(finalSpec.members[1].address).toBe('5.6.7.8');
        expect(finalSpec.members[1].subnet_id).toBe('subnet-1');
        expect(finalSpec.members[1].protocol_port).toBe(80);
        expect(finalSpec.members[1].weight).toBe(1);

        expect(finalSpec.monitor.type).toBe('HTTP');
        expect(finalSpec.monitor.delay).toBe(1);
        expect(finalSpec.monitor.max_retries).toBe(1);
        expect(finalSpec.monitor.max_retries_down).toBe(1);
        expect(finalSpec.monitor.timeout).toBe(1);
      });
    });

    describe('Model submit function (edit pool tls_enabled)', function() {

      beforeEach(function() {
        includeChildResources = true;
        listenerResources.pool.tls_enabled = true;
        listenerResources.pool.tls_ciphers = "A:B:C";
        model.initialize('pool', 'poolId', 'loadbalancerId');
        scope.$apply();
      });

      it('should set final spec properties', function() {

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer).toBeUndefined();
        expect(finalSpec.listener).toBeUndefined();

        expect(finalSpec.pool.name).toBe('Pool 1');
        expect(finalSpec.pool.description).toBe('pool description');
        expect(finalSpec.pool.protocol).toBe('HTTP');
        expect(finalSpec.pool.lb_algorithm).toBe('ROUND_ROBIN');
        expect(finalSpec.pool.session_persistence.type).toBe('APP_COOKIE');
        expect(finalSpec.pool.session_persistence.cookie_name).toBe('cookie_name');
        expect(finalSpec.pool.tls_enabled).toBe(true);
        expect(finalSpec.pool.tls_ciphers).toBe("A:B:C");

        expect(finalSpec.members.length).toBe(2);
        expect(finalSpec.members[0].id).toBe('1234');
        expect(finalSpec.members[0].address).toBe('1.2.3.4');
        expect(finalSpec.members[0].subnet_id).toBe('subnet-1');
        expect(finalSpec.members[0].protocol_port).toBe(80);
        expect(finalSpec.members[0].weight).toBe(1);
        expect(finalSpec.members[1].id).toBe('5678');
        expect(finalSpec.members[1].address).toBe('5.6.7.8');
        expect(finalSpec.members[1].subnet_id).toBe('subnet-1');
        expect(finalSpec.members[1].protocol_port).toBe(80);
        expect(finalSpec.members[1].weight).toBe(1);

        expect(finalSpec.monitor.type).toBe('HTTP');
        expect(finalSpec.monitor.delay).toBe(1);
        expect(finalSpec.monitor.max_retries).toBe(1);
        expect(finalSpec.monitor.max_retries_down).toBe(1);
        expect(finalSpec.monitor.timeout).toBe(1);
      });
    });

    describe('Model submit function (update member list)', function() {

      beforeEach(function() {
        includeChildResources = false;
        model.initialize('members', false, 'loadbalancerId', 'poolId');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer_id).toBe('loadbalancerId');
        expect(finalSpec.parentResourceId).toBe('poolId');

        expect(finalSpec.loadbalancer).toBeUndefined();
        expect(finalSpec.listener).toBeUndefined();

        expect(finalSpec.pool.name).toBe('Pool 1');
        expect(finalSpec.pool.description).toBe('pool description');
        expect(finalSpec.pool.protocol).toBe('HTTP');
        expect(finalSpec.pool.lb_algorithm).toBe('ROUND_ROBIN');
        expect(finalSpec.pool.session_persistence.type).toBe('APP_COOKIE');
        expect(finalSpec.pool.session_persistence.cookie_name).toBe('cookie_name');

        expect(finalSpec.members.length).toBe(2);
        expect(finalSpec.members[0].id).toBe('1234');
        expect(finalSpec.members[0].address).toBe('1.2.3.4');
        expect(finalSpec.members[0].subnet_id).toBe('subnet-1');
        expect(finalSpec.members[0].protocol_port).toBe(80);
        expect(finalSpec.members[0].weight).toBe(1);
        expect(finalSpec.members[1].id).toBe('5678');
        expect(finalSpec.members[1].address).toBe('5.6.7.8');
        expect(finalSpec.members[1].subnet_id).toBe('subnet-1');
        expect(finalSpec.members[1].protocol_port).toBe(80);
        expect(finalSpec.members[1].weight).toBe(1);

        expect(finalSpec.monitor.delay).toBe(5);
        expect(finalSpec.monitor.max_retries).toBe(3);
        expect(finalSpec.monitor.max_retries_down).toBe(3);
        expect(finalSpec.monitor.timeout).toBe(5);
      });
    });

    describe('Model visible resources (edit pool, no pool in response)', function() {

      beforeEach(function() {
        includeChildResources = true;
        delete listenerResources.pool;
        model.initialize('pool', 'poolId', 'loadbalancerId');
        scope.$apply();
      });

      it('should only show pool and monitor details', function() {
        expect(model.context.id).toEqual('poolId');
      });

    });

    describe('Model visible resources (edit pool, no existing members)', function() {

      beforeEach(function() {
        includeChildResources = true;
        delete listenerResources.listener;
        delete listenerResources.members;
        model.initialize('pool', 'poolId', 'loadbalancerId');
        scope.$apply();
      });

      it('should only show pool and monitor details', function() {
        expect(model.context.id).toEqual('poolId');
      });
    });

    describe('Model visible resources (edit pool, no monitor)', function() {

      beforeEach(function() {
        includeChildResources = true;
        delete listenerResources.listener;
        delete listenerResources.monitor;
        model.initialize('pool', 'poolId', 'loadbalancerId');
        scope.$apply();
      });

      it('should only show pool and monitor details', function() {
        expect(model.context.id).toEqual('poolId');
      });
    });

    describe('Model visible resources (edit pool, no session persistence)', function() {

      beforeEach(function() {
        includeChildResources = true;
        delete listenerResources.listener;
        delete listenerResources.monitor;
        delete listenerResources.pool.session_persistence;
        model.initialize('pool', 'poolId', 'loadbalancerId');
        scope.$apply();
      });

      it('should only show pool and monitor details', function() {
        model.submit();
        expect(model.context.id).toEqual('poolId');
      });
    });

    describe('Model visible resources (edit pool, no session persistence type)', function() {

      beforeEach(function() {
        includeChildResources = true;
        delete listenerResources.listener;
        delete listenerResources.monitor;
        delete listenerResources.pool.session_persistence.type;
        model.initialize('pool', 'poolId', 'loadbalancerId');
        scope.$apply();
      });

      it('should only show pool and monitor details', function() {
        expect(model.context.id).toEqual('poolId');
      });
    });

    describe('Model visible resources (edit pool, no session persistence cookie name)', function() {

      beforeEach(function() {
        includeChildResources = true;
        delete listenerResources.listener;
        delete listenerResources.monitor;
        delete listenerResources.pool.session_persistence.cookie_name;
        model.initialize('pool', 'poolId', 'loadbalancerId');
        scope.$apply();
      });

      it('should only show pool and monitor details', function() {
        expect(model.context.id).toEqual('poolId');
      });
    });

    describe('Model submit function (edit health monitor)', function() {

      beforeEach(function() {
        model.initialize('monitor', 'healthmonitor1');
        scope.$apply();
      });

      it('should set final spec properties', function() {
        model.spec.monitor.delay = 10;
        model.spec.monitor.max_retries = 6;
        model.spec.monitor.max_retries_down = 6;
        model.spec.monitor.timeout = 8;
        model.spec.monitor.http_method = 'GET';
        model.spec.monitor.expected_codes = '200-204';
        model.spec.monitor.url_path = '/foo/bar';

        var finalSpec = model.submit();

        expect(finalSpec.loadbalancer_id).toBeUndefined();
        expect(finalSpec.parentResourceId).toBeUndefined();
        expect(finalSpec.loadbalancer).toBeUndefined();
        expect(finalSpec.listener).toBeUndefined();
        expect(finalSpec.pool).toBeUndefined();
        expect(finalSpec.members).toBeUndefined();
        expect(finalSpec.certificates).toBeUndefined();

        expect(finalSpec.monitor.type).toBe('HTTP');
        expect(finalSpec.monitor.delay).toBe(10);
        expect(finalSpec.monitor.max_retries).toBe(6);
        expect(finalSpec.monitor.max_retries_down).toBe(6);
        expect(finalSpec.monitor.timeout).toBe(8);
        expect(finalSpec.monitor.http_method).toBe('GET');
        expect(finalSpec.monitor.expected_codes).toBe('200-204');
        expect(finalSpec.monitor.url_path).toBe('/foo/bar');
      });

    });

    describe('Model visible resources (edit listener, no insert headers)', function() {

      beforeEach(function() {
        delete listenerResources.listener.insert_headers;
        delete listenerResources.pool;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should only show listener details', function() {
        expect(model.context.resource).toEqual('listener');
      });
    });

    describe('Model visible resources (edit listener, no x forwared for)', function() {

      beforeEach(function() {
        listenerResources.listener.insert_headers['X-Forwarded-For'] = '';
        delete listenerResources.pool;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should only show listener details', function() {
        model.submit();
        expect(model.context.resource).toEqual('listener');
      });
    });

    describe('Model visible resources (edit listener, no x forwared port)', function() {

      beforeEach(function() {
        delete listenerResources.listener.insert_headers['X-Forwarded-Port'];
        delete listenerResources.pool;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should only show listener details', function() {
        expect(model.context.resource).toEqual('listener');
      });
    });

    describe('Model visible resources (edit listener, no x forwared proto)', function() {

      beforeEach(function() {
        delete listenerResources.listener.insert_headers['X-Forwarded-Proto'];
        delete listenerResources.pool;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should only show listener details', function() {
        expect(model.context.resource).toEqual('listener');
      });
    });

    describe('Model visible resources (edit listener, no pool)', function() {

      beforeEach(function() {
        delete listenerResources.pool;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should only show listener details', function() {
        expect(model.context.resource).toEqual('listener');
      });
    });

    describe('Model visible resources (edit listener, no monitor or existing members)', function() {

      beforeEach(function() {
        delete listenerResources.members;
        delete listenerResources.monitor;
        model.initialize('listener', '1234');
        scope.$apply();
      });

      it('should only show listener, pool, and member details', function() {
        expect(model.context.resource).toEqual('listener');
      });
    });

  });
})();
