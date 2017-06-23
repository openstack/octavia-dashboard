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

  describe('LBaaS v2 Load Balancers Service', function() {
    var service, $q, $scope;

    beforeEach(module('horizon.framework.widgets.toast'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      $provide.value('horizon.app.core.openstack-service-api.lbaasv2', {
        getLoadBalancer: function(index) {
          var loadbalancers = [{ provisioning_status: 'ACTIVE' },
                               { provisioning_status: 'PENDING_UPDATE' }];

          var deferred = $q.defer();
          deferred.resolve({ data: loadbalancers[index] });

          return deferred.promise;
        }
      });
    }));

    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      $scope = $injector.get('$rootScope').$new();
      service = $injector.get('horizon.dashboard.project.lbaasv2.loadbalancers.service');
    }));

    it('should define value mappings', function() {
      expect(service.operatingStatus).toBeDefined();
      expect(service.provisioningStatus).toBeDefined();
    });

    it('should allow checking status of load balancer', function() {
      var active = null;
      service.isActionable(0).then(function() {
        active = true;
      });
      $scope.$apply();
      expect(active).toBe(true);

      active = null;
      service.isActionable(1).then(angular.noop, function() {
        active = false;
      });
      $scope.$apply();
      expect(active).toBe(false);
    });
  });

})();
