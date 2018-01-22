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
    'horizon.app.core.openstack-service-api.barbican',
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
   * @param barbicanAPI The barbican service API.
   * @param serviceCatalog The keystone service catalog API.
   * @param gettext The horizon gettext function for translation.
   * @returns The model service for the create load balancer workflow.
   */

  function workflowModel(
    $q,
    neutronAPI,
    novaAPI,
    lbaasv2API,
    barbicanAPI,
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

      visibleResources: [],
      subnets: [],
      members: [],
      listenerProtocols: ['HTTP', 'TCP', 'TERMINATED_HTTPS'],
      methods: ['LEAST_CONNECTIONS', 'ROUND_ROBIN', 'SOURCE_IP'],
      types: ['SOURCE_IP', 'HTTP_COOKIE', 'APP_COOKIE'],
      monitorTypes: ['HTTP', 'PING', 'TCP'],
      monitorMethods: ['GET', 'HEAD'],
      certificates: [],
      listenerPorts: [],

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
        submit: null
      };

      model.visibleResources = [];
      model.certificates = [];
      model.listenerPorts = [];

      model.spec = {
        loadbalancer_id: loadBalancerId,
        parentResourceId: parentResourceId,
        loadbalancer: {
          name: null,
          description: null,
          ip: null,
          subnet: null,
          admin_state_up: true
        },
        listener: {
          id: null,
          name: gettext('Listener 1'),
          description: null,
          protocol: null,
          port: null,
          connection_limit: -1,
          admin_state_up: true
        },
        pool: {
          id: null,
          name: gettext('Pool 1'),
          description: null,
          protocol: null,
          method: null,
          type: null,
          cookie: null,
          admin_state_up: true
        },
        monitor: {
          id: null,
          type: null,
          interval: 5,
          retry: 3,
          retry_down: 3,
          timeout: 5,
          method: 'GET',
          status: '200',
          path: '/',
          admin_state_up: true
        },
        members: [],
        certificates: []
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
        createpool: initCreatePool,
        createmonitor: initCreateMonitor,
        createmembers: initUpdateMemberList,
        editloadbalancer: initEditLoadBalancer,
        editlistener: initEditListener,
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
        lbaasv2API.getLoadBalancers().then(onGetLoadBalancers),
        neutronAPI.getSubnets().then(onGetSubnets),
        neutronAPI.getPorts().then(onGetPorts),
        novaAPI.getServers().then(onGetServers),
        keymanagerPromise.then(prepareCertificates, angular.noop)
      ]).then(initMemberAddresses);
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

    function initCreatePool() {
      model.context.submit = createPool;
      //  We get the listener details here because we need to know the listener protocol
      //  in order to default the new pool's protocol to match.
      return $q.all([
        lbaasv2API.getListener(model.spec.parentResourceId).then(onGetListener),
        neutronAPI.getSubnets().then(onGetSubnets),
        neutronAPI.getPorts().then(onGetPorts),
        novaAPI.getServers().then(onGetServers)
      ]).then(initMemberAddresses);
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
        lbaasv2API.getLoadBalancer(model.context.id).then(onGetLoadBalancer),
        neutronAPI.getSubnets().then(onGetSubnets)
      ]).then(initSubnet);
    }

    function initEditListener() {
      model.context.submit = editListener;
      return $q.all([
        neutronAPI.getSubnets().then(onGetSubnets).then(getListener).then(onGetListener),
        neutronAPI.getPorts().then(onGetPorts),
        novaAPI.getServers().then(onGetServers)
      ]).then(initMemberAddresses);
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

      // Load balancer requires subnet
      if (!finalSpec.loadbalancer.subnet) {
        delete finalSpec.loadbalancer;
      } else {
        finalSpec.loadbalancer.subnet = finalSpec.loadbalancer.subnet.id;
      }

      // Cannot edit the IP or subnet
      if (context.resource === 'loadbalancer' && context.id) {
        delete finalSpec.subnet;
        delete finalSpec.ip;
      }
    }

    function cleanFinalSpecListener(finalSpec) {
      if (!finalSpec.listener.protocol || !finalSpec.listener.port) {
        // Listener requires protocol and port
        delete finalSpec.listener;
        delete finalSpec.certificates;
      } else if (finalSpec.listener.protocol !== 'TERMINATED_HTTPS') {
        // Remove certificate containers if not using TERMINATED_HTTPS
        delete finalSpec.certificates;
      } else {
        var containers = [];
        angular.forEach(finalSpec.certificates, function(cert) {
          containers.push(cert.id);
        });
        finalSpec.certificates = containers;
      }
    }

    function cleanFinalSpecPool(finalSpec) {

      // Pool requires method
      if (!finalSpec.pool.method) {
        delete finalSpec.pool;
      } else {
        // The pool protocol must be HTTP if the listener protocol is TERMINATED_HTTPS and
        // otherwise has to match it.
        var protocol = finalSpec.listener ? finalSpec.listener.protocol : finalSpec.pool.protocol;
        finalSpec.pool.protocol = protocol === 'TERMINATED_HTTPS' ? 'HTTP' : protocol;
      }
    }

    function cleanFinalSpecMembers(finalSpec) {
      if (finalSpec.members.length === 0) {
        delete finalSpec.members;
        return;
      }

      var members = [];
      angular.forEach(finalSpec.members, function cleanMember(member) {
        if (member.address && member.port) {
          var propsToRemove = ['name', 'description', 'addresses', 'allocatedMember'];
          propsToRemove.forEach(function deleteProperty(prop) {
            if (angular.isDefined(member[prop])) {
              delete member[prop];
            }
          });
          if (angular.isObject(member.address)) {
            member.subnet = member.address.subnet;
            member.address = member.address.ip;
          } else if (member.subnet) {
            member.subnet = member.subnet.id;
          } else {
            delete member.subnet;
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

      // Monitor requires an interval, retry count, and timeout
      if (!angular.isNumber(finalSpec.monitor.interval) ||
          !angular.isNumber(finalSpec.monitor.retry) ||
          !angular.isNumber(finalSpec.monitor.timeout)) {
        delete finalSpec.monitor;
        return;
      }

      // Only include necessary monitor properties
      if (finalSpec.monitor.type !== 'HTTP') {
        delete finalSpec.monitor.method;
        delete finalSpec.monitor.status;
        delete finalSpec.monitor.path;
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

    function onGetLoadBalancers(response) {
      var existingNames = {};
      angular.forEach(response.data.items, function nameExists(lb) {
        existingNames[lb.name] = 1;
      });
      var name;
      var index = response.data.items.length;
      do {
        index += 1;
        name = interpolate(gettext('Load Balancer %(index)s'), { index: index }, true);
      } while (name in existingNames);
      model.spec.loadbalancer.name = name;
    }

    function onGetListeners(response) {
      var existingNames = {};
      angular.forEach(response.data.items, function nameExists(listener) {
        existingNames[listener.name] = 1;
        model.listenerPorts.push(listener.protocol_port);
      });
      var name;
      var index = response.data.items.length;
      do {
        index += 1;
        name = interpolate(gettext('Listener %(index)s'), { index: index }, true);
      } while (name in existingNames);
      model.spec.listener.name = name;
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
            admin_state_up: true
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
          member.port = {HTTP: 80}[model.spec.pool.protocol];
        }
      });
    }

    function getListener() {
      return lbaasv2API.getListener(model.context.id, true);
    }

    function getPool() {
      return lbaasv2API.getPool(model.context.id, true);
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
        model.visibleResources.push('listener');
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
          });
          model.visibleResources.push('certificates');
          $('#wizard-side-nav ul li:last').show();
        }
      }

      if (result.pool) {
        setPoolSpec(result.pool);
        model.visibleResources.push('pool');
        model.visibleResources.push('members');

        if (result.members) {
          setMembersSpec(result.members);
        }

        if (result.monitor) {
          setMonitorSpec(result.monitor);
          model.visibleResources.push('monitor');
        }
      }
    }

    function onGetPool(response) {
      var result = response.data;

      setPoolSpec(result.pool || result);

      if (result.pool) {
        model.visibleResources.push('pool');
        model.visibleResources.push('members');

        if (result.members) {
          setMembersSpec(result.members);
        }

        if (result.monitor) {
          setMonitorSpec(result.monitor);
          model.visibleResources.push('monitor');
        }
      }
    }

    function setLoadBalancerSpec(loadbalancer) {
      var spec = model.spec.loadbalancer;
      spec.name = loadbalancer.name;
      spec.description = loadbalancer.description;
      spec.ip = loadbalancer.vip_address;
      spec.subnet = loadbalancer.vip_subnet_id;
      spec.admin_state_up = loadbalancer.admin_state_up;
    }

    function setListenerSpec(listener) {
      var spec = model.spec.listener;
      spec.id = listener.id;
      spec.name = listener.name;
      spec.description = listener.description;
      spec.protocol = listener.protocol;
      spec.port = listener.protocol_port;
      spec.connection_limit = listener.connection_limit;
      spec.admin_state_up = listener.admin_state_up;
    }

    function setPoolSpec(pool) {
      var spec = model.spec.pool;
      spec.id = pool.id;
      spec.name = pool.name;
      spec.description = pool.description;
      spec.protocol = pool.protocol;
      spec.method = pool.lb_algorithm;
      spec.admin_state_up = pool.admin_state_up;
      if (angular.isObject(pool.session_persistence)) {
        var type = pool.session_persistence.type;
        var cookie = pool.session_persistence.cookie_name;
        if (type) {
          spec.type = type;
        }
        if (type === 'APP_COOKIE' && cookie) {
          spec.cookie = cookie;
        }
      }
    }

    function setMembersSpec(membersList) {
      model.spec.members.length = 0;
      var members = [];

      angular.forEach(membersList, function addMember(member) {
        members.push({
          id: member.id,
          address: member.address,
          subnet: mapSubnetObj(member.subnet_id),
          port: member.protocol_port,
          weight: member.weight,
          monitor_address: member.monitor_address,
          monitor_port: member.monitor_port,
          admin_state_up: member.admin_state_up,
          allocatedMember: true
        });
      });
      push.apply(model.spec.members, members);
    }

    function setMonitorSpec(monitor) {
      var spec = model.spec.monitor;
      spec.id = monitor.id;
      spec.type = monitor.type;
      spec.interval = monitor.delay;
      spec.timeout = monitor.timeout;
      spec.retry = monitor.max_retries;
      spec.retry_down = monitor.max_retries_down;
      spec.method = monitor.http_method;
      spec.status = monitor.expected_codes;
      spec.path = monitor.url_path;
      spec.admin_state_up = monitor.admin_state_up;
    }

    function onGetHealthMonitor(response) {
      setMonitorSpec(response.data);
    }

    function prepareCertificates() {
      return $q.all([
        barbicanAPI.getCertificates(true),
        barbicanAPI.getSecrets(true)
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
      });
      push.apply(model.certificates, certificates);
    }

    function initSubnet() {
      var subnet = model.subnets.filter(function filterSubnetsByLoadBalancer(s) {
        return s.id === model.spec.loadbalancer.subnet;
      })[0];
      model.spec.loadbalancer.subnet = subnet;
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
