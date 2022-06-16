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

  var push = Array.prototype.push;

  angular
    .module('horizon.dashboard.project.lbaasv2')
    .factory('horizon.dashboard.project.lbaasv2.workflow.model', workflowModel);

  workflowModel.$inject = [
    '$q',
    'horizon.app.core.openstack-service-api.neutron',
    'horizon.app.core.openstack-service-api.nova',
    'horizon.app.core.openstack-service-api.lbaasv2',
    'horizon.app.core.openstack-service-api.octavia-barbican',
    'horizon.app.core.openstack-service-api.serviceCatalog',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngdoc service
   * @name horizon.dashboard.project.lbaasv2.workflow.model
   *
   * @description
   * This is the M part of the MVC design pattern for the LBaaS wizard workflow. It is responsible
   * for providing data to the view of each step in the workflow and collecting the user's input
   * from the view. It is also the center point of communication between the UI and services API.
   *
   * @param $q The angular service for promises.
   * @param neutronAPI The neutron service API.
   * @param novaAPI The nova service API.
   * @param lbaasv2API The LBaaS V2 service API.
   * @param octaviaBarbicanAPI The octavia barbican service API.
   * @param serviceCatalog The keystone service catalog API.
   * @param gettext The horizon gettext function for translation.
   * @returns The model service for the create load balancer workflow.
   */

  function workflowModel(
    $q,
    neutronAPI,
    novaAPI,
    lbaasv2API,
    octaviaBarbicanAPI,
    serviceCatalog,
    gettext
  ) {
    var ports, keymanagerPromise;

    /**
     * @ngdoc model api object
     */

    var model = {

      initializing: false,
      initialized: false,
      context: null,

      /**
       * @name spec
       *
       * @description
       * A dictionary like object containing specification collected from user
       * input.
       */

      spec: null,

      subnets: [],
      members: [],
      networks: {},
      flavors: {},
      listenerProtocols: ['HTTP', 'TCP', 'TERMINATED_HTTPS', 'HTTPS', 'UDP', 'SCTP'],
      availability_zones: {},
      l7policyActions: ['REJECT', 'REDIRECT_TO_URL', 'REDIRECT_TO_POOL'],
      l7ruleTypes: ['HOST_NAME', 'PATH', 'FILE_TYPE', 'HEADER', 'COOKIE'],
      l7ruleCompareTypes: ['REGEX', 'EQUAL_TO', 'STARTS_WITH', 'ENDS_WITH', 'CONTAINS'],
      l7ruleFileTypeCompareTypes: ['REGEX', 'EQUAL_TO'],
      poolProtocols: ['HTTP', 'HTTPS', 'PROXY', 'PROXYV2', 'TCP', 'UDP', 'SCTP'],
      methods: ['LEAST_CONNECTIONS', 'ROUND_ROBIN', 'SOURCE_IP'],
      types: ['SOURCE_IP', 'HTTP_COOKIE', 'APP_COOKIE'],
      monitorTypes: ['HTTP', 'HTTPS', 'PING', 'TCP', 'TLS-HELLO', 'UDP-CONNECT', 'SCTP'],
      monitorMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE',
                       'TRACE', 'OPTIONS', 'PATCH', 'CONNECT'],
      certificates: [],
      listenerPorts: [],
      yesNoOptions: [
        { label: gettext('Yes'), value: true },
        { label: gettext('No'), value: false }
      ],

      /**
       * api methods for UI controllers
       */

      initialize: initialize,
      submit: submit
    };

    return model;

    ///////////////

    /**
     * @ngdoc method
     * @name workflowModel.initialize
     * @returns {promise}
     *
     * @description
     * Send request to get all data to initialize the model.
     *
     * @param resource Resource type being created / edited, one of 'loadbalancer', 'listener',
     * 'pool', 'monitor', or 'members'.
     * @param id ID of the resource being edited.
     */

    function initialize(resource, id, loadBalancerId, parentResourceId) {
      var promise;

      model.certificatesError = false;
      model.context = {
        resource: resource,
        id: id,
        submit: null,
        create_listener: true,
        create_pool: true,
        create_monitor: true
      };

      model.certificates = [];
      model.listenerPorts = [];

      model.spec = {
        loadbalancer_id: loadBalancerId,
        parentResourceId: parentResourceId,
        loadbalancer: {
          name: null,
          description: null,
          vip_address: null,
          vip_subnet_id: null,
          flavor_id: null,
          availability_zone: null,
          admin_state_up: true
        },
        listener: {
          id: null,
          name: null,
          description: null,
          protocol: null,
          protocol_port: null,
          connection_limit: -1,
          admin_state_up: true,
          default_pool: null,
          default_pool_id: null,
          insert_headers: {},
          timeout_client_data: 50000,
          timeout_member_connect: 5000,
          timeout_member_data: 50000,
          timeout_tcp_inspect: 0,
          allowed_cidrs: null,
          tls_ciphers: null
        },
        l7policy: {
          id: null,
          name: null,
          description: null,
          action: null,
          position: null,
          redirect_pool_id: null,
          redirect_url: null,
          admin_state_up: true
        },
        l7rule: {
          id: null,
          type: null,
          compare_type: null,
          key: null,
          rule_value: null,
          invert: false,
          admin_state_up: true
        },
        pool: {
          id: null,
          name: null,
          description: null,
          protocol: null,
          lb_algorithm: null,
          session_persistence: {
            type: null,
            cookie_name: null
          },
          admin_state_up: true,
          tls_enabled: false,
          tls_ciphers: null
        },
        monitor: {
          id: null,
          name: null,
          type: null,
          delay: 5,
          max_retries: 3,
          max_retries_down: 3,
          timeout: 5,
          http_method: 'GET',
          expected_codes: '200',
          url_path: '/',
          admin_state_up: true
        },
        members: [],
        certificates: [],
        availablePools: []
      };

      if (!model.initializing) {
        model.initializing = true;
        promise = initializeResources();
      }
      return promise;
    }

    function initializeResources() {
      var type = (model.context.id ? 'edit' : 'create') + model.context.resource;
      keymanagerPromise = serviceCatalog.ifTypeEnabled('key-manager');

      if (type === 'createloadbalancer' || model.context.resource === 'listener') {
        keymanagerPromise.then(angular.noop, certificatesNotSupported);
      }

      var promise = {
        createloadbalancer: initCreateLoadBalancer,
        createlistener: initCreateListener,
        createl7policy: initCreateL7Policy,
        createl7rule: initCreateL7Rule,
        createpool: initCreatePool,
        createmonitor: initCreateMonitor,
        createmembers: initUpdateMemberList,
        editloadbalancer: initEditLoadBalancer,
        editlistener: initEditListener,
        editl7policy: initEditL7Policy,
        editl7rule: initEditL7Rule,
        editpool: initEditPool,
        editmonitor: initEditMonitor
      }[type](keymanagerPromise);

      return promise.then(onInitSuccess, onInitFail);
    }

    function onInitSuccess() {
      model.initializing = false;
      model.initialized = true;
    }

    function onInitFail() {
      model.initializing = false;
      model.initialized = false;
    }

    function initCreateLoadBalancer(keymanagerPromise) {
      model.context.submit = createLoadBalancer;
      return $q.all([
        lbaasv2API.getFlavors().then(onGetFlavors),
        lbaasv2API.getAvailabilityZones().then(onGetAvailabilityZones),
        neutronAPI.getSubnets().then(onGetSubnets),
        neutronAPI.getPorts().then(onGetPorts),
        neutronAPI.getNetworks().then(onGetNetworks),
        novaAPI.getServers().then(onGetServers),
        keymanagerPromise.then(prepareCertificates, angular.noop)
      ]).then(initMemberAddresses);
    }

    function onGetNetworks(response) {
      angular.forEach(response.data.items, function(value) {
        model.networks[value.id] = value;
      });
    }

    function onGetFlavors(response) {
      angular.forEach(response.data.items, function(value) {
        model.flavors[value.id] = value;
      });
    }

    function onGetAvailabilityZones(response) {
      angular.forEach(response.data.items, function(value) {
        model.availability_zones[value.name] = value;
      });
    }

    function initCreateListener(keymanagerPromise) {
      model.context.submit = createListener;
      return $q.all([
        lbaasv2API.getListeners(model.spec.loadbalancer_id).then(onGetListeners),
        neutronAPI.getSubnets().then(onGetSubnets),
        neutronAPI.getPorts().then(onGetPorts),
        novaAPI.getServers().then(onGetServers),
        keymanagerPromise.then(prepareCertificates, angular.noop)
      ]).then(initMemberAddresses);
    }

    function initCreateL7Policy() {
      model.context.submit = createL7Policy;
      return lbaasv2API.getListener(model.spec.parentResourceId)
        .then(onGetListener).then(getPools).then(onGetPools);
    }

    function initCreateL7Rule() {
      model.context.submit = createL7Rule;
      return $q.when();
    }

    function initCreatePool() {
      model.context.submit = createPool;
      //  We get the listener details here because we need to know the listener protocol
      //  in order to default the new pool's protocol to match.
      if (model.spec.parentResourceId) {
        return $q.all([
          lbaasv2API.getListener(model.spec.parentResourceId).then(onGetListener),
          neutronAPI.getSubnets().then(onGetSubnets),
          neutronAPI.getPorts().then(onGetPorts),
          novaAPI.getServers().then(onGetServers)
        ]).then(initMemberAddresses);
      } else {
        return $q.all([
          neutronAPI.getSubnets().then(onGetSubnets),
          neutronAPI.getPorts().then(onGetPorts),
          novaAPI.getServers().then(onGetServers)
        ]).then(initMemberAddresses);
      }
    }

    function initCreateMonitor() {
      model.context.submit = createHealthMonitor;
      return $q.when();
    }

    function initUpdateMemberList() {
      model.context.submit = updatePoolMemberList;
      return $q.all([
        lbaasv2API.getPool(model.spec.parentResourceId).then(onGetPool),
        neutronAPI.getSubnets().then(onGetSubnets).then(getMembers).then(onGetMembers),
        neutronAPI.getPorts().then(onGetPorts),
        novaAPI.getServers().then(onGetServers)
      ]).then(initMemberAddresses);
    }

    function initEditLoadBalancer() {
      model.context.submit = editLoadBalancer;
      return $q.all([
        lbaasv2API.getFlavors().then(onGetFlavors),
        lbaasv2API.getAvailabilityZones().then(onGetAvailabilityZones),
        lbaasv2API.getLoadBalancer(model.context.id).then(onGetLoadBalancer),
        neutronAPI.getSubnets().then(onGetSubnets),
        neutronAPI.getNetworks().then(onGetNetworks)
      ]).then(initSubnet).then(initFlavor).then(initAvailabilityZone);
    }

    function initEditListener() {
      model.context.submit = editListener;
      return $q.all([
        neutronAPI.getSubnets().then(onGetSubnets).then(getListener)
          .then(onGetListener).then(getPools).then(onGetPools),
        neutronAPI.getPorts().then(onGetPorts),
        novaAPI.getServers().then(onGetServers)
      ]).then(initMemberAddresses);
    }

    function initEditL7Policy() {
      model.context.submit = editL7Policy;
      return lbaasv2API
        .getListener(model.spec.parentResourceId).then(onGetListener)
        .then(getPools).then(onGetPools)
        .then(getL7Policy).then(onGetL7Policy);
    }

    function initEditL7Rule() {
      model.context.submit = editL7Rule;
      return getL7Rule().then(onGetL7Rule);
    }

    function initEditPool() {
      model.context.submit = editPool;
      return $q.all([
        neutronAPI.getSubnets().then(onGetSubnets).then(getPool).then(onGetPool),
        neutronAPI.getPorts().then(onGetPorts),
        novaAPI.getServers().then(onGetServers)
      ]).then(initMemberAddresses);
    }

    function initEditMonitor() {
      model.context.submit = editHealthMonitor;
      return lbaasv2API.getHealthMonitor(model.context.id).then(onGetHealthMonitor);
    }

    /**
     * @ngdoc method
     * @name workflowModel.submit
     * @returns {promise}
     *
     * @description
     * Send request for completing the wizard.
     *
     * @returns Response from the LBaaS V2 API.
     */

    function submit() {
      var finalSpec = angular.copy(model.spec);
      cleanFinalSpecLoadBalancer(finalSpec);
      cleanFinalSpecListener(finalSpec);
      cleanFinalSpecPool(finalSpec);
      cleanFinalSpecMembers(finalSpec);
      cleanFinalSpecMonitor(finalSpec);
      removeNulls(finalSpec);
      return model.context.submit(finalSpec);
    }

    function createLoadBalancer(spec) {
      return lbaasv2API.createLoadBalancer(spec);
    }

    function createListener(spec) {
      return lbaasv2API.createListener(spec);
    }

    function createL7Policy(spec) {
      return lbaasv2API.createL7Policy(spec);
    }

    function createL7Rule(spec) {
      return lbaasv2API.createL7Rule(model.spec.parentResourceId, spec);
    }

    function createPool(spec) {
      return lbaasv2API.createPool(spec);
    }

    function createHealthMonitor(spec) {
      return lbaasv2API.createHealthMonitor(spec);
    }

    function editLoadBalancer(spec) {
      return lbaasv2API.editLoadBalancer(model.context.id, spec);
    }

    function editListener(spec) {
      return lbaasv2API.editListener(model.context.id, spec);
    }

    function editL7Policy(spec) {
      return lbaasv2API.editL7Policy(model.context.id, spec);
    }

    function editL7Rule(spec) {
      return lbaasv2API.editL7Rule(model.spec.parentResourceId, model.context.id, spec);
    }

    function editPool(spec) {
      return lbaasv2API.editPool(model.context.id, spec);
    }

    function editHealthMonitor(spec) {
      return lbaasv2API.editHealthMonitor(model.context.id, spec);
    }

    function updatePoolMemberList(spec) {
      return lbaasv2API.updateMemberList(model.spec.parentResourceId, spec);
    }

    function cleanFinalSpecLoadBalancer(finalSpec) {
      var context = model.context;

      if (angular.isObject(finalSpec.loadbalancer.flavor_id)) {
        finalSpec.loadbalancer.flavor_id = finalSpec.loadbalancer.flavor_id.id;
      }

      if (angular.isObject(finalSpec.loadbalancer.availability_zone)) {
        finalSpec.loadbalancer.availability_zone = finalSpec.loadbalancer.availability_zone.name;
      }

      // Load balancer requires vip_subnet_id
      if (!finalSpec.loadbalancer.vip_subnet_id) {
        delete finalSpec.loadbalancer;
      } else {
        finalSpec.loadbalancer.vip_subnet_id = finalSpec.loadbalancer.vip_subnet_id.id;
      }

      // Cannot edit the IP or subnet
      if (context.resource === 'loadbalancer' && context.id) {
        delete finalSpec.flavor_id;
        delete finalSpec.availability_zone;
        delete finalSpec.vip_subnet_id;
        delete finalSpec.vip_address;
      }
    }

    function cleanFinalSpecListener(finalSpec) {
      if (!finalSpec.listener.protocol || !finalSpec.listener.protocol_port) {
        // Listener requires protocol and port
        delete finalSpec.listener;
        delete finalSpec.certificates;
      } else {
        for (var header in finalSpec.listener.insert_headers) {
          if (!finalSpec.listener.insert_headers[header]) {
            delete finalSpec.listener.insert_headers[header];
          }
        }
        if (finalSpec.listener.protocol !== 'TERMINATED_HTTPS') {
          // Remove certificate containers if not using TERMINATED_HTTPS
          delete finalSpec.certificates;
          delete finalSpec.listener.tls_ciphers;
        } else {
          var containers = [];
          angular.forEach(finalSpec.certificates, function(cert) {
            containers.push(cert.id);
          });
          finalSpec.certificates = containers;
        }
      }
    }

    function cleanFinalSpecPool(finalSpec) {

      // Pool requires method
      if (!finalSpec.pool.lb_algorithm) {
        delete finalSpec.pool;
      } else {
        // The pool protocol must be HTTP if the listener protocol is TERMINATED_HTTPS and
        // otherwise has to match it.
        var protocol = finalSpec.listener ? finalSpec.listener.protocol : finalSpec.pool.protocol;
        finalSpec.pool.protocol = protocol === 'TERMINATED_HTTPS' ? 'HTTP' : protocol;
        if (!finalSpec.pool.tls_enabled) {
          delete finalSpec.pool.tls_ciphers;
        }
        if (angular.isObject(finalSpec.pool.session_persistence)) {
          if (!finalSpec.pool.session_persistence.type) {
            finalSpec.pool.session_persistence = null;
          } else if (finalSpec.pool.session_persistence.type !== 'APP_COOKIE') {
            finalSpec.pool.session_persistence.cookie_name = null;
          }
        }
      }
    }

    function cleanFinalSpecMembers(finalSpec) {
      if (finalSpec.members.length === 0) {
        delete finalSpec.members;
        return;
      }

      var members = [];
      angular.forEach(finalSpec.members, function cleanMember(member) {
        if (member.address && member.protocol_port) {
          var propsToRemove = ['description', 'addresses', 'allocatedMember'];
          propsToRemove.forEach(function deleteProperty(prop) {
            if (angular.isDefined(member[prop])) {
              delete member[prop];
            }
          });
          if (angular.isObject(member.address)) {
            member.subnet_id = member.address.subnet;
            member.address = member.address.ip;
          } else if (member.subnet_id) {
            member.subnet_id = member.subnet_id.id;
          } else {
            delete member.subnet_id;
          }
          members.push(member);
        }
      });
      if (members.length > 0) {
        finalSpec.members = members;
      } else {
        delete finalSpec.members;
      }
    }

    function cleanFinalSpecMonitor(finalSpec) {

      // Monitor requires delay, max_retries, and timeout
      if (!angular.isNumber(finalSpec.monitor.delay) ||
          !angular.isNumber(finalSpec.monitor.max_retries) ||
          !angular.isNumber(finalSpec.monitor.timeout)) {
        delete finalSpec.monitor;
        return;
      }

      // Only include necessary monitor properties
      if (finalSpec.monitor.type !== 'HTTP' && finalSpec.monitor.type !== 'HTTPS') {
        delete finalSpec.monitor.http_method;
        delete finalSpec.monitor.expected_codes;
        delete finalSpec.monitor.url_path;
      }
    }

    function removeNulls(finalSpec) {
      angular.forEach(finalSpec, function deleteNullsForGroup(group, groupName) {
        angular.forEach(group, function deleteNullValue(value, key) {
          if (value === null) {
            delete finalSpec[groupName][key];
          }
        });
      });
    }

    function onGetListeners(response) {
      angular.forEach(response.data.items, function addPort(listener) {
        model.listenerPorts.push(listener.protocol_port);
      });
    }

    function onGetPools(response) {
      angular.forEach(response.data.items, function addPool(pool) {
        if (pool.listeners.length > 0 && pool.listeners[0].id !== model.spec.listener.id) {
          return;
        }
        var p = pool.id + '(' + pool.name + ')';
        if (pool.protocol === model.spec.listener.protocol) {
          model.spec.availablePools.push(p);
        } else if (pool.protocol === 'HTTP' &&
          model.spec.listener.protocol === 'TERMINATED_HTTPS') {
          model.spec.availablePools.push(p);
        }
      });
    }

    function onGetSubnets(response) {
      model.subnets.length = 0;
      push.apply(model.subnets, response.data.items);
    }

    function onGetServers(response) {
      model.members.length = 0;
      var members = [];
      angular.forEach(response.data.items, function addMember(server) {
        // If the server is in a state where it does not have an IP address then we can't use it
        if (server.addresses && !angular.equals({}, server.addresses)) {
          members.push({
            id: server.id,
            name: server.name,
            weight: 1,
            monitor_address: null,
            monitor_port: null,
            admin_state_up: true,
            backup: false
          });
        }
      });
      push.apply(model.members, members);
    }

    function onGetPorts(response) {
      ports = response.data.items;
    }

    function onGetMembers(response) {
      setMembersSpec(response.data.items);
    }

    function initMemberAddresses() {
      angular.forEach(model.members, function initAddresses(member) {
        var memberPorts = ports.filter(function filterPortByDevice(port) {
          return port.device_id === member.id;
        });
        member.addresses = [];
        angular.forEach(memberPorts, function addAddressesForPort(port) {
          angular.forEach(port.fixed_ips, function addAddress(ip) {
            member.addresses.push({
              ip: ip.ip_address,
              subnet: ip.subnet_id
            });
          });
        });
        member.address = member.addresses[0];

        if (model.spec.pool.protocol) {
          member.protocol_port = {HTTP: 80}[model.spec.pool.protocol];
        }
      });
    }

    function getListener() {
      return lbaasv2API.getListener(model.context.id, true);
    }

    function getL7Policy() {
      return lbaasv2API.getL7Policy(model.context.id, true);
    }

    function getL7Rule() {
      return lbaasv2API.getL7Rule(model.spec.parentResourceId,
        model.context.id);
    }

    function getPool() {
      return lbaasv2API.getPool(model.context.id, true);
    }

    function getPools() {
      return lbaasv2API.getPools(model.spec.loadbalancer_id);
    }

    function getMembers() {
      return lbaasv2API.getMembers(model.spec.parentResourceId);
    }

    function onGetLoadBalancer(response) {
      var loadbalancer = response.data;
      setLoadBalancerSpec(loadbalancer);
    }

    function onGetListener(response) {
      var result = response.data;

      setListenerSpec(result.listener || result);

      if (result.listener) {
        model.spec.loadbalancer_id = result.listener.load_balancers[0].id;

        if (result.listener.protocol === 'TERMINATED_HTTPS') {
          keymanagerPromise.then(prepareCertificates).then(function addAvailableCertificates() {
            result.listener.sni_container_refs.forEach(function addAvailableCertificate(ref) {
              model.certificates.filter(function matchCertificate(cert) {
                return cert.id === ref;
              }).forEach(function addCertificate(cert) {
                model.spec.certificates.push(cert);
              });
            });
          }, certificatesError);
          $('#wizard-side-nav ul li:last').show();
        }
      }

      if (result.pool) {
        setPoolSpec(result.pool);

        if (result.members) {
          setMembersSpec(result.members);
        }

        if (result.monitor) {
          setMonitorSpec(result.monitor);
        }
      }
    }

    function onGetL7Policy(response) {
      var result = response.data;

      setL7PolicySpec(result.l7policy || result);
    }

    function onGetL7Rule(response) {
      var result = response.data;

      setL7RuleSpec(result.l7rule || result);
    }

    function onGetPool(response) {
      var result = response.data;

      setPoolSpec(result.pool || result);

      if (result.pool) {
        if (result.members) {
          setMembersSpec(result.members);
        }

        if (result.monitor) {
          setMonitorSpec(result.monitor);
        }
      }
    }

    function setLoadBalancerSpec(loadbalancer) {
      var spec = model.spec.loadbalancer;
      spec.name = loadbalancer.name;
      spec.description = loadbalancer.description;
      spec.vip_address = loadbalancer.vip_address;
      spec.vip_subnet_id = loadbalancer.vip_subnet_id;
      spec.flavor_id = loadbalancer.flavor_id;
      spec.availability_zone = loadbalancer.availability_zone;
      spec.admin_state_up = loadbalancer.admin_state_up;
    }

    function setListenerSpec(listener) {
      var spec = model.spec.listener;
      spec.id = listener.id;
      spec.name = listener.name;
      spec.description = listener.description;
      spec.protocol = listener.protocol;
      spec.protocol_port = listener.protocol_port;
      spec.connection_limit = listener.connection_limit;
      spec.admin_state_up = listener.admin_state_up;
      spec.default_pool_id = listener.default_pool_id;
      spec.insert_headers = listener.insert_headers;
      spec.timeout_client_data = listener.timeout_client_data;
      spec.timeout_member_connect = listener.timeout_member_connect;
      spec.timeout_member_data = listener.timeout_member_data;
      spec.timeout_tcp_inspect = listener.timeout_tcp_inspect;
      spec.allowed_cidrs = listener.allowed_cidrs;
      spec.tls_ciphers = listener.tls_ciphers;
    }

    function setL7PolicySpec(l7policy) {
      var spec = model.spec.l7policy;
      spec.id = l7policy.id;
      spec.name = l7policy.name;
      spec.description = l7policy.description;
      spec.action = l7policy.action;
      spec.position = l7policy.position;
      spec.redirect_pool_id = l7policy.redirect_pool_id;
      spec.redirect_url = l7policy.redirect_url;
      spec.admin_state_up = l7policy.admin_state_up;
    }

    function setL7RuleSpec(l7rule) {
      var spec = model.spec.l7rule;
      spec.id = l7rule.id;
      spec.type = l7rule.type;
      spec.compare_type = l7rule.compare_type;
      spec.key = l7rule.key;
      spec.rule_value = l7rule.rule_value;
      spec.invert = l7rule.invert;
      spec.admin_state_up = l7rule.admin_state_up;
    }

    function setPoolSpec(pool) {
      var spec = model.spec.pool;
      spec.id = pool.id;
      spec.name = pool.name;
      spec.description = pool.description;
      spec.protocol = pool.protocol;
      spec.lb_algorithm = pool.lb_algorithm;
      spec.admin_state_up = pool.admin_state_up;
      spec.session_persistence = pool.session_persistence;
      spec.tls_enabled = pool.tls_enabled;
      spec.tls_ciphers = pool.tls_ciphers;
    }

    function setMembersSpec(membersList) {
      model.spec.members.length = 0;
      var members = [];

      angular.forEach(membersList, function addMember(member) {
        members.push({
          id: member.id,
          address: member.address,
          subnet_id: mapSubnetObj(member.subnet_id),
          protocol_port: member.protocol_port,
          weight: member.weight,
          monitor_address: member.monitor_address,
          monitor_port: member.monitor_port,
          admin_state_up: member.admin_state_up,
          backup: member.backup,
          name: member.name,
          allocatedMember: true
        });
      });
      push.apply(model.spec.members, members);
    }

    function setMonitorSpec(monitor) {
      var spec = model.spec.monitor;
      spec.id = monitor.id;
      spec.type = monitor.type;
      spec.delay = monitor.delay;
      spec.timeout = monitor.timeout;
      spec.max_retries = monitor.max_retries;
      spec.max_retries_down = monitor.max_retries_down;
      spec.http_method = monitor.http_method;
      spec.expected_codes = monitor.expected_codes;
      spec.url_path = monitor.url_path;
      spec.admin_state_up = monitor.admin_state_up;
      spec.name = monitor.name;
    }

    function onGetHealthMonitor(response) {
      setMonitorSpec(response.data);
    }

    function prepareCertificates() {
      return $q.all([
        octaviaBarbicanAPI.getCertificates(true),
        octaviaBarbicanAPI.getSecrets(true)
      ]).then(onGetCertificates, certificatesError);
    }

    function onGetCertificates(results) {
      // To use the TERMINATED_HTTPS protocol with a listener, the LBaaS v2 API wants a default
      // container ref and a list of containers that hold TLS secrets. In barbican the container
      // object has a list of references to the secrets it holds. This assumes that each
      // certificate container has exactly one certificate and private key. We fetch both the
      // certificate containers and the secrets so that we can display the secret names and
      // expirations dates.
      model.certificates.length = 0;
      var certificates = [];
      // Only accept containers that have both a certificate and private_key ref
      var containers = results[0].data.items.filter(function validateContainer(container) {
        container.refs = {};
        container.secret_refs.forEach(function(ref) {
          container.refs[ref.name] = ref.secret_ref;
        });
        return 'certificate' in container.refs && 'private_key' in container.refs;
      });
      var certHrefs = [];
      var secrets = {};
      results[1].data.items.forEach(function addSecret(secret) {
        secrets[secret.secret_ref] = secret;
      });
      containers.forEach(function addCertificateContainer(container) {
        var secret = secrets[container.refs.certificate];
        certificates.push({
          id: container.container_ref,
          name: secret.name || secret.secret_ref.split('/').reverse()[0],
          expiration: secret.expiration
        });
        certHrefs.push(secret.secret_ref);
      });
      // Octavia now supports pkcs12 bundles which are stored as secrets.
      // If the secret hasn't already been loaded, add it to the list.
      for (var key in secrets) {
        if (secrets[key].secret_type !== "opaque") {continue;}
        var cert = {
          id: key,
          name: secrets[key].name || key,
          expiration: secrets[key].expiration
        };
        if (certHrefs.indexOf(key) === -1) {
          certificates.push(cert);
          certHrefs.push(key);
        }
      }

      push.apply(model.certificates, certificates);
    }

    function initSubnet() {
      var subnet = model.subnets.filter(function filterSubnetsByLoadBalancer(s) {
        return s.id === model.spec.loadbalancer.vip_subnet_id;
      })[0];
      model.spec.loadbalancer.vip_subnet_id = subnet;
    }

    function initFlavor() {
      model.spec.loadbalancer.flavor_id = model.flavors[model.spec.loadbalancer.flavor_id];
    }

    function initAvailabilityZone() {
      model.spec.loadbalancer.availability_zone = model.availability_zones[
        model.spec.loadbalancer.availability_zone];
    }

    function mapSubnetObj(subnetId) {
      var subnet = model.subnets.filter(function mapSubnet(subnet) {
        return subnet.id === subnetId;
      });

      return subnet[0];
    }

    function certificatesNotSupported() {
      // This function is called if the key-manager service is not available. In that case we
      // cannot support the TERMINATED_HTTPS listener protocol so we hide the option if creating
      // a new load balancer or listener. However for editing we still need it.
      if (!model.context.id) {
        model.listenerProtocols.splice(2, 1);
      }
    }

    function certificatesError() {
      // This function is called if there is an error fetching the certificate containers or
      // secrets. In that case we cannot support the TERMINATED_HTTPS listener protocol but we
      // want to make the user aware of the error.
      model.certificatesError = true;
    }
  }

})();
