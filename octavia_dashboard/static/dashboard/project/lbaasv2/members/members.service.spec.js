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

  describe('LBaaS v2 Members Service', function() {
    var service, $q, scope;

    beforeEach(module('horizon.framework.widgets.toast'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.app.core.openstack-service-api'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      $provide.value('horizon.app.core.openstack-service-api.lbaasv2', {
        getLoadBalancerStatusTree: function() {
          var deferred = $q.defer();
          var response = {
            data: {
              statuses: {
                loadbalancer: {
                  id: 'loadbalancer1',
                  listeners: [
                    {
                      id: 'listener0',
                      pools: []
                    },
                    {
                      id: 'listener1',
                      pools: [
                        {
                          id: 'pool0',
                          members: []
                        },
                        {
                          id: 'pool1',
                          members: [
                            {
                              id: 'member1',
                              operating_status: 'ONLINE',
                              provisioning_status: 'ACTIVE'
                            },
                            {
                              id: 'member2',
                              operating_status: 'OFFLINE',
                              provisioning_status: 'INACTIVE'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            }
          };
          deferred.resolve(response);
          return deferred.promise;
        }

      });
    }));

    beforeEach(inject(function ($injector) {
      service = $injector.get('horizon.dashboard.project.lbaasv2.members.service');
      $q = $injector.get('$q');
      scope = $injector.get('$rootScope').$new();
    }));

    it('should define service attributes', function() {
      expect(service.associateMemberStatuses).toBeDefined();
    });

    it('should correctly associate member health statuses', function() {
      var members = [
        { id: 'member1' },
        { id: 'member2' }
      ];

      service.associateMemberStatuses('loadbalancer1', 'listener1', 'pool1', members);
      scope.$apply();

      expect(members.length).toBe(2);
      expect(members[0].operating_status).toBe('ONLINE');
      expect(members[0].provisioning_status).toBe('ACTIVE');
      expect(members[1].operating_status).toBe('OFFLINE');
      expect(members[1].provisioning_status).toBe('INACTIVE');

    });

  });

})();
