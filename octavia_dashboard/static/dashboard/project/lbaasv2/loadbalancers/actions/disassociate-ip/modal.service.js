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

  angular
    .module('horizon.dashboard.project.lbaasv2.loadbalancers')
    .factory(
      'horizon.dashboard.project.lbaasv2.loadbalancers.actions.disassociate-ip',
      modalService);

  modalService.$inject = [
    '$q',
    '$route',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.app.core.openstack-service-api.network',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.q.extensions',
    'horizon.framework.util.i18n.gettext'
  ];

  /**
   * @ngDoc factory
   * @name horizon.dashboard.project.lbaasv2.loadbalancers.actions.disassociate-ip
   *
   * @description
   * Brings up the disassociate floating IP confirmation modal dialog.
   * On submit, dsiassociates the floating IP address from the load balancer.
   * On cancel, does nothing.
   *
   * @param $q The angular service for promises.
   * @param $route The angular $route service.
   * @param deleteModal The horizon delete modal service.
   * @param network The horizon network API service.
   * @param policy The horizon policy service.
   * @param qExtensions Horizon extensions to the $q service.
   * @param gettext The horizon gettext function for translation.
   *
   * @returns The Disassociate Floating IP modal service.
   */

  function modalService($q, $route, deleteModal, network, policy, qExtensions, gettext) {
    var loadbalancer;
    var context = {
      labels: {
        title: gettext('Confirm Disassociate Floating IP Address'),
        /* eslint-disable max-len */
        message: gettext('You are about to disassociate the floating IP address from load balancer "%s". Please confirm.'),
        /* eslint-enable max-len */
        submit: gettext('Disassociate'),
        success: gettext('Disassociated floating IP address from load balancer: %s.'),
        error: gettext('Unable to disassociate floating IP address from load balancer: %s.')
      },
      deleteEntity: disassociate
    };

    var service = {
      perform: perform,
      allowed: allowed
    };

    return service;

    //////////////

    function perform(item) {
      loadbalancer = item;
      deleteModal.open({ $emit: actionComplete }, [item], context);
    }

    function allowed(item) {
      return $q.all([
        qExtensions.booleanAsPromise(item.floating_ip && !!item.floating_ip.ip),
        // This rule is made up and should therefore always pass. At some point there will
        // likely be a valid rule similar to this that we will want to use.
        policy.ifAllowed({ rules: [['neutron', 'loadbalancer_disassociate_floating_ip']] })
      ]);
    }

    function disassociate() {
      return network.disassociateFloatingIp(loadbalancer.floating_ip.id);
    }

    function actionComplete() {
      $route.reload();
    }

  }
})();
