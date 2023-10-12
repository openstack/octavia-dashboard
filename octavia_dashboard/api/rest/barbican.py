# Copyright 2016 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""API over the barbican service.
"""

from django.views import generic
from octavia_dashboard.sdk_connection import get_sdk_connection

from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils


@urls.register
class SSLCertificates(generic.View):
    """API for working with SSL certificate containers.

    """
    url_regex = r'octavia-barbican/certificates/$'

    @rest_utils.ajax()
    def get(self, request):
        """List certificate containers.

        The listing result is an object with property "items".
        """
        conn = get_sdk_connection(request)
        containers = list(conn.key_manager.containers(
            type='certificate'))
        return {'items': containers}


@urls.register
class Secrets(generic.View):
    """API for working with secrets.

    """
    url_regex = r'octavia-barbican/secrets/$'

    @rest_utils.ajax()
    def get(self, request):
        """List secrets.

        The listing result is an object with property "items".
        """
        conn = get_sdk_connection(request)
        secrets = list(conn.key_manager.secrets())
        return {'items': secrets}
