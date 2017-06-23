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

from six.moves import _thread as thread
from time import sleep

from django.views import generic

from horizon import conf

from openstack_dashboard.api import network
from openstack_dashboard.api import neutron
from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils

neutronclient = neutron.neutronclient


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
        sleep(interval)
        lb = neutronclient(request).show_loadbalancer(
            loadbalancer_id).get('loadbalancer')
        status = lb['provisioning_status']

    if status == to_state:
        kwargs = {'loadbalancer_id': loadbalancer_id}
        if callback_kwargs:
            kwargs.update(callback_kwargs)
        callback(request, **kwargs)


def create_loadbalancer(request):
    data = request.DATA
    spec = {
        'vip_subnet_id': data['loadbalancer']['subnet']
    }
    if data['loadbalancer'].get('name'):
        spec['name'] = data['loadbalancer']['name']
    if data['loadbalancer'].get('description'):
        spec['description'] = data['loadbalancer']['description']
    if data['loadbalancer'].get('ip'):
        spec['vip_address'] = data['loadbalancer']['ip']
    loadbalancer = neutronclient(request).create_loadbalancer(
        {'loadbalancer': spec}).get('loadbalancer')
    if data.get('listener'):
        # There is work underway to add a new API to LBaaS v2 that will
        # allow us to pass in all information at once. Until that is
        # available we use a separate thread to poll for the load
        # balancer status and create the other resources when it becomes
        # active.
        args = (request, loadbalancer['id'], create_listener)
        kwargs = {'from_state': 'PENDING_CREATE'}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)
    return loadbalancer


def create_listener(request, **kwargs):
    """Create a new listener.

    """
    data = request.DATA
    listenerSpec = {
        'protocol': data['listener']['protocol'],
        'protocol_port': data['listener']['port'],
        'loadbalancer_id': kwargs['loadbalancer_id']
    }
    if data['listener'].get('name'):
        listenerSpec['name'] = data['listener']['name']
    if data['listener'].get('description'):
        listenerSpec['description'] = data['listener']['description']
    if data.get('certificates'):
        listenerSpec['default_tls_container_ref'] = data['certificates'][0]
        listenerSpec['sni_container_refs'] = data['certificates']

    listener = neutronclient(request).create_listener(
        {'listener': listenerSpec}).get('listener')

    if data.get('pool'):
        args = (request, kwargs['loadbalancer_id'], create_pool)
        kwargs = {'callback_kwargs': {'listener_id': listener['id']}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)

    return listener


def create_pool(request, **kwargs):
    """Create a new pool.

    """
    data = request.DATA
    poolSpec = {
        'protocol': data['pool']['protocol'],
        'lb_algorithm': data['pool']['method'],
        'listener_id': kwargs['listener_id']
    }
    if data['pool'].get('name'):
        poolSpec['name'] = data['pool']['name']
    if data['pool'].get('description'):
        poolSpec['description'] = data['pool']['description']
    pool = neutronclient(request).create_lbaas_pool(
        {'pool': poolSpec}).get('pool')

    if data.get('members'):
        args = (request, kwargs['loadbalancer_id'], add_member)
        kwargs = {'callback_kwargs': {'pool_id': pool['id'],
                                      'index': 0}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)
    elif data.get('monitor'):
        args = (request, kwargs['loadbalancer_id'], create_health_monitor)
        kwargs = {'callback_kwargs': {'pool_id': pool['id']}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)

    return pool


def create_health_monitor(request, **kwargs):
    """Create a new health monitor for a pool.

    """
    data = request.DATA
    monitorSpec = {
        'type': data['monitor']['type'],
        'delay': data['monitor']['interval'],
        'timeout': data['monitor']['timeout'],
        'max_retries': data['monitor']['retry'],
        'pool_id': kwargs['pool_id']
    }
    if data['monitor'].get('method'):
        monitorSpec['http_method'] = data['monitor']['method']
    if data['monitor'].get('path'):
        monitorSpec['url_path'] = data['monitor']['path']
    if data['monitor'].get('status'):
        monitorSpec['expected_codes'] = data['monitor']['status']
    return neutronclient(request).create_lbaas_healthmonitor(
        {'healthmonitor': monitorSpec}).get('healthmonitor')


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
    memberSpec = {
        'address': member['address'],
        'protocol_port': member['port'],
        'subnet_id': member['subnet']
    }
    if member.get('weight'):
        memberSpec['weight'] = member['weight']

    member = neutronclient(request).create_lbaas_member(
        pool_id, {'member': memberSpec}).get('member')

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

    return member


def remove_member(request, **kwargs):
    """Remove a member from the pool.

    """
    data = request.DATA
    loadbalancer_id = data.get('loadbalancer_id')
    pool_id = kwargs.get('pool_id')

    if kwargs.get('members_to_delete'):
        members_to_delete = kwargs['members_to_delete']
        member_id = members_to_delete.pop(0)

        neutronclient(request).delete_lbaas_member(member_id, pool_id)

        args = (request, loadbalancer_id, update_member_list)
        kwargs = {'callback_kwargs': {
            'existing_members': kwargs.get('existing_members'),
            'members_to_add': kwargs.get('members_to_add'),
            'members_to_delete': members_to_delete}}
        thread.start_new_thread(poll_loadbalancer_status, args, kwargs)


def update_loadbalancer(request, **kwargs):
    """Update a load balancer.

    """
    data = request.DATA
    spec = {}
    loadbalancer_id = kwargs.get('loadbalancer_id')

    if data['loadbalancer'].get('name'):
        spec['name'] = data['loadbalancer']['name']
    if data['loadbalancer'].get('description'):
        spec['description'] = data['loadbalancer']['description']
    return neutronclient(request).update_loadbalancer(
        loadbalancer_id, {'loadbalancer': spec}).get('loadbalancer')


def update_listener(request, **kwargs):
    """Update a listener.

    """
    data = request.DATA
    listener_spec = {}
    listener_id = data['listener'].get('id')
    loadbalancer_id = data.get('loadbalancer_id')

    if data['listener'].get('name'):
        listener_spec['name'] = data['listener']['name']
    if data['listener'].get('description'):
        listener_spec['description'] = data['listener']['description']

    listener = neutronclient(request).update_listener(
        listener_id, {'listener': listener_spec}).get('listener')

    if data.get('pool'):
        args = (request, loadbalancer_id, update_pool)
        thread.start_new_thread(poll_loadbalancer_status, args)

    return listener


def update_pool(request, **kwargs):
    """Update a pool.

    """
    data = request.DATA
    pool_spec = {}
    pool_id = data['pool'].get('id')
    loadbalancer_id = data.get('loadbalancer_id')

    if data['pool'].get('name'):
        pool_spec['name'] = data['pool']['name']
    if data['pool'].get('description'):
        pool_spec['description'] = data['pool']['description']

    pools = neutronclient(request).update_lbaas_pool(
        pool_id, {'pool': pool_spec}).get('pools')

    # Assemble the lists of member id's to add and remove, if any exist
    tenant_id = request.user.project_id
    request_member_data = data.get('members', [])
    existing_members = neutronclient(request).list_lbaas_members(
        pool_id, tenant_id=tenant_id).get('members')
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

    return pools


def update_monitor(request, **kwargs):
    """Update a health monitor.

    """
    data = request.DATA
    monitor_spec = {}
    monitor_id = data['monitor']['id']

    if data['monitor'].get('interval'):
        monitor_spec['delay'] = data['monitor']['interval']
    if data['monitor'].get('timeout'):
        monitor_spec['timeout'] = data['monitor']['timeout']
    if data['monitor'].get('retry'):
        monitor_spec['max_retries'] = data['monitor']['retry']
    if data['monitor'].get('method'):
        monitor_spec['http_method'] = data['monitor']['method']
    if data['monitor'].get('path'):
        monitor_spec['url_path'] = data['monitor']['path']
    if data['monitor'].get('status'):
        monitor_spec['expected_codes'] = data['monitor']['status']

    healthmonitor = neutronclient(request).update_lbaas_healthmonitor(
        monitor_id, {'healthmonitor': monitor_spec}).get('healthmonitor')

    return healthmonitor


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
    floating_ips = network.tenant_floating_ip_list(request)
    for lb in loadbalancers:
        floating_ip = {}
        associated_ip = next((fip for fip in floating_ips
                              if fip['fixed_ip'] == lb['vip_address']), None)
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
        tenant_id = request.user.project_id
        loadbalancers = neutronclient(request).list_loadbalancers(
            tenant_id=tenant_id).get('loadbalancers')
        if request.GET.get('full') and network.floating_ip_supported(request):
            add_floating_ip_info(request, loadbalancers)
        return {'items': loadbalancers}

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
        loadbalancer = neutronclient(request).show_loadbalancer(
            loadbalancer_id).get('loadbalancer')
        if request.GET.get('full') and network.floating_ip_supported(request):
            add_floating_ip_info(request, [loadbalancer])
        return loadbalancer

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
        neutronclient(request).delete_loadbalancer(loadbalancer_id)


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
        tenant_id = request.user.project_id
        result = neutronclient(request).list_listeners(tenant_id=tenant_id)
        listener_list = result.get('listeners')
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
            if listener['loadbalancers'][0]['id'] == loadbalancer_id:
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
        listener = neutronclient(request).show_listener(
            listener_id).get('listener')

        if request.GET.get('includeChildResources'):
            resources = {}
            resources['listener'] = listener

            if listener.get('default_pool_id'):
                pool_id = listener['default_pool_id']
                pool = neutronclient(request).show_lbaas_pool(
                    pool_id).get('pool')
                resources['pool'] = pool

                if pool.get('members'):
                    tenant_id = request.user.project_id
                    members = neutronclient(request).list_lbaas_members(
                        pool_id, tenant_id=tenant_id).get('members')
                    resources['members'] = members

                if pool.get('healthmonitor_id'):
                    monitor_id = pool['healthmonitor_id']
                    monitor = neutronclient(request).show_lbaas_healthmonitor(
                        monitor_id).get('healthmonitor')
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
        neutronclient(request).delete_listener(listener_id)


@urls.register
class Pools(generic.View):
    """API for load balancer pools.

    """
    url_regex = r'lbaas/pools/$'

    @rest_utils.ajax()
    def post(self, request):
        """Create a new pool.

        Creates a new pool as well as other optional resources such as
        members and health monitor.
        """
        kwargs = {'loadbalancer_id': request.DATA.get('loadbalancer_id'),
                  'listener_id': request.DATA.get('parentResourceId')}
        return create_pool(request, **kwargs)


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
        pool = neutronclient(request).show_lbaas_pool(pool_id).get('pool')

        if request.GET.get('includeChildResources'):
            resources = {}
            resources['pool'] = pool

            if pool.get('members'):
                tenant_id = request.user.project_id
                members = neutronclient(request).list_lbaas_members(
                    pool_id, tenant_id=tenant_id).get('members')
                resources['members'] = members

            if pool.get('healthmonitor_id'):
                monitor_id = pool['healthmonitor_id']
                monitor = neutronclient(request).show_lbaas_healthmonitor(
                    monitor_id).get('healthmonitor')
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
        neutronclient(request).delete_lbaas_pool(pool_id)


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
        tenant_id = request.user.project_id
        result = neutronclient(request).list_lbaas_members(pool_id,
                                                           tenant_id=tenant_id)
        return {'items': result.get('members')}

    @rest_utils.ajax()
    def put(self, request, pool_id):
        """Update the list of members for the current project.

        """
        # Assemble the lists of member id's to add and remove, if any exist
        tenant_id = request.user.project_id
        request_member_data = request.DATA.get('members', [])
        existing_members = neutronclient(request).list_lbaas_members(
            pool_id, tenant_id=tenant_id).get('members')
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
        return neutronclient(request).show_lbaas_member(
            member_id, pool_id).get('member')

    @rest_utils.ajax()
    def put(self, request, member_id, pool_id):
        """Edit a pool member.

        """
        data = request.DATA
        spec = {
            'weight': data['weight']
        }
        return neutronclient(request).update_lbaas_member(
            member_id, pool_id, {'member': spec})


@urls.register
class HealthMonitors(generic.View):
    """API for load balancer pool health monitors.

    """
    url_regex = r'lbaas/healthmonitors/$'

    @rest_utils.ajax()
    def post(self, request):
        """Create a new health monitor.

        """
        kwargs = {'loadbalancer_id': request.DATA.get('loadbalancer_id'),
                  'pool_id': request.DATA.get('parentResourceId')}
        return create_health_monitor(request, **kwargs)


@urls.register
class HealthMonitor(generic.View):
    """API for retrieving a single health monitor.

    """
    url_regex = r'lbaas/healthmonitors/(?P<healthmonitor_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, healthmonitor_id):
        """Get a specific health monitor.

        """
        return neutronclient(request).show_lbaas_healthmonitor(
            healthmonitor_id).get('healthmonitor')

    @rest_utils.ajax()
    def delete(self, request, healthmonitor_id):
        """Delete a specific health monitor.

        http://localhost/api/lbaas/healthmonitors/cc758c90-3d98-4ea1-af44-aab405c9c915
        """
        neutronclient(request).delete_lbaas_healthmonitor(healthmonitor_id)

    @rest_utils.ajax()
    def put(self, request, healthmonitor_id):
        """Edit a health monitor.

        """
        update_monitor(request)
