============
Installation
============

At the command line::

    $ pip install octavia-dashboard

Or, if you have virtualenvwrapper installed::

    $ mkvirtualenv octavia-dashboard
    $ pip install octavia-dashboard

To enable the panels in Horizon, copy _1482_project_load_balancer_panel.py in
octavia_dashboard/enabled directory to openstack_dashboard/local/enabled

(Optional) To enable policy enforcement at the Horizon level, copy the policy
file into horizon's policy files folder, and add this config ``POLICY_FILES``::

    'octavia': 'octavia_policy.json',

Django has a compressor feature that performs many enhancements for the
delivery of static files. If the compressor feature is enabled in your
environment (``COMPRESS_OFFLINE = True``), run the following commands::

    $ ./manage.py collectstatic
    $ ./manage.py compress

Finally restart your web server to enable octavia-dashboard in your Horizon:

Ubuntu::

      $ sudo service apache2 restart

Red Hat based::

      $ sudo systemctl restart httpd
