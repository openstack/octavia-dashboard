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


from django.utils.translation import ugettext_lazy as _
from horizon import exceptions
from horizon import forms
from horizon import workflows

from openstack_dashboard.api import nova

from octavia_dashboard import api

__create_new__ = "Create New"


class SetLBDetailsAction(workflows.Action):

    address = forms.ChoiceField(label=_("IP"),
                                help_text=_("Select from existing VIP IPs"))

    name = forms.CharField(max_length=80, label=_("Name"),
                           required=True)

    description = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}),
                                  label=_(
                                  "Load Balancer Description"),
                                  required=False,
                                  help_text=_("Provide Load Balancer "
                                              "Description."))

    all_vips = None
    is_update = False

    LOAD_BALANCING_CHOICES = (
        ("RoundRobin", _("Round Robin")),
        ("LeastConnection", _("Least Connection")),
        ("LeastSessions", _("Least Sessions"))
    )
    lb_method = forms.ChoiceField(label=_("Load Balancing Method"),
                                  choices=LOAD_BALANCING_CHOICES)

    PROTOCOL_CHOICES = (
        ("HTTP", _("HTTP")),
        ("HTTPS", _("HTTPS")),
        ("TCP", _("TCP")),
        ("SSL", _("SSL")),
    )

    protocol_type = forms.ChoiceField(
        label=_("LB Protocol"), choices=PROTOCOL_CHOICES)

    port = forms.IntegerField(label=_("LB Port"),
                              required=False,
                              min_value=1,
                              max_value=65535,
                              help_text=_("LB Port on which "
                                          "LB is listening."))

    instance_port = forms.IntegerField(label=_("Instance Port"),
                                       required=False,
                                       min_value=1,
                                       max_value=65535,
                                       help_text=_("Instance Port on which "
                                                   "service is running."))

    def __init__(self, request, *args, **kwargs):
        super(SetLBDetailsAction, self).__init__(request, *args, **kwargs)
        self.all_vips = []
        try:
            # todo - this should be obtained in view via an initial method
            self.all_vips = api.lbaasv2.list_loadbalancers(request)
        except Exception:
            pass

        if len(self.fields['address'].choices) == 0:
            del self.fields['address']

    class Meta(object):
        name = _("LB Details")
        help_text_template = ("project/loadbalancersv2/_launch_lb_help.html")

    def clean(self):
        cleaned_data = super(SetLBDetailsAction, self).clean()

        lb_method = cleaned_data['lb_method']
        if not (lb_method == 'RoundRobin'
                or lb_method == 'LeastConnection'
                or lb_method == 'LeastSessions'):
                raise forms.ValidationError(_("Please select an option for "
                                              "the load balancing method."))

        if not self.is_update:
            all_vips = self.all_vips
            ipPortCombo = []
            for vip in all_vips:
                vip = vip.readable()
                ipPortCombo.append('%s:%s' % (vip.address, vip.port))

            data = self.data
            if 'address' in data \
                    and data['address'] != 'new' \
                    and data['address'] != '':
                address = data['address']
                selected_lb_port = data['port']
                selected_ip_port_combo = '%s:%s' % (address.split(':')[0],
                                                    selected_lb_port)
                if selected_ip_port_combo in ipPortCombo:
                    raise forms.ValidationError(_('Requested IP and port '
                                                  'combination already '
                                                  'exists %s ') %
                                                selected_ip_port_combo)

        instance_port = cleaned_data.get('instance_port', None)
        if not instance_port:
            raise forms.ValidationError(
                _('Please provide instance port'))

        return cleaned_data

    def populate_address_choices(self, request, context):
        if self.is_update:
            return []
        try:
            vips = api.lbaasv2.list_loadbalancers(request)
            if len(vips) == 0:
                return []

            distict_ips = set()
            for vip in vips:
                vip = vip.readable()
                distict_ips.add(vip.address)

            existing = []
            for vip in vips:
                vip = vip.readable()
                if vip.address in distict_ips:
                    item = ("%s:%s:%s" %
                            (vip.address, vip.name, 443),
                            "%s" % vip.address)
                    existing.append(item)
                    distict_ips.remove(vip.address)

            vip_list = []
            if len(existing) > 0:
                vip_list.append(('new', __create_new__))
                vip_list.append(('Select Existing', existing))
            return vip_list

        except Exception:
            exceptions.handle(request,
                              _('Unable to retrieve vips.'))
            return []

    def get_help_text(self):
        extra = {}
        return super(SetLBDetailsAction, self).get_help_text(extra)


class SetLBDetails(workflows.Step):
    action_class = SetLBDetailsAction
    contributes = ("name", "description", "lb_method", "protocol_type", "port",
                   "source_id", "instance_port", "address", "monitor")

    def contribute(self, data, context):
        context = super(SetLBDetails, self).contribute(data, context)
        return context

    template_name = "project/loadbalancersv2/launch_lb.html"


class UploadSSLAction(workflows.Action):
    update_cert = forms.BooleanField(label='Update SSL Certificate',
                                     required=False,
                                     widget=forms.HiddenInput())

    cert_name = forms.CharField(max_length=80,
                                label=_("Certificate Name"),
                                required=False)

    cert = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}),
                           label=_("Certificate"),
                           required=False,
                           help_text=_("Certificate"))

    private_key = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}),
                                  label=_("Private Key"),
                                  required=False,
                                  help_text=_("Private Key"))

    chain_cert = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}),
                                 label=_("Certificate Chain (Optional)"),
                                 required=False,
                                 help_text=_("Intermediate Chain"
                                             " Certificates"))

    def clean(self):
        cleaned_data = super(UploadSSLAction, self).clean()
        data = self.data
        protocol = data.get('source_type')
        if protocol == 'HTTPS':
            use_common_cert = data.get('use_common_cert')
            if not use_common_cert:
                # check to see if ssl cert is provided
                cert_name = data.get('cert_name')
                cert = data.get('cert')
                private_key = data.get('private_key')

                if (not cert_name) \
                    or (not cert) \
                        or (not private_key):
                    raise forms.ValidationError(
                        _('Please provide all certificate parameters.'))
        return cleaned_data

    class Meta(object):
        name = _("SSL Certificate")
        help_text_template = ("project/loadbalancersv2/_ssl_cert_help.html")


class UploadSSLStep(workflows.Step):
    action_class = UploadSSLAction
    contributes = ("cert_name", "cert",
                   "private_key", "chain_cert", 'use_common_cert')
    template_name = "project/loadbalancersv2/ssl_cert.html"

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
        return context


class SelectInstancesAction(workflows.MembershipAction):
    instance_details = {}

    def __init__(self, request, *args, **kwargs):
        super(SelectInstancesAction, self).__init__(request, *args, **kwargs)
        err_msg = _('Unable to retrieve members list. '
                    'Please try again later.')

        default_role_field_name = self.get_default_role_field_name()
        self.fields[default_role_field_name] = forms.CharField(required=False,
                                                               label='')
        self.fields[default_role_field_name].initial = 'member'

        role_member_field_name = self.get_member_field_name('member')
        self.fields[role_member_field_name] = forms.MultipleChoiceField(
            required=False, label='')

        # Get list of available instances
        all_instances = []
        try:
            all_instances, has_more_data = nova.server_list(request)
        except Exception:
            exceptions.handle(request, err_msg)

        available_instances = []
        for instance in all_instances:
            # skip shutoff instances
            # if instance.status == 'SHUTOFF':
            #     continue
            instance_ip = self.get_ip(instance)
            # skip instances which has no network
            if not instance_ip:
                continue
            key = instance_ip
            value = instance.name + ' (' + self.get_ip(instance) + ')'
            available_instances.append((key, value))
            self.instance_details[instance_ip] = (instance.name, instance.id)

        self.fields[self.get_member_field_name('member')].\
            choices = available_instances

    def get_ip(self, instance):
        ipaddress = None
        for networks in instance.addresses.itervalues():
            for ip in networks:
                # only one IP present
                ipaddress = ip
                break
        if ipaddress is not None:
            addr = ipaddress["addr"]
        else:
            addr = None  # '10.10.10.10'
        return addr

    def clean(self):
        cleaned_data = super(SelectInstancesAction, self).clean()
        members = cleaned_data.get(self.get_member_field_name('member'), None)
        if not members:
            raise forms.ValidationError(
                _('Please select at least one member'))
        return cleaned_data

    class Meta(object):
        name = _("Instances")
        slug = "select_instances"


class SelectInstancesStep(workflows.UpdateMembersStep):
    action_class = SelectInstancesAction
    help_text = _("Please select a list of instances that should handle"
                  " traffic for this target load balancer. All instances "
                  "must reside in the same Project as the target load "
                  "balancer.")
    available_list_title = _("All Instances")
    members_list_title = _("Selected Instances")
    no_available_text = _("No instances found.")
    no_members_text = _("No members enabled.")
    show_roles = False
    contributes = (
        "wanted_members", "instances_details", "monitor", "instance_port")
    template_name = "horizon/common/_workflow_step_update_members.html"

    def contribute(self, data, context):
        request = self.workflow.request
        if data:
            context["wanted_members"] = request.POST.getlist(
                self.get_member_field_name('member'))
            context["instances_details"] = self.action.instance_details
            context["monitor"] = request.POST.get("monitor")
            context["instance_port"] = request.POST.get("instance_port")
        return context


class SelectMonitorAction(workflows.Action):
    MONITOR_CHOICES = (
        ("tcp", _("TCP")),
        ("ping", _("PING")),
        ("http", _("HTTP")),
    )
    monitor = forms.ChoiceField(label=_("Monitor"),
                                choices=MONITOR_CHOICES)

    interval = forms.IntegerField(label=_("Health Check Interval"
                                          " (in seconds)"),
                                  required=False,
                                  min_value=1,
                                  max_value=600,
                                  help_text=_("Health Check Interval"
                                              " (in seconds)"))

    timeout = forms.IntegerField(label=_("Retry count before markdown"),
                                 required=False,
                                 min_value=1,
                                 max_value=100,
                                 help_text=_("Number of times health check "
                                             "should be attempted before "
                                             "marking down a member"))

    send = forms.CharField(widget=forms.Textarea(attrs={'rows': 1}),
                           label=_("Send String"),
                           required=False,
                           help_text=_("Send String"))

    receive = forms.CharField(widget=forms.Textarea(attrs={'rows': 1}),
                              label=_("Receive String"),
                              required=False,
                              help_text=_("Receive String"))

    class Meta(object):
        name = _("Monitor")
        help_text_template = ("project/loadbalancersv2/_monitor_help.html")


class SelectMonitorStep(workflows.Step):
    action_class = SelectMonitorAction
    contributes = ("monitor", "interval", "timeout", "send", "receive")
    template_name = "project/loadbalancersv2/_monitor_create.html"

    def contribute(self, data, context):
        post = self.workflow.request.POST

        context['interval'] = post['interval'] if 'interval' in post else ''
        context['timeout'] = post['timeout'] if 'timeout' in post else ''
        context['send'] = post['send'] if 'send' in post else ''
        context['receive'] = post['receive'] if 'receive' in post else ''
        return context


class LaunchLoadBalancer(workflows.Workflow):
    slug = "launch_loadbalancer"
    name = _("Launch Load Balancer")
    finalize_button_name = _("Launch")
    success_message = _('Launched %(count)s named "%(name)s".')
    failure_message = _('Unable to launch %(count)s named "%(name)s".')
    success_url = "horizon:project:loadbalancersv2:index"
    default_steps = (SetLBDetails,
                     UploadSSLStep,
                     SelectMonitorStep,
                     SelectInstancesStep,
                     )
    attrs = {'data-help-text': 'LB creation may take a few minutes'}

    def format_status_message(self, message):
        name = self.context.get('name', 'unknown loadbalancer')
        count = self.context.get('count', 1)
        if int(count) > 1:
            return message % {"count": _("%s loadbalancers") % count,
                              "name": name}
        else:
            return message % {"count": _("loadbalancer"), "name": name}

    def handle(self, request, context):
        try:
            protocol = context['source_type']
            address = context['address']
            if not address\
                    or address == "new":
                address = ''
            else:
                tokens = address.split(':')
                address = tokens[0]

            api.lbaasv2.\
                create_loadbalancer_full(request,
                                         address=address,
                                         name=context['name'],
                                         description=context['description'],
                                         lb_method=context['lb_method'],
                                         monitor=context['monitor'],
                                         protocol=protocol,
                                         port=context[protocol],
                                         instance_port=context['instance_port'],  # noqa
                                         wanted_members=context['wanted_members'],  # noqa
                                         instances_details=context['instances_details'],  # noqa
                                         cert_name=context['cert_name'],
                                         cert=context['cert'],
                                         private_key=context['private_key'],
                                         chain_cert=context['chain_cert'],
                                         use_common_cert=True if
                                            context['use_common_cert'] == 'on'
                                            else False,
                                         interval=context['interval'],
                                         timeout=context['timeout'],
                                         send=context['send'],
                                         receive=context['receive'],
                                         )
            return True
        except Exception as e:
            exceptions.handle(request, e.message, ignore=False)
            return False
