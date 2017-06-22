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

from oslo_log import log as logging

from django.core.urlresolvers import reverse
from django.core.urlresolvers import reverse_lazy
from django.utils.translation import ugettext_lazy as _

from horizon import exceptions
from horizon import tables
from horizon import tabs
from horizon import workflows

from octavia_dashboard import api

from .tables import LoadBalancersTable  # noqa
from .tabs import LoadBalancerDetailTabs  # noqa
from .workflows import LaunchLoadBalancer  # noqa
from .workflows import UpdateLoadBalancer  # noqa


LOG = logging.getLogger(__name__)


class IndexView(tables.DataTableView):
    table_class = LoadBalancersTable
    template_name = 'project/loadbalancersv2/index.html'

    def get_data(self):
        pools = []
        try:
            pools = api.lbaasv2.list_loadbalancers(self.request)
        except Exception:
            exceptions.handle(self.request,
                              _('Unable to retrieve pools list.'))
        return pools


class LaunchLoadBalancerView(workflows.WorkflowView):
    workflow_class = LaunchLoadBalancer
    template_name = "project/loadbalancersv2/launch.html"

    def get_initial(self):
        initial = super(LaunchLoadBalancerView, self).get_initial()
        initial['project_id'] = self.request.user.tenant_id
        initial['user_id'] = self.request.user.id
        return initial


class UpdateView(workflows.WorkflowView):
    workflow_class = UpdateLoadBalancer
    template_name = 'project/loadbalancersv2/update.html'
    success_url = reverse_lazy("horizon:project:loadbalancersv2:index")

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        context["loadbalancer_id"] = self.kwargs['loadbalancer_id']
        return context

    def get_object(self, *args, **kwargs):
        if not hasattr(self, "_object"):
            loadbalancer_id = self.kwargs['loadbalancer_id']
            LOG.info("DEBUGGING - loadbalancer_id=%s" % loadbalancer_id)
            try:
                vip = api.lbaasv2.show_loadbalancer(self.request,
                                                    loadbalancer_id)
                self._object = vip.readable(self.request)
            except Exception as e:
                redirect = reverse("horizon:project:loadbalancersv2:index")
                msg = _('Unable to retrieve load balancer details. %s')\
                    % e.message
                exceptions.handle(self.request, msg, redirect=redirect)
        return self._object

    def get_initial(self):
        initial = super(UpdateView, self).get_initial()

        initial.update({
            'loadbalancer_id': self.kwargs['loadbalancer_id'],
            'address': getattr(self.get_object(), 'address', ''),
            'name': getattr(self.get_object(), 'name', ''),
            'description': getattr(self.get_object(), 'description', ''),
            'lb_method': getattr(self.get_object(), 'lb_method', ''),
            'monitor': getattr(self.get_object(), 'monitor', ''),
            'interval': getattr(self.get_object(), 'interval', ''),
            'timeout': getattr(self.get_object(), 'timeout', ''),
            'send': getattr(self.get_object(), 'send', ''),
            'receive': getattr(self.get_object(), 'receive', ''),

            'source_type': getattr(self.get_object(), 'protocol', ''),
            'http': getattr(self.get_object(), 'port', ''),
            'https': getattr(self.get_object(), 'port', ''),
            'instance_port': getattr(self.get_object(), 'instance_port', ''),
            'selected_members': getattr(self.get_object(), 'members', ''),
            'cert_name': getattr(self.get_object(), 'cert_name', ''),
            'cert': getattr(self.get_object(), 'cert', ''),
            'private_key': getattr(self.get_object(), 'private_key', ''),
            'chain_cert': getattr(self.get_object(), 'chain_cert', ''),
            'enabled': getattr(self.get_object(), 'enabled', ''),
            'use_common_cert': getattr(self.get_object(),
                                       'use_common_cert', ''),
            'port': getattr(self.get_object(), 'port', ''),
        })
        return initial


class DetailView(tabs.TabView):
    tab_group_class = LoadBalancerDetailTabs
    template_name = 'project/loadbalancersv2/detail.html'

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        context["loadbalancer"] = self.get_data()
        return context

    def get_data(self):
        if not hasattr(self, "_loadbalancer"):
            try:
                loadbalancer_id = self.kwargs['loadbalancer_id']
                loadbalancer = api.lbaasv2.show_loadbalancer(self.request,
                                                             loadbalancer_id)
            except Exception:
                redirect = reverse('horizon:project:loadbalancersv2:index')
                exceptions.handle(self.request,
                                  _('Unable to retrieve details for '
                                    'loadbalancer "%s".') % loadbalancer_id,
                                  redirect=redirect)
            self._loadbalancer = loadbalancer
        return self._loadbalancer.readable(self.request)

    def get_tabs(self, request, *args, **kwargs):
        loadbalancer = self.get_data()
        return self.tab_group_class(request, loadbalancer=loadbalancer,
                                    **kwargs)
