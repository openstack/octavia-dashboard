#    Copyright 2015, eBay Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

from __future__ import absolute_import

import collections

from django.utils.translation import ugettext_lazy as _

from horizon import messages

from openstack_dashboard.api import neutron

neutronclient = neutron.neutronclient


class LBDetails(neutron.NeutronAPIDictWrapper):
    """Wrapper for neutron load balancer vip."""

    def __init__(self, vip, listener=None, pool=None, members=None,
                 monitors=None, profile_name=None, cert=None, key=None,
                 chain=None):
        vip['pool'] = pool
        pool['members'] = members
        pool['monitors'] = monitors
        # vip['cert_name'] = cert_name
        vip['listener'] = listener
        vip['cert'] = cert
        vip['key'] = key
        vip['chain'] = chain
        vip['profile_name'] = profile_name
        super(LBDetails, self).__init__(vip)

    class AttributeDict(dict):

        def __getattr__(self, attr):
            return self[attr]

        def __setattr__(self, attr, value):
            self[attr] = value

    def convert_status(self, value):
        return "Enabled" if value else "Disabled"

    def readable(self, request=None):

        pFormatted = {'id': self.id,
                      'name': self.name,
                      'dns_name': self.name,
                      # 'lb_method': self.lb_method,
                      'description': self.description,
                      # 'protocol': self.protocol,
                      'address': self.vip_address,
                      # 'port': self.port,
                      'enabled': self.convert_status(self.admin_state_up),
                      'use_common_cert': False,
                      'provisioning_status': self.provisioning_status,
                      'operating_status': self.operating_status,
                      # 'monitor' : self.monitor
                      }

        # status_string = 'vip: %s' % self['status'].lower()
        pFormatted['status'] = 'na'

        # if self.profile_name:
        #     try:
        #         if self.profile_name.upper() ==
        #          _construct_common_cert_profile_name(request).upper():
        #             pFormatted['use_common_cert'] = True
        #             pFormatted['cert_name'] = self.profile_name
        #         else:
        #             pFormatted['use_common_cert'] = False
        #             pFormatted['cert_name'] = self.profile_name
        #             pFormatted['cert'] = self.cert
        #             pFormatted['private_key'] = self.key
        #             pFormatted['chain_cert'] = self.chain
        #     except Exception as e:
        #         LOG.error("unable to read cert")

        if self.listener is not None:
            try:
                listener = self.AttributeDict(self.listener)
                pFormatted['protocol'] = listener.protocol
                pFormatted['port'] = listener.protocol_port
            except Exception:
                pass

        if self.pool is not None:
            try:
                pool = self.AttributeDict(self.pool)
                # status_string = '%s \n pool: %s' % (pFormatted['status'],
                # pool['status'].lower())
                # pFormatted['status'] = status_string
                pFormatted['pool'] = pool
                pFormatted['pool_id'] = pool.id
                pFormatted['lb_method'] = pool.lb_algorithm

                if pool.members is not None:
                    try:
                        ips = []
                        pool_members = []
                        for m in pool.members:
                            member = self.AttributeDict(m)
                            pFormatted['instance_port'] = member.protocol_port

                            pool_member = member
                            pool_member.port = member.protocol_port
                            pool_members.append(pool_member)

                            ips.append(member.address)
                        pFormatted['pool']['members'] = pool_members
                        pFormatted['members'] = ips
                    except Exception:
                        pass  # ignore

                if pool.monitors is not None:
                    try:
                        for m in pool.monitors:
                            monitor = self.AttributeDict(m)
                            # monitor_status =_get_monitor_status(pool['id'],m)
                            # status_string = '%s \n monitor: %s' %
                            # (pFormatted['status'], monitor_status.lower())
                            # pFormatted['status'] = status_string
                            interval = int(monitor.delay)
                            # timeout = int(monitor.timeout)
                            retry = int(monitor.max_retries)
                            monitor_type = 'http-ecv'
                            # if monitor.name.upper() in basic_monitors:
                            # monitor_type = monitor.name
                            monitor_type = monitor.name
                            pFormatted['pool']['monitor'] = monitor_type
                            pFormatted['monitor'] = monitor_type
                            pFormatted['interval'] = interval
                            pFormatted['timeout'] = retry
                            pFormatted['send'] = monitor.url_path \
                                if hasattr(monitor, 'url_path') else ''
                            pFormatted['receive'] = monitor.response_string \
                                if hasattr(monitor, 'response_string') else ''
                            break
                    except Exception:
                        pass  # ignore
            except Exception:
                pass  # ignore

        if 'cert_name' not in pFormatted:
            pFormatted['cert_name'] = ''
        if 'cert' not in pFormatted:
            pFormatted['cert'] = ''
        if 'private_key' not in pFormatted:
            pFormatted['private_key'] = ''
        if 'chain_cert' not in pFormatted:
            pFormatted['chain_cert'] = ''
        if 'pool_id' not in pFormatted:
            pFormatted['pool_id'] = 'UNKNOWN'
        if 'lb_method' not in pFormatted:
            pFormatted['lb_method'] = 'UNKNOWN'
        if 'monitor' not in pFormatted:
            pFormatted['monitor'] = 'None'
        # if 'monitor' not in pFormatted['pool']:
        #     pFormatted['pool']['monitor'] = 'None'
        if 'interval' not in pFormatted:
            pFormatted['interval'] = 1
        if 'timeout' not in pFormatted:
            pFormatted['timeout'] = 1
        if 'send' not in pFormatted:
            pFormatted['send'] = None
        if 'receive' not in pFormatted:
            pFormatted['receive'] = None
        if 'members' not in pFormatted:
            pFormatted['members'] = []
        if 'instance_port' not in pFormatted:
            pFormatted['instance_port'] = ''

        return self.AttributeDict(pFormatted)


class Vip(neutron.NeutronAPIDictWrapper):
    """Wrapper for neutron load balancer vip."""

    def __init__(self, apiresource):
        super(Vip, self).__init__(apiresource)


class Pool(neutron.NeutronAPIDictWrapper):
    """Wrapper for neutron load balancer pool."""

    def __init__(self, apiresource):
        if 'provider' not in apiresource:
            apiresource['provider'] = None
        super(Pool, self).__init__(apiresource)


class Member(neutron.NeutronAPIDictWrapper):
    """Wrapper for neutron load balancer member."""

    def __init__(self, apiresource):
        super(Member, self).__init__(apiresource)


class PoolStats(neutron.NeutronAPIDictWrapper):
    """Wrapper for neutron load balancer pool stats."""

    def __init__(self, apiresource):
        super(PoolStats, self).__init__(apiresource)


class PoolMonitor(neutron.NeutronAPIDictWrapper):
    """Wrapper for neutron load balancer pool health monitor."""

    def __init__(self, apiresource):
        super(PoolMonitor, self).__init__(apiresource)


def vip_create(request, **kwargs):
    """Create a vip for a specified pool.

    :param request: request context
    :param address: virtual IP address
    :param name: name for vip
    :param description: description for vip
    :param subnet_id: subnet_id for subnet of vip
    :param protocol_port: transport layer port number for vip
    :returns: Vip object
    """
    body = {'vip': {'name': kwargs['name'],
                    'description': kwargs['description'],
                    'subnet_id': kwargs['subnet_id'],
                    'protocol_port': kwargs['protocol_port'],
                    'protocol': kwargs['protocol'],
                    'pool_id': kwargs['pool_id'],
                    'session_persistence': kwargs['session_persistence'],
                    'admin_state_up': kwargs['admin_state_up']
                    }}
    if kwargs.get('connection_limit'):
        body['vip']['connection_limit'] = kwargs['connection_limit']

    if kwargs.get('address'):
        body['vip']['address'] = kwargs['address']

    vip = neutronclient(request).create_vip(body).get('vip')
    return Vip(vip)


def vip_list(request, **kwargs):
    vips = neutronclient(request).list_vips(**kwargs).get('vips')
    return [Vip(v) for v in vips]


def create_loadbalancer_full(request, **kwargs):
    loadbalancer_body = {'loadbalancer': {'name': kwargs['name'],
                                          'description': kwargs['description'],
                                          'vip_subnet_id': kwargs['subnet_id'],
                                          'admin_state_up':
                                          kwargs['admin_state_up'],
                                          'vip_address': kwargs['address'],
                                          # 'provider': 'HAProxy'
                                          }}

    listener_body = {'listener': {'name': kwargs['name'],
                                  'description': kwargs['description'],
                                  'protocol': kwargs['protocol'],
                                  'protocol_port': kwargs['protocol_port'],
                                  'default_tls_container_id': None,
                                  'sni_container_ids': [],
                                  'connection_limit': 100,
                                  'admin_state_up': kwargs['admin_state_up'],
                                  'loadbalancer_id': None}}

    pool_body = {'pool': {'name': kwargs['name'],
                          'description': kwargs['description'],
                          'protocol': kwargs['protocol'],
                          'lb_method': kwargs['lb_method'],
                          'admin_state_up': kwargs['admin_state_up']
                          }}

    member_body = {'member': {'pool_id': kwargs['pool_id'],
                              'address': kwargs['address'],
                              'protocol_port': kwargs['protocol_port'],
                              'admin_state_up': kwargs['admin_state_up'],
                              'pool_id': None
                              }}
    if kwargs.get('weight'):
        member_body['member']['weight'] = kwargs['weight']

    monitor_type = kwargs['type'].upper()

    health_monitor_body = {'health_monitor': {'tenant_id': kwargs['tenant_id'],
                                              'type': monitor_type,
                                              'delay': kwargs['delay'],
                                              'timeout': kwargs['timeout'],
                                              'max_retries':
                                              kwargs['max_retries'],
                                              'admin_state_up':
                                              kwargs['admin_state_up'],
                                              'pool_id': None
                                              }
                           }

    if monitor_type in ['HTTP', 'HTTPS']:
        health_mon = health_monitor_body['health_monitor']
        health_mon['http_method'] = kwargs['http_method']
        health_mon['url_path'] = kwargs['url_path']
        health_mon['expected_codes'] = kwargs['expected_codes']

    try:
        client = neutronclient(request)
        loadbalancer = client.\
            create_loadbalancer(loadbalancer_body).get('loadbalancer')
        listener_body['listener']['loadbalancer_id'] = loadbalancer['id']
        listener = client.\
            create_listener(listener_body).get('listener')
        pool = client.create_lbaas_pool(pool_body).get('pool')
        member_body['member']['pool_id'] = pool['id']
        health_monitor_body['health_monitor']['pool_id'] = pool['id']
        health_monitor = client.create_lbaas_healthmonitor(health_monitor_body)\
            .get('health_monitor')
        member = client.create_lbaas_member(member_body).get('member')
    except Exception:
        raise Exception(_("Could not create full loadbalancer."))
    return [LBDetails(loadbalancer, listener, pool, member, health_monitor)]


def list_loadbalancers(request, **kwargs):
    vips = neutronclient(request).list_loadbalancers(**kwargs)
    vips = [] if not vips else vips
    vips = vips.get('loadbalancers')
    lbaas_list = []

    for vip in vips:
        listeners = vip.get('listeners')
        listeners = [] if not listeners else listeners

        for listener in listeners:
            listener = neutronclient(request).show_listener(listener.get('id'),
                                                            **kwargs)
            if not listener:
                continue
            listener = listener.get('listener')

            try:
                pool = neutronclient(request).\
                    show_lbaas_pool(listener.get('default_pool_id'), **kwargs)
                if not pool:
                    continue
                pool = pool.get('pool')
                if pool.get('healthmonitor_id'):
                    health_monitor = neutronclient(request).\
                        show_lbaas_healthmonitor(pool.get('healthmonitor_id'),
                                                 **kwargs)
                    health_monitor = health_monitor.get('healthmonitor')
                else:
                    health_monitor = None
                members = neutronclient(request).\
                    list_lbaas_members(listener.get('default_pool_id'),
                                       **kwargs)
                lbaas_list.append(LBDetails(vip, listener, pool,
                                            members, health_monitor))
            except Exception:
                raise Exception(_("Could not get load balancer list."))
    return lbaas_list


def show_loadbalancer(request, lbaas_loadbalancer, **kwargs):
    vip = neutronclient(request).show_loadbalancer(lbaas_loadbalancer,
                                                   **kwargs)
    if not vip:
        return
    loadbalancer = vip.get('loadbalancer')
    viplisteners = loadbalancer.get('listeners')
    if not viplisteners:
        return
    for viplistener in viplisteners:
        listener = neutronclient(request).\
            show_listener(viplistener.get('id'), **kwargs)
        if not listener:
            continue
        listener = listener.get('listener')
        pool = neutronclient(request).\
            show_lbaas_pool(listener.get('default_pool_id'), **kwargs)
        if not pool:
            continue
        pool = pool.get('pool')
        health_monitor = None
        if pool.get('healthmonitor_id'):
            health_monitor = neutronclient(request).\
                show_lbaas_healthmonitor(pool.get('healthmonitor_id'),
                                         **kwargs)
            health_monitor = health_monitor.get('healthmonitor')
        members = neutronclient(request).\
            list_lbaas_members(listener.get('default_pool_id'), **kwargs)
    return LBDetails(vip.get('loadbalancer'), listener, pool, members,
                     health_monitor)


def vip_get(request, vip_id):
    return _vip_get(request, vip_id, expand_resource=True)


def _vip_get(request, vip_id, expand_resource=False):
    vip = neutronclient(request).show_vip(vip_id).get('vip')
    if expand_resource:
        vip['subnet'] = neutron.subnet_get(request, vip['subnet_id'])
        vip['port'] = neutron.port_get(request, vip['port_id'])
        vip['pool'] = _pool_get(request, vip['pool_id'])
    return Vip(vip)


def vip_update(request, vip_id, **kwargs):
    vip = neutronclient(request).update_vip(vip_id, kwargs).get('vip')
    return Vip(vip)


def vip_delete(request, vip_id):
    neutronclient(request).delete_vip(vip_id)


def pool_create(request, **kwargs):
    """Create a pool for specified protocol

    :param request: request context
    :param name: name for pool
    :param description: description for pool
    :param subnet_id: subnet_id for subnet of pool
    :param protocol: load balanced protocol
    :param lb_method: load balancer method
    :param admin_state_up: admin state (default on)
    """
    body = {'pool': {'name': kwargs['name'],
                     'description': kwargs['description'],
                     'subnet_id': kwargs['subnet_id'],
                     'protocol': kwargs['protocol'],
                     'lb_method': kwargs['lb_method'],
                     'admin_state_up': kwargs['admin_state_up'],
                     'provider': kwargs['provider'],
                     }}
    pool = neutronclient(request).create_pool(body).get('pool')
    return Pool(pool)


def _get_vip(request, pool, vip_dict, expand_name_only=False):
    if pool['vip_id'] is not None:
        try:
            if vip_dict:
                vip = vip_dict.get(pool['vip_id'])
            else:
                vip = _vip_get(request, pool['vip_id'])
        except Exception:
            messages.warning(request, _("Unable to get VIP for pool "
                                        "%(pool)s.") % {"pool": pool["id"]})
            vip = Vip({'id': pool['vip_id'], 'name': ''})
        if expand_name_only:
            vip = vip.name_or_id
        return vip
    else:
        return None


def pool_list(request, **kwargs):
    return _pool_list(request, expand_subnet=True, expand_vip=True, **kwargs)


def _pool_list(request, expand_subnet=False, expand_vip=False, **kwargs):
    pools = neutronclient(request).list_pools(**kwargs).get('pools')
    if expand_subnet:
        subnets = neutron.subnet_list(request)
        subnet_dict = collections.OrderedDict((s.id, s) for s in subnets)
        for p in pools:
            subnet = subnet_dict.get(p['subnet_id'])
            p['subnet_name'] = subnet.cidr if subnet else None
    if expand_vip:
        vips = vip_list(request)
        vip_dict = collections.OrderedDict((v.id, v) for v in vips)
        for p in pools:
            p['vip_name'] = _get_vip(request, p, vip_dict,
                                     expand_name_only=True)
    return [Pool(p) for p in pools]


def pool_get(request, pool_id):
    return _pool_get(request, pool_id, expand_resource=True)


def _pool_get(request, pool_id, expand_resource=False):
    try:
        pool = neutronclient(request).show_pool(pool_id).get('pool')
    except Exception:
        messages.warning(request, _("Unable to get pool detail."))
        return None
    if expand_resource:
        # TODO(lyj): The expand resource(subnet, member etc.) attached
        # to a pool could be deleted without cleanup pool related database,
        # this will cause exceptions if we trying to get the deleted resources.
        # so we need to handle the situation by showing a warning message here.
        # we can safely remove the try/except once the neutron bug is fixed
        # https://bugs.launchpad.net/neutron/+bug/1406854
        try:
            pool['subnet'] = neutron.subnet_get(request, pool['subnet_id'])
        except Exception:
            messages.warning(request, _("Unable to get subnet for pool "
                                        "%(pool)s.") % {"pool": pool_id})
        pool['vip'] = _get_vip(request, pool, vip_dict=None,
                               expand_name_only=False)
        try:
            pool['members'] = _member_list(request, expand_pool=False,
                                           pool_id=pool_id)
        except Exception:
            messages.warning(request, _("Unable to get members for pool "
                                        "%(pool)s.") % {"pool": pool_id})
        try:
            pool['health_monitors'] = pool_health_monitor_list(
                request, id=pool['health_monitors'])
        except Exception:
            messages.warning(request,
                             _("Unable to get health monitors "
                               "for pool %(pool)s.") % {"pool": pool_id})
    return Pool(pool)


def pool_update(request, pool_id, **kwargs):
    pool = neutronclient(request).update_pool(pool_id, kwargs).get('pool')
    return Pool(pool)


def pool_delete(request, pool):
    neutronclient(request).delete_pool(pool)


# not linked to UI yet
def pool_stats(request, pool_id, **kwargs):
    stats = neutronclient(request).retrieve_pool_stats(pool_id, **kwargs)
    return PoolStats(stats)


def pool_health_monitor_create(request, **kwargs):
    """Create a health monitor

    :param request: request context
    :param type: type of monitor
    :param delay: delay of monitor
    :param timeout: timeout of monitor
    :param max_retries: max retries [1..10]
    :param http_method: http method
    :param url_path: url path
    :param expected_codes: http return code
    :param admin_state_up: admin state
    """
    monitor_type = kwargs['type'].upper()
    body = {'health_monitor': {'type': monitor_type,
                               'delay': kwargs['delay'],
                               'timeout': kwargs['timeout'],
                               'max_retries': kwargs['max_retries'],
                               'admin_state_up': kwargs['admin_state_up']
                               }}
    if monitor_type in ['HTTP', 'HTTPS']:
        body['health_monitor']['http_method'] = kwargs['http_method']
        body['health_monitor']['url_path'] = kwargs['url_path']
        body['health_monitor']['expected_codes'] = kwargs['expected_codes']
    mon = neutronclient(request).create_health_monitor(body).get(
        'health_monitor')

    return PoolMonitor(mon)


def pool_health_monitor_list(request, **kwargs):
    monitors = neutronclient(request).list_health_monitors(
        **kwargs).get('health_monitors')
    return [PoolMonitor(m) for m in monitors]


def pool_health_monitor_get(request, monitor_id):
    return _pool_health_monitor_get(request, monitor_id, expand_resource=True)


def _pool_health_monitor_get(request, monitor_id, expand_resource=False):
    monitor = neutronclient(request
                            ).show_health_monitor(monitor_id
                                                  ).get('health_monitor')
    if expand_resource:
        pool_ids = [p['pool_id'] for p in monitor['pools']]
        monitor['pools'] = _pool_list(request, id=pool_ids)
    return PoolMonitor(monitor)


def pool_health_monitor_update(request, monitor_id, **kwargs):
    monitor = neutronclient(request).update_health_monitor(monitor_id, kwargs)
    return PoolMonitor(monitor)


def pool_health_monitor_delete(request, mon_id):
    neutronclient(request).delete_health_monitor(mon_id)


def member_create(request, **kwargs):
    """Create a load balance member

    :param request: request context
    :param pool_id: pool_id of pool for member
    :param address: IP address
    :param protocol_port: transport layer port number
    :param weight: weight for member
    :param admin_state_up: admin_state
    """
    body = {'member': {'pool_id': kwargs['pool_id'],
                       'address': kwargs['address'],
                       'protocol_port': kwargs['protocol_port'],
                       'admin_state_up': kwargs['admin_state_up']
                       }}
    if kwargs.get('weight'):
        body['member']['weight'] = kwargs['weight']
    member = neutronclient(request).create_member(body).get('member')
    return Member(member)


def member_list(request, **kwargs):
    return _member_list(request, expand_pool=True, **kwargs)


def _member_list(request, expand_pool, **kwargs):
    members = neutronclient(request).list_members(**kwargs).get('members')
    if expand_pool:
        pools = _pool_list(request)
        pool_dict = collections.OrderedDict((p.id, p) for p in pools)
        for m in members:
            m['pool_name'] = pool_dict.get(m['pool_id']).name_or_id
    return [Member(m) for m in members]


def member_get(request, member_id):
    return _member_get(request, member_id, expand_pool=True)


def _member_get(request, member_id, expand_pool):
    member = neutronclient(request).show_member(member_id).get('member')
    if expand_pool:
        member['pool'] = _pool_get(request, member['pool_id'])
    return Member(member)


def member_update(request, member_id, **kwargs):
    member = neutronclient(request).update_member(member_id, kwargs)
    return Member(member)


def member_delete(request, mem_id):
    neutronclient(request).delete_member(mem_id)


def pool_monitor_association_create(request, **kwargs):
    """Associate a health monitor with pool

    :param request: request context
    :param monitor_id: id of monitor
    :param pool_id: id of pool
    """

    body = {'health_monitor': {'id': kwargs['monitor_id'], }}

    neutronclient(request).associate_health_monitor(
        kwargs['pool_id'], body)


def pool_monitor_association_delete(request, **kwargs):
    """Disassociate a health monitor from pool

    :param request: request context
    :param monitor_id: id of monitor
    :param pool_id: id of pool
    """

    neutronclient(request).disassociate_health_monitor(
        kwargs['pool_id'], kwargs['monitor_id'])
