/*
 * Copyright 2016 IBM Corp.
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

  angular
    .module('horizon.app.core.openstack-service-api')
    .factory('horizon.app.core.openstack-service-api.barbican', barbicanAPI);

  barbicanAPI.$inject = [
    'horizon.framework.util.http.service',
    'horizon.framework.widgets.toast.service'
  ];

  /**
   * @ngdoc service
   * @name horizon.app.core.openstack-service-api.barbican
   * @description Provides direct pass through to barbican with NO abstraction.
   * @param apiService The horizon core API service.
   * @param toastService The horizon toast service.
   * @returns The barbican service API.
   */

  function barbicanAPI(apiService, toastService) {
    var service = {
      getCertificates: getCertificates,
      getSecrets: getSecrets
    };

    return service;

    ///////////////

    // SSL Certificate Containers

    /**
     * @name horizon.app.core.openstack-service-api.barbican.getCertificates
     * @description
     * Get a list of SSL certificate containers.
     *
     * @param {boolean} quiet
     * The listing result is an object with property "items". Each item is
     * a certificate container.
     */

    function getCertificates(quiet) {
      var promise = apiService.get('/api/barbican/certificates/');
      return quiet ? promise : promise.error(function handleError() {
        toastService.add('error', gettext('Unable to retrieve SSL certificates.'));
      });
    }

    // Secrets

    /**
     * @name horizon.app.core.openstack-service-api.barbican.getSecrets
     * @description
     * Get a list of secrets.
     *
     * @param {boolean} quiet
     * The listing result is an object with property "items". Each item is
     * a secret.
     */

    function getSecrets(quiet) {
      var promise = apiService.get('/api/barbican/secrets/');
      return quiet ? promise : promise.error(function handleError() {
        toastService.add('error', gettext('Unable to retrieve secrets.'));
      });
    }

  }
}());
