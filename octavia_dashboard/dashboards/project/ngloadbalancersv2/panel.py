#    (c) Copyright 2015 Hewlett-Packard Development Company, L.P.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

from oslo_log import log as logging

from django.utils.translation import ugettext_lazy as _

import horizon

from openstack_dashboard.api import neutron

LOG = logging.getLogger(__name__)


class NGLoadBalancers(horizon.Panel):
    name = _("Load Balancers")
    slug = 'ngloadbalancersv2'
    permissions = ('openstack.services.network',)

    def allowed(self, context):
        request = context['request']
        try:
            if not neutron.is_service_enabled(request,
                                              config_name='enable_lb',
                                              ext_name='lbaasv2'):
                return False
        except Exception:
            LOG.error("Call to list enabled services failed. This is likely "
                      "due to a problem communicating with the Neutron "
                      "endpoint. Load Balancers v2 panel will not be "
                      "displayed")
            return False
        return super(NGLoadBalancers, self).allowed(context)
