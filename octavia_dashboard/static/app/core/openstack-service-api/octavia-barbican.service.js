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
    .factory('horizon.app.core.openstack-service-api.octavia-barbican', octaviaBarbicanAPI);

  octaviaBarbicanAPI.$inject = [
    'horizon.framework.util.http.service',
    'horizon.framework.widgets.toast.service'
  ];

  /**
   * @ngdoc service
   * @name horizon.app.core.openstack-service-api.octavia-barbican
   * @description Provides direct pass through to barbican with NO abstraction.
   * @param apiService The horizon core API service.
   * @param toastService The horizon toast service.
   * @returns The octavia barbican service API.
   */

  function octaviaBarbicanAPI(apiService, toastService) {
    var service = {
      getCertificates: getCertificates,
      getSecrets: getSecrets
    };

    return service;

    ///////////////

    // SSL Certificate Containers

    /**
     * @name horizon.app.core.openstack-service-api.octavia-barbican.getCertificates
     * @description
     * Get a list of SSL certificate containers.
     *
     * @param {boolean} quiet
     * The listing result is an object with property "items". Each item is
     * a certificate container.
     */

    function getCertificates(quiet) {
      var promise = apiService.get('/api/octavia-barbican/certificates/');
      return quiet ? promise : promise.catch(function handleError() {
        toastService.add('error', gettext('Unable to retrieve SSL certificates.'));
      });
    }

    // Secrets

    /**
     * @name horizon.app.core.openstack-service-api.octavia-barbican.getSecrets
     * @description
     * Get a list of secrets.
     *
     * @param {boolean} quiet
     * The listing result is an object with property "items". Each item is
     * a secret.
     */

    function getSecrets(quiet) {
      var promise = apiService.get('/api/octavia-barbican/secrets/');
      return quiet ? promise : promise.catch(function handleError() {
        toastService.add('error', gettext('Unable to retrieve secrets.'));
      });
    }

  }
}());
