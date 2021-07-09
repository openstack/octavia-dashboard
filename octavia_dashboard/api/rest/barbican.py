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

from barbicanclient import client as barbican_client
from django.conf import settings
from django.views import generic
from keystoneclient.auth import token_endpoint
from keystoneclient import session

from horizon.utils.memoized import memoized  # noqa
from openstack_auth import utils as auth_utils

from openstack_dashboard.api import base
from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils


@memoized
def barbicanclient(request):
    region = request.user.services_region
    endpoint = base.url_for(request, 'key-manager')
    auth_url, _ = auth_utils.fix_auth_url_version_prefix(
        settings.OPENSTACK_KEYSTONE_URL)
    auth = token_endpoint.Token(auth_url, request.user.token.id)

    insecure = getattr(settings, 'OPENSTACK_SSL_NO_VERIFY', False)
    cacert = getattr(settings, 'OPENSTACK_SSL_CACERT', None)
    # If 'insecure' is True, 'verify' is False in all cases; otherwise
    # pass the cacert path if it is present, or True if no cacert.
    verify = not insecure and (cacert or True)
    return barbican_client.Client(session=session.Session(auth=auth,
                                                          verify=verify),
                                  endpoint=endpoint,
                                  region_name=region)


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
        limit = getattr(settings, 'API_RESULT_LIMIT', 1000)
        containers = barbicanclient(request).containers
        params = {'limit': limit, 'type': 'certificate'}
        result = containers._api.get('containers', params=params)
        return {'items': result.get('containers')}


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
        limit = getattr(settings, 'API_RESULT_LIMIT', 1000)
        secrets = barbicanclient(request).secrets
        params = {'limit': limit}
        result = secrets._api.get('secrets', params=params)
        return {'items': result.get('secrets')}
