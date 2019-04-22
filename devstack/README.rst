=================================
Octavia dashboard devstack plugin
=================================

This directory contains the octavia-dashboard devstack plugin.

To enable the plugin, add the following to your local.conf:

    enable_plugin octavia-dashboard <octavia-dashboard GITURL> [GITREF]

where

    <octavia-dashboard GITURL> is the URL of a octavia-dashboard repository
    [GITREF] is an optional git ref (branch/ref/tag). The default is master.

For example:

    enable_plugin octavia-dashboard https://opendev.org/openstack/octavia-dashboard

Once you enable the plugin in your local.conf, ensure ``horizon`` and
``o-api`` services are enabled. If both of them are enabled,
octavia-dashboard will be enabled automatically
