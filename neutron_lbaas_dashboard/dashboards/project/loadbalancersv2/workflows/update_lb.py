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

from django.utils.translation import ugettext as _
from neutron_lbaas_dashboard import api
from . create_lb import *  # noqa

INDEX_URL = "horizon:projects:loadbalancersv2:index"


READ_ONLY = {'readonly': 'readonly'}


class UpdateLBDetailsAction(SetLBDetailsAction):
    address = forms.CharField(widget=forms.widgets.Input(attrs=READ_ONLY),
                              label=_('IP'),
                              required=True)

    name = forms.CharField(widget=forms.widgets.Input(attrs=READ_ONLY),
                           label=_('Name'),
                           required=False)

    port = forms.IntegerField(widget=forms.widgets.Input(attrs=READ_ONLY),
                              label=_("LB Port"),
                              required=False,
                              min_value=1,
                              max_value=65535,
                              help_text=_("LB Port on which "
                                          "LB is listening."))

    is_update = True

    def __init__(self, request, context, *args, **kwargs):
        super(UpdateLBDetailsAction, self).__init__(request, context, *args,
                                                    **kwargs)
        self.fields['address'].initial = context['address']

    class Meta(object):
        name = _("LB Details")
        help_text_template = ("project/loadbalancersv2/"
                              "_launch_lb_help.html")


class UpdateLBDetails(SetLBDetails):
    action_class = UpdateLBDetailsAction
    template_name = "project/loadbalancersv2/update_lb_step.html"


class UpdateSSLAction(UploadSSLAction):

    update_cert = forms.BooleanField(label='Update SSL Certificate',
                                     required=False,
                                     widget=forms.CheckboxInput())

    # def clean(self):
    #     cleaned_data = super(UploadSSLAction, self).clean()
    #     data = self.data
    #     protocol = data.get('source_type')
    #     if protocol == 'HTTPS':
    #         update_cert = data.get('update_cert')
    #         if update_cert:
    #             use_common_cert = data.get('use_common_cert')
    #             if not use_common_cert:
    #                 # check to see if ssl cert is provided
    #                 cert_name = data.get('cert_name')
    #                 cert = data.get('cert')
    #                 private_key = data.get('private_key')
    #
    #                 if (not cert_name) \
    #                     or (not cert) \
    #                         or (not private_key):
    #                     raise forms.ValidationError(
    #                         _('Please provide all certificate parameters.'))
    #     return cleaned_data

    class Meta(object):
        name = _("SSL Certificate")
        help_text_template = ("project/loadbalancersv2/_ssl_cert_help.html")


class UpdateSSLStep(UploadSSLStep):
    action_class = UpdateSSLAction
    contributes = ("cert_name", "cert", "private_key",
                   "chain_cert", 'use_common_cert', "update_cert")
    template_name = "project/loadbalancersv2/update_ssl_cert.html"

    def contribute(self, data, context):
        post = self.workflow.request.POST
        context['cert_name'] = post['cert_name'] if 'cert_name' in post else ''
        context['cert'] = post['cert'] if 'cert' in post else ''
        context['private_key'] = post[
            'private_key'] if 'private_key' in post else ''
        context['chain_cert'] = post[
            'chain_cert'] if 'chain_cert' in post else ''
        context['use_common_cert'] = post[
            'use_common_cert'] if 'use_common_cert' in post else ''
        context['update_cert'] = post[
            'update_cert'] if 'update_cert' in post else ''
        return context


class UpdateInstancesAction(SelectInstancesAction):

    def __init__(self, request, *args, **kwargs):
        super(UpdateInstancesAction, self).__init__(request, *args, **kwargs)
        err_msg = _('Unable to retrieve members list. '
                    'Please try again later.')

        pre_selectd = []
        try:
            pre_selectd = args[0]['selected_members']
        except Exception:
            exceptions.handle(request, err_msg)
        self.fields[self.get_member_field_name('member')].initial = pre_selectd

    class Meta(object):
        name = _("Instances")
        slug = "select_instances"


class UpdateInstancesStep(SelectInstancesStep):
    action_class = UpdateInstancesAction
    depends_on = ("loadbalancer_id",)
    contributes = ("wanted_members", "selected_members",
                   "loadbalancer_id", "instances_details",
                   "monitor", "instance_port")


class UpdateLoadBalancer(LaunchLoadBalancer):
    slug = "update_loadbalancer"
    name = _("Edit Load Balancer")
    finalize_button_name = _("Update")
    success_message = _('Updated load balancer "%s".')
    failure_message = _('Unable to modify load balancer "%s".')
    success_url = "horizon:project:loadbalancersv2:index"
    default_steps = (UpdateLBDetails,
                     UpdateSSLStep,
                     SelectMonitorStep,
                     UpdateInstancesStep)
    attrs = {'data-help-text': 'Updating LB may take a few minutes'}

    def format_status_message(self, message):
        return message % self.context.get('name', 'unknown load balancer')

    def handle(self, request, context):

        try:
            protocol = context['source_type']

            api.lbui.vip_create(request,
                                update=True,
                                loadbalancer_id=context['loadbalancer_id'],
                                address=context['address'],
                                name=context['name'],
                                description=context['description'],
                                lb_method=context['lb_method'],
                                monitor=context['monitor'],
                                protocol=protocol,
                                port=context['port'],
                                instance_port=context['instance_port'],
                                wanted_members=context['wanted_members'],
                                instances_details=context['instances_details'],
                                cert_name=context['cert_name'],
                                cert=context['cert'],
                                private_key=context['private_key'],
                                chain_cert=context['chain_cert'],
                                use_common_cert=True if context[
                                    'use_common_cert'] == 'on' else False,
                                update_cert=True if context[
                                    'update_cert'] == 'on' else False,
                                interval=context['interval'],
                                timeout=context['timeout'],
                                send=context['send'],
                                receive=context['receive'],
                                )

            return True
        except Exception as e:
            exceptions.handle(request, e.message, ignore=False)
            return False
