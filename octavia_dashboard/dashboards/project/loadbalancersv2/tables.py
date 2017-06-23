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


import re

from django.core import urlresolvers
from django.template.defaultfilters import linebreaksbr
from django.utils.http import urlencode
from django.utils.translation import ugettext_lazy as _

from horizon import tables

from octavia_dashboard import api


class TerminateLoadBalancer(tables.BatchAction):
    name = "terminate"
    action_present = _("Terminate")
    action_past = _("Scheduled termination of")
    data_type_singular = _("Load Balancer")
    data_type_plural = _("Load Balancers")
    classes = ('btn-danger', 'btn-terminate')

    def allowed(self, request, loadbalancer=None):
        return True

    def action(self, request, obj_id):
        api.lbaasv2.vip_delete(request, obj_id)


class EnableLoadBalancer(tables.BatchAction):
    name = "enable"
    action_present = _("Enable")
    action_past = _("Enabled LB")
    data_type_singular = _("Load Balancer")
    data_type_plural = _("Load Balancers")
    classes = ('btn-enable', "btn-action-required")
    action_failure = "error enable"

    def allowed(self, request, loadbalancer=None):
        if loadbalancer.admin_state_up:
            return False
        return True

    def action(self, request, obj_id):
        api.lbaasv2.vip_set_status(request, obj_id, True)


class DisableLoadBalancer(tables.BatchAction):
    name = "disable"
    action_present = _("Disable")
    action_past = _("Disabled LB")
    data_type_singular = _("Load Balancer")
    data_type_plural = _("Load Balancers")
    classes = ("btn-confirm", 'btn-disable',)
    action_failure = "error disable"

    def allowed(self, request, loadbalancer=None):
        if loadbalancer.admin_state_up:
            return True
        return False

    def action(self, request, obj_id):
        api.lbaasv2.vip_set_status(request, obj_id, False)


class LaunchLink(tables.LinkAction):
    name = "launch"
    verbose_name = _("Launch Load Balancer")
    url = "horizon:project:loadbalancersv2:launch"
    classes = ("btn-launch", "ajax-modal")

    def allowed(self, request, datum):
        return True


class EditLoadBalancer(tables.LinkAction):
    name = "edit"
    verbose_name = _("Edit Load Balancer")
    url = "horizon:project:loadbalancersv2:update"
    classes = ("ajax-modal", "btn-edit")

    def get_link_url(self, project):
        return self._get_link_url(project, 'loadbalancer_info')

    def _get_link_url(self, project, step_slug):
        base_url = urlresolvers.reverse(self.url, args=[project.id])
        param = urlencode({"step": step_slug})
        return "?".join([base_url, param])

    def allowed(self, request, loadbalancer):
        # return not is_deleting(loadbalancer) when async is implemented
        return True


class UpdateRow(tables.Row):
    ajax = True

    def get_data(self, request, loadbalancer_id):
        loadbalancer = api.lbaasv2.vip_update(request, loadbalancer_id)
        return loadbalancer


def convert_title(value):
    return re.sub("([A-Z])", " \g<0>", value)


def convert_camel(value):
    if not value:
        return value
    if value.isupper() or value.islower():
        return value.title()
    else:
        value = value.replace(' ', '')
        return re.sub("([A-Z])", " \g<0>", value)


def upper_case(value):
    return value.upper()


def convert_status(value):
    return "Enabled" if value else "Disabled"


def get_lb_method(value):
    return value.pool['lb_algorithm']


def get_protocol(value):
    return value.listener['protocol']


def get_monitor(value):
    return value['pool']['monitors']['type']


def get_lb(instance):
    if hasattr(instance, "vip_address"):
        return "%s:%s" % (instance.vip_address,
                          instance.listener['protocol_port'])
    return _("Not available")


class LoadBalancersTable(tables.DataTable):
    vip = tables.Column(get_lb,
                        link=("horizon:project:loadbalancersv2:detail"),
                        verbose_name=_("Load Balancer"))
    name = tables.Column("name",
                         link=("horizon:project:loadbalancersv2:detail"),
                         verbose_name=_("Name"))
    lb_method = tables.Column(get_lb_method,
                              filters=(upper_case,),
                              verbose_name=_("Method"))
    protocol = tables.Column(get_protocol,
                             filters=(upper_case,),
                             verbose_name=_("Protocol"))
    monitor = tables.Column(get_monitor,
                            filters=(upper_case,),
                            verbose_name=_("Monitor"))
    status = tables.Column("provisioning_status",
                           filters=(convert_camel, linebreaksbr),
                           verbose_name=_("Provisioning Status"))
    operating_status = tables.Column("operating_status",
                                     filters=(convert_camel, linebreaksbr),
                                     verbose_name=_("Operating Status"))
    enabled = tables.Column("admin_state_up",
                            filters=(convert_status,),
                            verbose_name=_("Admin Status"))

    class Meta(object):
        name = "loadbalancersv2"
        verbose_name = _("Load Balancers")
        row_class = UpdateRow
        table_actions = (LaunchLink, TerminateLoadBalancer)
        row_actions = (EditLoadBalancer, TerminateLoadBalancer,
                       EnableLoadBalancer, DisableLoadBalancer)
