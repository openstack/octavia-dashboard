# Copyright 2015 IBM Corp.
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
"""API over the neutron LBaaS v2 service.
"""

import _thread as thread
import time

from django.conf import settings
from django.views import generic

from horizon import conf
import octavia_dashboard
from openstack import connection
try:
    from openstack import config as occ
except ImportError:
    from os_client_config import config as occ
from openstack import exceptions

from openstack_dashboard.api import neutron
from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils

neutronclient = neutron.neutronclient


def _get_sdk_connection(request):
    """Creates an SDK connection based on the request.

    :param request: Django request object
    :returns: SDK connection object
    """
    # NOTE(mordred) Nothing says love like two inverted booleans
    # The config setting is NO_VERIFY which is, in fact, insecure.
    # get_one_cloud wants verify, so we pass 'not insecure' to verify.
    insecure = getattr(settings, 'OPENSTACK_SSL_NO_VERIFY', False)
    cacert = getattr(settings, 'OPENSTACK_SSL_CACERT', None)
    # Pass interface to honor 'OPENSTACK_ENDPOINT_TYPE'
    interface = getattr(settings, 'OPENSTACK_ENDPOINT_TYPE', 'publicURL')
    # Pass load_yaml_config as this is a Django service with its own config
    # and we don't want to accidentally pick up a clouds.yaml file. We want to
    # use the settings we're passing in.
    cloud_config = occ.OpenStackConfig(load_yaml_config=False).get_one_cloud(
        verify=not insecure,
        cacert=cacert,
        interface=interface,
        region_name=request.user.services_region,
        auth_type='token',
        auth=dict(
            project_id=request.user.project_id,
            project_domain_id=request.user.domain_id,
            token=request.user.token.unscoped_token,
            auth_url=request.user.endpoint),
        app_name='octavia-dashboard',
        app_version=octavia_dashboard.__version__)
    return connection.from_config(cloud_config=cloud_config)


def _sdk_object_to_list(object):
    """Converts an SDK generator object to a list of dictionaries.

    :param object: SDK generator object
    :returns: List of dictionaries
    """
    result_list = []
    for item in object:
        result_list.append(_get_sdk_object_dict(item))
    return result_list


def _get_sdk_object_dict(object):
    """Converts an SDK object to a dictionary.

    Fixes any SDK imposed object oddities.

    :param object: SDK object
    :returns: Dictionary
    """
    item_dict = object.to_dict()
    if 'is_admin_state_up' in item_dict:
        item_dict['admin_state_up'] = item_dict['is_admin_state_up']
    return item_dict


def poll_loadbalancer_status(request, loadbalancer_id, callback,
                             from_state='PENDING_UPDATE', to_state='ACTIVE',
                             callback_kwargs=None):
    """Poll for the status of the load balancer.

    Polls for the status of the load balancer and calls a function when the
    status changes to a specified state.

    :param request: django request object
    :param loadbalancer_id: id of the load balancer to poll
    :param callback: function to call when polling is complete
    :param from_state: initial expected state of the load balancer
    :param to_state: state to check for
    :param callback_kwargs: kwargs to pass into the callback function
    """
    interval = conf.HORIZON_CONFIG['ajax_poll_interval'] / 1000.0
    status = from_state
    while status == from_state:
        time.sleep(interval)
        conn = _get_sdk_connection(request)
        lb = conn.load_balancer.get_load_balancer(loadbalancer_id)
        status = lb.provisioning_status

    if status == to_state:
        kwargs = {'loadbalancer_id': loadbalancer_id}
        if callback_kwargs:
            kwargs.update(callback_kwargs)
        callback(request, **kwargs)


def _retry_on_conflict(conn, func, *args, retry_timeout=120, **kwargs):
    load_balancer_getter = kwargs.pop('load_balancer_getter')
    resource_id = kwargs.pop('resource_id')

    interval = conf.HORIZON_CONFIG['ajax_poll_interval'] / 1000.0

    load_balancer_id = load_balancer_getter(conn, resource_id)

    start = time.time()
    while time.time() - start < retry_timeout:
        lb = conn.load_balancer.get_load_balancer(load_balancer_id)
        if lb.provisioning_status == 'PENDING_UPDATE':
            time.sleep(interval)
            continue

        try:
            func(*args, **kwargs)
        except exceptions.ConflictException:
            # Still catching 409/Conflict as there might have multiple threads
            # waiting for a non-PENDING provisioning state
            time.sleep(interval)
            continue
        break


def retry_on_conflict(conn, func, *args, retry_timeout=120, **kwargs):
    load_balancer_getter = kwargs.pop('load_balancer_getter')
    resource_id = kwargs.pop('resource_id')

    try:
        func(*args, **kwargs)
    except exceptions.ConflictException:
        thread.start_new_thread(
            _retry_on_conflict,
            (conn, func, *args),
            {'retry_timeout': retry_timeout,
             'load_balancer_getter': load_balancer_getter,
             'resource_id': resource_id,
             **kwargs})


def listener_get_load_balancer_id(conn, listener_id):
    listener = conn.load_balancer.get_listener(listener_id)
    return listener.load_balancers[0]['id']


def l7_policy_get_load_balancer_id(conn, l7_policy_id):
    l7_policy = conn.load_balancer.get_l7_policy(l7_policy_id)
    listener = conn.load_balancer.get_listener(l7_policy.listener_id)
    return listener.load_balancers[0]['id']


def pool_get_load_balancer_id(conn, pool_id):
    pool = conn.load_balancer.get_pool(pool_id)
    return pool.loadbalancers[0]['id']


def health_monitor_get_load_balancer_id(conn, health_monitor_id):
    pool_id = conn.load_balancer.get_health_monitor(health_monitor_id)
    return pool_get_load_balancer_id(conn, pool_id)


def create_loadbalancer(request):
    data = request.DATA

    conn = _get_sdk_connection(request)
    build_kwargs = dict(
        project_id=request.user.project_id,
        vip_subnet_id=data['loadbalancer']['vip_subnet_id'],
        name=data['loadbalancer'].get('name'),
        description=data['loadbalancer'].get('description'),
        vip_address=data['loadbalancer'].get('vip_address'),
        admin_state_up=data['loadbalancer'].get('admin_state_up'),
    )
    flavor_id = data['loadbalancer'].get('flavor_id')
    if flavor_id:
        build_kwargs['flavor_id'] = flavor_id
    availability_zone = data['loadbalancer'].get('availability_zone')
    if availability_zone:
        build_kwargs['availability_zone'] = availability_zone

    loadbalancer = conn.load_balancer.create_load_balancer(**build_kwargs)
    if data.get('listener'):
        # There is work underway to add a new API to LBaaS v2 that will
        # allow us to pass in all information at once. Until that is
        # available we use a separate thread to poll for the load
        # balancer status and create the other resources when it becomes
        # active.
        args = (request, loadbalancer.id, create_listener)
        kwargs = {'from_state': 'PENDING_CREATE'}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)

    return _get_sdk_object_dict(loadbalancer)


def create_listener(request, **kwargs):
    """Create a new listener.

    """
    data = request.DATA

    try:
        default_tls_ref = data['certificates'][0]
    except (KeyError, IndexError):
        default_tls_ref = None

    conn = _get_sdk_connection(request)
    # TODO(johnsom) Add SNI support
    # https://bugs.launchpad.net/octavia/+bug/1714294
    listener = conn.load_balancer.create_listener(
        protocol=data['listener']['protocol'],
        protocol_port=data['listener']['protocol_port'],
        load_balancer_id=kwargs['loadbalancer_id'],
        name=data['listener'].get('name'),
        description=data['listener'].get('description'),
        connection_limit=data['listener'].get('connection_limit'),
        default_tls_container_ref=default_tls_ref,
        sni_container_refs=None,
        admin_state_up=data['listener'].get('admin_state_up'),
        insert_headers=data['listener'].get('insert_headers'),
        timeout_client_data=data['listener'].get('timeout_client_data'),
        timeout_member_connect=data['listener'].get('timeout_member_connect'),
        timeout_member_data=data['listener'].get('timeout_member_data'),
        timeout_tcp_inspect=data['listener'].get('timeout_tcp_inspect'),
        allowed_cidrs=data['listener'].get('allowed_cidrs'),
        # Replace empty string by None (uses default tls cipher string)
        tls_ciphers=data['listener'].get('tls_ciphers') or None,
    )

    if data.get('pool'):
        args = (request, kwargs['loadbalancer_id'], create_pool)
        kwargs = {'callback_kwargs': {'listener_id': listener.id}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)

    return _get_sdk_object_dict(listener)


def create_l7_policy(request, **kwargs):
    """Create a new l7 policy.

    """
    data = request.DATA

    conn = _get_sdk_connection(request)
    l7_policy = conn.load_balancer.create_l7_policy(
        action=data['l7policy']['action'],
        admin_state_up=data['l7policy'].get('admin_state_up'),
        description=data['l7policy'].get('description'),
        listener_id=kwargs['listener_id'],
        name=data['l7policy'].get('name'),
        position=data['l7policy'].get('position'),
        redirect_pool_id=data['l7policy'].get('redirect_pool_id'),
        redirect_url=data['l7policy'].get('redirect_url'),
    )

    return _get_sdk_object_dict(l7_policy)


def create_l7_rule(request, **kwargs):
    """Create a new l7 rule.

    """
    data = request.DATA

    conn = _get_sdk_connection(request)
    l7_rule = conn.load_balancer.create_l7_rule(
        admin_state_up=data['l7rule'].get('admin_state_up'),
        compare_type=data['l7rule']['compare_type'],
        invert=data['l7rule'].get('invert'),
        key=data['l7rule'].get('key'),
        l7_policy=kwargs['l7_policy_id'],
        type=data['l7rule']['type'],
        rule_value=data['l7rule']['rule_value'],
    )

    return _get_sdk_object_dict(l7_rule)


def create_pool(request, **kwargs):
    """Create a new pool.

    """
    data = request.DATA

    conn = _get_sdk_connection(request)
    pool = conn.load_balancer.create_pool(
        protocol=data['pool']['protocol'],
        lb_algorithm=data['pool']['lb_algorithm'],
        session_persistence=data['pool'].get('session_persistence'),
        listener_id=kwargs['listener_id'],
        loadbalancer_id=kwargs['loadbalancer_id'],
        name=data['pool'].get('name'),
        description=data['pool'].get('description'),
        admin_state_up=data['pool'].get('admin_state_up'),
        tls_enabled=data['pool'].get('tls_enabled'),
        # Replace empty string by None (uses default tls cipher string)
        tls_ciphers=data['pool'].get('tls_ciphers') or None,
    )

    if data.get('members'):
        args = (request, kwargs['loadbalancer_id'], add_member)
        kwargs = {'callback_kwargs': {'pool_id': pool.id,
                                      'index': 0}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)
    elif data.get('monitor'):
        args = (request, kwargs['loadbalancer_id'], create_health_monitor)
        kwargs = {'callback_kwargs': {'pool_id': pool.id}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)

    return _get_sdk_object_dict(pool)


def create_health_monitor(request, **kwargs):
    """Create a new health monitor for a pool.

    """
    data = request.DATA

    conn = _get_sdk_connection(request)
    health_mon = conn.load_balancer.create_health_monitor(
        type=data['monitor']['type'],
        delay=data['monitor']['delay'],
        timeout=data['monitor']['timeout'],
        max_retries=data['monitor']['max_retries'],
        max_retries_down=data['monitor']['max_retries_down'],
        pool_id=kwargs['pool_id'],
        http_method=data['monitor'].get('http_method'),
        url_path=data['monitor'].get('url_path'),
        expected_codes=data['monitor'].get('expected_codes'),
        admin_state_up=data['monitor'].get('admin_state_up'),
        name=data['monitor'].get('name')
    )

    return _get_sdk_object_dict(health_mon)


def create_flavor(request, **kwargs):
    """Create a new flavor.

    """
    data = request.DATA

    conn = _get_sdk_connection(request)
    flavor = conn.load_balancer.create_flavor(
        name=data['flavor']['name'],
        flavor_profile_id=data['flavor']['flavor_profile_id'],
        description=data['flavor'].get('description'),
        enabled=data['flavor'].get('enabled'),
    )

    return _get_sdk_object_dict(flavor)


def create_flavor_profile(request, **kwargs):
    """Create a new flavor profile.

    """
    data = request.DATA

    conn = _get_sdk_connection(request)
    flavor_profile = conn.load_balancer.create_flavor(
        name=data['flavor_profile']['name'],
        provider_name=data['flavor_profile']['provider_name'],
        flavor_data=data['flavor_profile']['flavor_data'],
    )

    return _get_sdk_object_dict(flavor_profile)


def add_member(request, **kwargs):
    """Add a member to a pool.

    """
    data = request.DATA
    members = data.get('members')
    pool_id = kwargs.get('pool_id')

    if kwargs.get('members_to_add'):
        members_to_add = kwargs['members_to_add']
        index = [members.index(member) for member in members
                 if member['id'] == members_to_add[0]][0]
        loadbalancer_id = data.get('loadbalancer_id')
    else:
        index = kwargs.get('index')
        loadbalancer_id = kwargs.get('loadbalancer_id')

    member = members[index]

    conn = _get_sdk_connection(request)
    monitor_address = member.get('monitor_address')
    member = conn.load_balancer.create_member(
        pool_id,
        address=member['address'],
        protocol_port=member['protocol_port'],
        subnet_id=member['subnet_id'],
        weight=member.get('weight'),
        monitor_address=monitor_address if monitor_address else None,
        monitor_port=member.get('monitor_port'),
        admin_state_up=member.get('admin_state_up'),
        backup=member.get('backup', False),
        name=member.get('name'),
    )

    index += 1
    if kwargs.get('members_to_add'):
        args = (request, loadbalancer_id, update_member_list)
        members_to_add = kwargs['members_to_add']
        members_to_add.pop(0)
        kwargs = {'callback_kwargs': {
            'existing_members': kwargs.get('existing_members'),
            'members_to_add': members_to_add,
            'members_to_delete': kwargs.get('members_to_delete'),
            'pool_id': pool_id}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)
    elif len(members) > index:
        args = (request, loadbalancer_id, add_member)
        kwargs = {'callback_kwargs': {'pool_id': pool_id,
                                      'index': index}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)
    elif data.get('monitor'):
        args = (request, loadbalancer_id, create_health_monitor)
        kwargs = {'callback_kwargs': {'pool_id': pool_id}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)

    return _get_sdk_object_dict(member)


def remove_member(request, **kwargs):
    """Remove a member from the pool.

    """
    data = request.DATA
    loadbalancer_id = data.get('loadbalancer_id')
    pool_id = kwargs.get('pool_id')

    if kwargs.get('members_to_delete'):
        members_to_delete = kwargs['members_to_delete']
        member_id = members_to_delete.pop(0)

        conn = _get_sdk_connection(request)
        conn.load_balancer.delete_member(member_id, pool_id,
                                         ignore_missing=True)

        args = (request, loadbalancer_id, update_member_list)
        kwargs = {'callback_kwargs': {
            'existing_members': kwargs.get('existing_members'),
            'members_to_add': kwargs.get('members_to_add'),
            'members_to_delete': members_to_delete,
            'pool_id': pool_id}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)


def update_loadbalancer(request, **kwargs):
    """Update a load balancer.

    """
    data = request.DATA
    loadbalancer_id = kwargs.get('loadbalancer_id')

    conn = _get_sdk_connection(request)
    loadbalancer = conn.load_balancer.update_load_balancer(
        loadbalancer_id,
        name=data['loadbalancer'].get('name'),
        description=data['loadbalancer'].get('description'),
        admin_state_up=data['loadbalancer'].get('admin_state_up'))

    return _get_sdk_object_dict(loadbalancer)


def update_listener(request, **kwargs):
    """Update a listener.

    """
    data = request.DATA
    listener_id = data['listener'].get('id')
    loadbalancer_id = data.get('loadbalancer_id')
    default_pool_id = data['listener'].get('default_pool_id')
    if not default_pool_id:
        default_pool_id = None
    else:
        default_pool_id = default_pool_id[:36]

    try:
        default_tls_ref = data['certificates'][0]
    except (KeyError, IndexError):
        default_tls_ref = None

    conn = _get_sdk_connection(request)
    listener = conn.load_balancer.update_listener(
        listener=listener_id,
        name=data['listener'].get('name'),
        description=data['listener'].get('description'),
        connection_limit=data['listener'].get('connection_limit'),
        default_tls_container_ref=default_tls_ref,
        sni_container_refs=None,
        admin_state_up=data['listener'].get('admin_state_up'),
        default_pool_id=default_pool_id,
        insert_headers=data['listener'].get('insert_headers'),
        timeout_client_data=data['listener'].get('timeout_client_data'),
        timeout_member_connect=data['listener'].get('timeout_member_connect'),
        timeout_member_data=data['listener'].get('timeout_member_data'),
        timeout_tcp_inspect=data['listener'].get('timeout_tcp_inspect'),
        allowed_cidrs=data['listener'].get('allowed_cidrs'),
        # Replace empty string by None (uses default tls cipher string)
        tls_ciphers=data['listener'].get('tls_ciphers') or None,
    )

    if data.get('pool'):
        args = (request, loadbalancer_id, update_pool)
        thread.start_new_thread(poll_loadbalancer_status, args)

    return _get_sdk_object_dict(listener)


def update_l7_policy(request, **kwargs):
    """Update a l7 policy.

    """
    data = request.DATA
    l7_policy_id = data['l7policy'].get('id')

    conn = _get_sdk_connection(request)
    l7_policy = conn.load_balancer.update_l7_policy(
        action=data['l7policy']['action'],
        admin_state_up=data['l7policy'].get('admin_state_up'),
        description=data['l7policy'].get('description'),
        l7_policy=l7_policy_id,
        name=data['l7policy'].get('name'),
        position=data['l7policy'].get('position'),
        redirect_pool_id=data['l7policy'].get('redirect_pool_id'),
        redirect_url=data['l7policy'].get('redirect_url'),
    )

    return _get_sdk_object_dict(l7_policy)


def update_l7_rule(request, **kwargs):
    """Update a l7 rule.

    """
    data = request.DATA
    l7_rule_id = data['l7rule'].get('id')

    conn = _get_sdk_connection(request)
    l7_rule = conn.load_balancer.update_l7_rule(
        admin_state_up=data['l7rule'].get('admin_state_up'),
        compare_type=data['l7rule']['compare_type'],
        invert=data['l7rule'].get('invert'),
        key=data['l7rule'].get('key'),
        l7_policy=kwargs['l7_policy_id'],
        l7rule=l7_rule_id,
        type=data['l7rule']['type'],
        rule_value=data['l7rule']['rule_value'],
    )

    return _get_sdk_object_dict(l7_rule)


def update_pool(request, **kwargs):
    """Update a pool.

    """
    data = request.DATA
    pool_id = data['pool'].get('id')
    loadbalancer_id = data.get('loadbalancer_id')

    conn = _get_sdk_connection(request)
    pool = conn.load_balancer.update_pool(
        pool=pool_id,
        lb_algorithm=data['pool']['lb_algorithm'],
        session_persistence=data['pool'].get('session_persistence'),
        name=data['pool'].get('name'),
        description=data['pool'].get('description'),
        admin_state_up=data['pool'].get('admin_state_up'),
        tls_enabled=data['pool'].get('tls_enabled'),
        # Replace empty string by None (uses default tls cipher string)
        tls_ciphers=data['pool'].get('tls_ciphers') or None,
    )

    # Assemble the lists of member id's to add and remove, if any exist
    request_member_data = data.get('members', [])

    existing_members = _sdk_object_to_list(conn.load_balancer.members(pool_id))

    (members_to_add, members_to_delete) = get_members_to_add_remove(
        request_member_data, existing_members)

    if members_to_add or members_to_delete:
        args = (request, loadbalancer_id, update_member_list)
        kwargs = {'callback_kwargs': {'existing_members': existing_members,
                                      'members_to_add': members_to_add,
                                      'members_to_delete': members_to_delete,
                                      'pool_id': pool_id}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)
    elif data.get('monitor'):
        args = (request, loadbalancer_id, update_monitor)
        thread.start_new_thread(poll_loadbalancer_status, args)

    return _get_sdk_object_dict(pool)


def update_monitor(request, **kwargs):
    """Update a health monitor.

    """
    data = request.DATA
    monitor_id = data['monitor']['id']

    conn = _get_sdk_connection(request)
    healthmonitor = conn.load_balancer.update_health_monitor(
        monitor_id,
        delay=data['monitor'].get('delay'),
        timeout=data['monitor'].get('timeout'),
        max_retries=data['monitor'].get('max_retries'),
        max_retries_down=data['monitor'].get('max_retries_down'),
        http_method=data['monitor'].get('http_method'),
        url_path=data['monitor'].get('url_path'),
        expected_codes=data['monitor'].get('expected_codes'),
        admin_state_up=data['monitor'].get('admin_state_up'),
        name=data['monitor'].get('name')
    )

    return _get_sdk_object_dict(healthmonitor)


def update_flavor(request, **kwargs):
    """Update a flavor.

    """
    data = request.DATA
    flavor_id = data['flavor']['id']

    conn = _get_sdk_connection(request)
    flavor = conn.load_balancer.update_flavor(
        flavor_id,
        name=data['flavor'].get('name'),
        description=data['flavor'].get('description'),
        enabled=data['flavor'].get('enabled'),
    )

    return _get_sdk_object_dict(flavor)


def update_flavor_profile(request, **kwargs):
    """Update a flavor profile.

    """
    data = request.DATA
    flavor_profile_id = data['flavor_profile']['id']

    conn = _get_sdk_connection(request)
    flavor_profile = conn.load_balancer.update_flavor_profile(
        flavor_profile_id,
        name=data['flavor_profile'].get('name'),
        provider_name=data['flavor_profile'].get('provider_name'),
        flavor_data=data['flavor_profile'].get('flavor_data'),
    )

    return _get_sdk_object_dict(flavor_profile)


def update_member_list(request, **kwargs):
    """Update the list of members by adding or removing the necessary members.

    """
    data = request.DATA
    loadbalancer_id = data.get('loadbalancer_id')
    pool_id = kwargs.get('pool_id')
    existing_members = kwargs.get('existing_members')
    members_to_add = kwargs.get('members_to_add')
    members_to_delete = kwargs.get('members_to_delete')

    if members_to_delete:
        kwargs = {'existing_members': existing_members,
                  'members_to_add': members_to_add,
                  'members_to_delete': members_to_delete,
                  'pool_id': pool_id}
        remove_member(request, **kwargs)
    elif members_to_add:
        kwargs = {'existing_members': existing_members,
                  'members_to_add': members_to_add,
                  'members_to_delete': members_to_delete,
                  'pool_id': pool_id}
        add_member(request, **kwargs)
    elif data.get('monitor'):
        args = (request, loadbalancer_id, update_monitor)
        thread.start_new_thread(poll_loadbalancer_status, args)


def get_members_to_add_remove(request_member_data, existing_members):
    new_member_ids = [member['id'] for member in request_member_data]
    existing_member_ids = [member['id'] for member in existing_members]
    members_to_add = [member_id for member_id in new_member_ids
                      if member_id not in existing_member_ids]
    members_to_delete = [member_id for member_id in existing_member_ids
                         if member_id not in new_member_ids]
    return members_to_add, members_to_delete


def add_floating_ip_info(request, loadbalancers):
    """Add floating IP address info to each load balancer.

    """
    floating_ips = neutron.tenant_floating_ip_list(request)
    for lb in loadbalancers:
        floating_ip = {}
        associated_ip = next((fip for fip in floating_ips
                              if fip['port_id'] == lb['vip_port_id']), None)
        if associated_ip is not None:
            floating_ip['id'] = associated_ip['id']
            floating_ip['ip'] = associated_ip['ip']
        lb['floating_ip'] = floating_ip


@urls.register
class LoadBalancers(generic.View):
    """API for load balancers.

    """
    url_regex = r'lbaas/loadbalancers/$'

    @rest_utils.ajax()
    def get(self, request):
        """List load balancers for current project.

        The listing result is an object with property "items".
        """
        conn = _get_sdk_connection(request)
        lb_list = _sdk_object_to_list(conn.load_balancer.load_balancers(
            project_id=request.user.project_id))
        if request.GET.get('full') and neutron.floating_ip_supported(request):
            add_floating_ip_info(request, lb_list)
        return {'items': lb_list}

    @rest_utils.ajax()
    def post(self, request):
        """Create a new load balancer.

        Creates a new load balancer as well as other optional resources such as
        a listener, pool, monitor, etc.
        """
        return create_loadbalancer(request)


@urls.register
class LoadBalancer(generic.View):
    """API for retrieving, updating, and deleting a single load balancer.

    """
    url_regex = r'lbaas/loadbalancers/(?P<loadbalancer_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, loadbalancer_id):
        """Get a specific load balancer.

        http://localhost/api/lbaas/loadbalancers/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        conn = _get_sdk_connection(request)
        loadbalancer = conn.load_balancer.find_load_balancer(loadbalancer_id)
        loadbalancer_dict = _get_sdk_object_dict(loadbalancer)
        if request.GET.get('full') and neutron.floating_ip_supported(request):
            add_floating_ip_info(request, [loadbalancer_dict])
        return loadbalancer_dict

    @rest_utils.ajax()
    def put(self, request, loadbalancer_id):
        """Edit a load balancer.

        """
        kwargs = {'loadbalancer_id': loadbalancer_id}
        update_loadbalancer(request, **kwargs)

    @rest_utils.ajax()
    def delete(self, request, loadbalancer_id):
        """Delete a specific load balancer.

        http://localhost/api/lbaas/loadbalancers/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        conn = _get_sdk_connection(request)
        conn.load_balancer.delete_load_balancer(loadbalancer_id,
                                                ignore_missing=True,
                                                cascade=True)


@urls.register
class Listeners(generic.View):
    """API for load balancer listeners.

    """
    url_regex = r'lbaas/listeners/$'

    @rest_utils.ajax()
    def get(self, request):
        """List of listeners for the current project.

        The listing result is an object with property "items".
        """
        loadbalancer_id = request.GET.get('loadbalancerId')
        conn = _get_sdk_connection(request)
        listener_list = _sdk_object_to_list(conn.load_balancer.listeners(
            project_id=request.user.project_id))

        if loadbalancer_id:
            listener_list = self._filter_listeners(listener_list,
                                                   loadbalancer_id)
        return {'items': listener_list}

    @rest_utils.ajax()
    def post(self, request):
        """Create a new listener.

        Creates a new listener as well as other optional resources such as
        a pool, members, and health monitor.
        """
        kwargs = {'loadbalancer_id': request.DATA.get('loadbalancer_id')}
        return create_listener(request, **kwargs)

    def _filter_listeners(self, listener_list, loadbalancer_id):
        filtered_listeners = []

        for listener in listener_list:
            if listener['load_balancers'][0]['id'] == loadbalancer_id:
                filtered_listeners.append(listener)

        return filtered_listeners


@urls.register
class Listener(generic.View):
    """API for retrieving, updating, and deleting a single listener.

    """
    url_regex = r'lbaas/listeners/(?P<listener_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, listener_id):
        """Get a specific listener.

        If the param 'includeChildResources' is passed in as a truthy value,
        the details of all resources that exist under the listener will be
        returned along with the listener details.

        http://localhost/api/lbaas/listeners/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        conn = _get_sdk_connection(request)
        listener = conn.load_balancer.find_listener(listener_id)
        listener = _get_sdk_object_dict(listener)

        if request.GET.get('includeChildResources'):
            resources = {}
            resources['listener'] = listener

            if listener.get('default_pool_id'):
                pool_id = listener['default_pool_id']
                pool = conn.load_balancer.find_pool(pool_id)
                pool = _get_sdk_object_dict(pool)
                resources['pool'] = pool

                if pool.get('members'):
                    member_list = _sdk_object_to_list(
                        conn.load_balancer.members(pool_id))
                    resources['members'] = member_list

                if pool.get('health_monitor_id'):
                    monitor_id = pool['health_monitor_id']
                    monitor = conn.load_balancer.find_health_monitor(
                        monitor_id)
                    monitor = _get_sdk_object_dict(monitor)
                    resources['monitor'] = monitor

            return resources
        else:
            return listener

    @rest_utils.ajax()
    def put(self, request, listener_id):
        """Edit a listener as well as any resources below it.

        """
        kwargs = {'listener_id': listener_id}
        update_listener(request, **kwargs)

    @rest_utils.ajax()
    def delete(self, request, listener_id):
        """Delete a specific listener.

        http://localhost/api/lbaas/listeners/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        conn = _get_sdk_connection(request)
        retry_on_conflict(
            conn, conn.load_balancer.delete_listener,
            listener_id, ignore_missing=True,
            load_balancer_getter=listener_get_load_balancer_id,
            resource_id=listener_id)


@urls.register
class L7Policies(generic.View):
    """API for load balancer l7 policies.

    """
    url_regex = r'lbaas/l7policies/$'

    @rest_utils.ajax()
    def get(self, request):
        """List of l7 policies for the current project.

        The listing result is an object with property "items".
        """
        listener_id = request.GET.get('listenerId')
        conn = _get_sdk_connection(request)
        l7_policy_list = _sdk_object_to_list(conn.load_balancer.l7_policies(
            listener_id=listener_id))
        return {'items': l7_policy_list}

    @rest_utils.ajax()
    def post(self, request):
        """Create a new l7 policy.

        Creates a new l7 policy as well as other optional resources such as
        l7 rules.
        """
        kwargs = {'listener_id': request.DATA.get('parentResourceId')}
        return create_l7_policy(request, **kwargs)


@urls.register
class L7Policy(generic.View):
    """API for retrieving a single l7 policy.

    """
    url_regex = r'lbaas/l7policies/(?P<l7_policy_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, l7_policy_id):
        """Get a specific l7 policy.

        If the param 'includeChildResources' is passed in as a truthy value,
        the details of all resources that exist under the l7 policy will be
        returned along with the l7 policy details.

        http://localhost/api/lbaas/l7policies/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        conn = _get_sdk_connection(request)
        l7_policy = conn.load_balancer.find_l7_policy(l7_policy_id)
        l7_policy = _get_sdk_object_dict(l7_policy)

        if request.GET.get('includeChildResources'):
            resources = {}

            if l7_policy.get('rules'):
                l7_rules_list = _sdk_object_to_list(
                    conn.load_balancer.l7_rules(l7_policy_id))
                l7_policy['rules'] = l7_rules_list

            resources['l7policy'] = l7_policy

            return resources
        else:
            return l7_policy

    @rest_utils.ajax()
    def put(self, request, l7_policy_id):
        """Edit a l7 policy as well as any resources below it.

        """
        kwargs = {'l7_policy_id': l7_policy_id}
        update_l7_policy(request, **kwargs)

    @rest_utils.ajax()
    def delete(self, request, l7_policy_id):
        """Delete a specific l7 policy.

        http://localhost/api/lbaas/l7policies/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        conn = _get_sdk_connection(request)
        retry_on_conflict(
            conn, conn.load_balancer.delete_l7_policy,
            l7_policy_id,
            load_balancer_getter=l7_policy_get_load_balancer_id,
            resource_id=l7_policy_id)


@urls.register
class L7Rules(generic.View):
    """API for load balancer l7 rules.

    """
    url_regex = r'lbaas/l7policies/(?P<l7_policy_id>[^/]+)/l7rules/$'

    @rest_utils.ajax()
    def get(self, request, l7_policy_id):
        """List of l7 rules for the current project.

        The listing result is an object with property "items".
        """
        conn = _get_sdk_connection(request)
        l7_rule_list = _sdk_object_to_list(conn.load_balancer.l7_rules(
            l7_policy_id))
        return {'items': l7_rule_list}

    @rest_utils.ajax()
    def post(self, request, l7_policy_id):
        """Create a new l7 rule.

        Creates a new l7 rule as well as other optional resources such as
        l7 rules.
        """
        kwargs = {'l7_policy_id': l7_policy_id}
        return create_l7_rule(request, **kwargs)


@urls.register
class L7Rule(generic.View):
    """API for retrieving a single l7 rule.

    """
    url_regex = (
        r'lbaas/l7policies/(?P<l7_policy_id>[^/]+)'
        r'/l7rules/(?P<l7_rule_id>[^/]+)/$'
    )

    @rest_utils.ajax()
    def get(self, request, l7_rule_id, l7_policy_id):
        """Get a specific l7 rule."""
        conn = _get_sdk_connection(request)
        l7_rule = conn.load_balancer.find_l7_rule(l7_rule_id, l7_policy_id)
        return _get_sdk_object_dict(l7_rule)

    @rest_utils.ajax()
    def put(self, request, l7_rule_id, l7_policy_id):
        """Edit a specific l7 rule."""
        kwargs = {'l7_rule_id': l7_rule_id, 'l7_policy_id': l7_policy_id}
        update_l7_rule(request, **kwargs)

    @rest_utils.ajax()
    def delete(self, request, l7_rule_id, l7_policy_id):
        """Delete a specific l7 rule."""
        conn = _get_sdk_connection(request)
        retry_on_conflict(
            conn, conn.load_balancer.delete_l7_rule,
            l7_rule_id, l7_policy_id,
            load_balancer_getter=l7_policy_get_load_balancer_id,
            resource_id=l7_policy_id)


@urls.register
class Pools(generic.View):
    """API for load balancer pools.

    """
    url_regex = r'lbaas/pools/$'

    @rest_utils.ajax()
    def get(self, request):
        """List of pools for the current project.

        The listing result is an object with property "items".
        """
        loadbalancer_id = request.GET.get('loadbalancerId')
        listener_id = request.GET.get('listenerId')
        conn = _get_sdk_connection(request)
        pool_list = _sdk_object_to_list(conn.load_balancer.pools(
            project_id=request.user.project_id))

        if loadbalancer_id or listener_id:
            pool_list = self._filter_pools(pool_list,
                                           loadbalancer_id,
                                           listener_id)
        return {'items': pool_list}

    @rest_utils.ajax()
    def post(self, request):
        """Create a new pool.

        Creates a new pool as well as other optional resources such as
        members and health monitor.
        """
        kwargs = {'loadbalancer_id': request.DATA.get('loadbalancer_id'),
                  'listener_id': request.DATA.get('parentResourceId')}
        return create_pool(request, **kwargs)

    def _filter_pools(self, pool_list, loadbalancer_id, listener_id):
        filtered_pools = []

        for pool in pool_list:
            if loadbalancer_id:
                if pool['loadbalancers'][0]['id'] == loadbalancer_id:
                    if listener_id:
                        if (pool['listeners'] and
                                pool['listeners'][0]['id'] == listener_id):
                            filtered_pools.append(pool)
                    else:
                        filtered_pools.append(pool)
            elif (pool['listeners'] and
                  pool['listeners'][0]['id'] == listener_id):
                filtered_pools.append(pool)

        return filtered_pools


@urls.register
class Pool(generic.View):
    """API for retrieving a single pool.

    """
    url_regex = r'lbaas/pools/(?P<pool_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, pool_id):
        """Get a specific pool.

        If the param 'includeChildResources' is passed in as a truthy value,
        the details of all resources that exist under the pool will be
        returned along with the pool details.

        http://localhost/api/lbaas/pools/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        conn = _get_sdk_connection(request)
        pool = conn.load_balancer.find_pool(pool_id)
        pool = _get_sdk_object_dict(pool)

        if request.GET.get('includeChildResources'):
            resources = {}
            resources['pool'] = pool

            if pool.get('members'):
                member_list = _sdk_object_to_list(
                    conn.load_balancer.members(pool_id))
                resources['members'] = member_list

            if pool.get('health_monitor_id'):
                monitor_id = pool['health_monitor_id']
                monitor = conn.load_balancer.find_health_monitor(
                    monitor_id)
                monitor = _get_sdk_object_dict(monitor)
                resources['monitor'] = monitor

            return resources
        else:
            return pool

    @rest_utils.ajax()
    def put(self, request, pool_id):
        """Edit a listener as well as any resources below it.

        """
        kwargs = {'pool_id': pool_id}
        update_pool(request, **kwargs)

    @rest_utils.ajax()
    def delete(self, request, pool_id):
        """Delete a specific pool.

        http://localhost/api/lbaas/pools/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        conn = _get_sdk_connection(request)
        retry_on_conflict(
            conn, conn.load_balancer.delete_pool,
            pool_id,
            load_balancer_getter=pool_get_load_balancer_id,
            resource_id=pool_id)


@urls.register
class Members(generic.View):
    """API for load balancer members.

    """
    url_regex = r'lbaas/pools/(?P<pool_id>[^/]+)/members/$'

    @rest_utils.ajax()
    def get(self, request, pool_id):
        """List of members for the current project.

        The listing result is an object with property "items".
        """
        conn = _get_sdk_connection(request)
        members_list = _sdk_object_to_list(conn.load_balancer.members(pool_id))
        return {'items': members_list}

    @rest_utils.ajax()
    def put(self, request, pool_id):
        """Update the list of members for the current project.

        """
        # Assemble the lists of member id's to add and remove, if any exist
        request_member_data = request.DATA.get('members', [])

        conn = _get_sdk_connection(request)
        existing_members = _sdk_object_to_list(
            conn.load_balancer.members(pool_id))

        (members_to_add, members_to_delete) = get_members_to_add_remove(
            request_member_data, existing_members)

        if members_to_add or members_to_delete:
            kwargs = {'existing_members': existing_members,
                      'members_to_add': members_to_add,
                      'members_to_delete': members_to_delete,
                      'pool_id': pool_id}
            update_member_list(request, **kwargs)


@urls.register
class Member(generic.View):
    """API for retrieving a single member.

    """
    url_regex = r'lbaas/pools/(?P<pool_id>[^/]+)' + \
                '/members/(?P<member_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, member_id, pool_id):
        """Get a specific member belonging to a specific pool.

        """
        conn = _get_sdk_connection(request)
        member = conn.load_balancer.find_member(member_id, pool_id)
        return _get_sdk_object_dict(member)

    @rest_utils.ajax()
    def delete(self, request, member_id, pool_id):
        """Delete a specific member belonging to a specific pool.

        """
        conn = _get_sdk_connection(request)
        retry_on_conflict(
            conn, conn.load_balancer.delete_member,
            member_id, pool_id,
            load_balancer_getter=pool_get_load_balancer_id,
            resource_id=pool_id)

    @rest_utils.ajax()
    def put(self, request, member_id, pool_id):
        """Edit a pool member.

        """
        data = request.DATA
        conn = _get_sdk_connection(request)
        monitor_address = data.get('monitor_address')
        member = conn.load_balancer.update_member(
            member_id, pool_id, weight=data.get('weight'),
            monitor_address=monitor_address if monitor_address else None,
            monitor_port=data.get('monitor_port'),
            admin_state_up=data.get('admin_state_up'),
            backup=data.get('backup', False),
            name=data.get('name'),
        )
        return _get_sdk_object_dict(member)


@urls.register
class HealthMonitors(generic.View):
    """API for load balancer pool health monitors.

    """
    url_regex = r'lbaas/healthmonitors/$'

    @rest_utils.ajax()
    def get(self, request):
        """List of health monitors for the current project.

        The listing result is an object with property "items".
        """
        pool_id = request.GET.get('poolId')
        conn = _get_sdk_connection(request)
        health_monitor_list = _sdk_object_to_list(
            conn.load_balancer.health_monitors(
                project_id=request.user.project_id
            )
        )

        if pool_id:
            health_monitor_list = self._filter_health_monitors(
                health_monitor_list,
                pool_id)
        return {'items': health_monitor_list}

    @rest_utils.ajax()
    def post(self, request):
        """Create a new health monitor.

        """
        kwargs = {'loadbalancer_id': request.DATA.get('loadbalancer_id'),
                  'pool_id': request.DATA.get('parentResourceId')}
        return create_health_monitor(request, **kwargs)

    def _filter_health_monitors(self, health_monitor_list, pool_id):
        filtered_health_monitors = []

        for health_monitor in health_monitor_list:
            if health_monitor['pools'][0]['id'] == pool_id:
                filtered_health_monitors.append(health_monitor)

        return filtered_health_monitors


@urls.register
class HealthMonitor(generic.View):
    """API for retrieving a single health monitor.

    """
    url_regex = r'lbaas/healthmonitors/(?P<health_monitor_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, health_monitor_id):
        """Get a specific health monitor.

        """
        conn = _get_sdk_connection(request)
        health_mon = conn.load_balancer.find_health_monitor(health_monitor_id)
        return _get_sdk_object_dict(health_mon)

    @rest_utils.ajax()
    def delete(self, request, health_monitor_id):
        """Delete a specific health monitor.

        http://localhost/api/lbaas/healthmonitors/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        conn = _get_sdk_connection(request)
        retry_on_conflict(
            conn, conn.load_balancer.delete_health_monitor,
            health_monitor_id,
            ignore_missing=True,
            load_balancer_getter=health_monitor_get_load_balancer_id,
            resource_id=health_monitor_id)

    @rest_utils.ajax()
    def put(self, request, health_monitor_id):
        """Edit a health monitor.

        """
        update_monitor(request)


@urls.register
class Flavors(generic.View):
    """API for load balancer flavors.

    """
    url_regex = r'lbaas/flavors/$'

    @rest_utils.ajax()
    def get(self, request):
        """List of flavors for the current project.

        The listing result is an object with property "items".
        """
        conn = _get_sdk_connection(request)
        flavor_list = _sdk_object_to_list(
            conn.load_balancer.flavors()
        )

        return {'items': flavor_list}

    @rest_utils.ajax()
    def post(self, request):
        """Create a new flavor.

        """
        kwargs = {
            'flavor': request.DATA.get('flavor')
        }
        return create_flavor(request, **kwargs)


@urls.register
class Flavor(generic.View):
    """API for retrieving a single flavor.

    """
    url_regex = r'lbaas/flavors/(?P<flavor_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, flavor_id):
        """Get a specific flavor.

        """
        conn = _get_sdk_connection(request)
        flavor = conn.load_balancer.find_flavor(flavor_id)
        return _get_sdk_object_dict(flavor)

    @rest_utils.ajax()
    def delete(self, request, flavor_id):
        """Delete a specific flavor.

        http://localhost/api/lbaas/flavors/3971d368-ca9b-4770-929a-3adca5bf89eb
        """
        conn = _get_sdk_connection(request)
        conn.load_balancer.delete_flavor(flavor_id,
                                         ignore_missing=True)

    @rest_utils.ajax()
    def put(self, request, flavor_id):
        """Edit a flavor.

        """
        update_flavor(request)


@urls.register
class FlavorProfiles(generic.View):
    """API for load balancer flavor profiles.

    """
    url_regex = r'lbaas/flavorprofiles/$'

    @rest_utils.ajax()
    def get(self, request):
        """List of flavor profiles for the current project.

        The listing result is an object with property "items".
        """
        conn = _get_sdk_connection(request)
        flavor_profile_list = _sdk_object_to_list(
            conn.load_balancer.flavor_profiles()
        )

        return {'items': flavor_profile_list}

    @rest_utils.ajax()
    def post(self, request):
        """Create a new flavor_profile.

        """
        kwargs = {
            'flavor_profile': request.DATA.get('flavor_profile')
        }
        return create_flavor_profile(request, **kwargs)


@urls.register
class FlavorProfile(generic.View):
    """API for retrieving a single flavor profile.

    """
    url_regex = r'lbaas/flavorprofiles/(?P<flavor_profile_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, flavor_profile_id):
        """Get a specific flavor profile.

        """
        conn = _get_sdk_connection(request)
        flavor_profile = conn.load_balancer.find_flavor_profile(
            flavor_profile_id)
        return _get_sdk_object_dict(flavor_profile)

    @rest_utils.ajax()
    def delete(self, request, flavor_profile_id):
        """Delete a specific flavor profile.

        http://localhost/api/lbaas/flavorprofiles/e8150eab-aefa-42cc-867e-3fb336da52bd
        """
        conn = _get_sdk_connection(request)
        conn.load_balancer.delete_flavor_profile(flavor_profile_id,
                                                 ignore_missing=True)

    @rest_utils.ajax()
    def put(self, request, flavor_profile_id):
        """Edit a flavor profile.

        """
        update_flavor_profile(request)


@urls.register
class AvailabilityZones(generic.View):
    """API for load balancer availability zones.

    """
    url_regex = r'lbaas/availabilityzones/$'

    @rest_utils.ajax()
    def get(self, request):
        """List of availability zones for the current project.

        The listing result is an object with property "items".
        """
        conn = _get_sdk_connection(request)
        availability_zone_list = _sdk_object_to_list(
            conn.load_balancer.availability_zones()
        )

        return {'items': availability_zone_list}
