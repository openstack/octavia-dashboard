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

from django.conf.urls import patterns
from django.conf.urls import url

from .views import DetailView  # noqa
from .views import IndexView  # noqa
from .views import LaunchLoadBalancerView  # noqa
from .views import UpdateView  # noqa


INSTANCES = r'^(?P<loadbalancer_id>[^/]+)/%s$'
VIEW_MOD = 'openstack_dashboard.dashboards.project.loadbalancersv2.views'


urlpatterns = patterns(VIEW_MOD,
                       url(r'^$', IndexView.as_view(), name='index'),
                       url(r'^launch$',
                           LaunchLoadBalancerView.as_view(), name='launch'),
                       url(r'^(?P<loadbalancer_id>[^/]+)/$',
                           DetailView.as_view(), name='detail'),
                       url(INSTANCES %
                           'update', UpdateView.as_view(), name='update'),
                       )
