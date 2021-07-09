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
(function() {
  'use strict';

  describe('Barbican API', function() {
    var testCall, service;
    var apiService = {};
    var toastService = {};

    beforeEach(module('horizon.mock.openstack-service-api', function($provide, initServices) {
      testCall = initServices($provide, apiService, toastService);
    }));

    beforeEach(module('horizon.app.core.openstack-service-api'));

    beforeEach(
        inject(['horizon.app.core.openstack-service-api.octavia-barbican',
                function(octaviaBarbicanAPI) {
                  service = octaviaBarbicanAPI;
                }]));

    it('defines the service', function() {
      expect(service).toBeDefined();
    });

    var tests = [
      {
        func: "getCertificates",
        method: "get",
        path: "/api/octavia-barbican/certificates/",
        error: "Unable to retrieve SSL certificates."
      },
      {
        func: "getSecrets",
        method: "get",
        path: "/api/octavia-barbican/secrets/",
        error: "Unable to retrieve secrets."
      }
    ];

    // Iterate through the defined tests and apply as Jasmine specs.
    angular.forEach(tests, function(params) {
      it('defines the ' + params.func + ' call properly', function() {
        var callParams = [apiService, service, toastService, params];
        testCall.apply(this, callParams);
      });
    });

    it('supresses the error if instructed for getCertificates', function() {
      spyOn(apiService, 'get').and.returnValue("promise");
      expect(service.getCertificates(true)).toBe("promise");
    });

    it('supresses the error if instructed for getSecrets', function() {
      spyOn(apiService, 'get').and.returnValue("promise");
      expect(service.getSecrets(true)).toBe("promise");
    });

  });

})();
