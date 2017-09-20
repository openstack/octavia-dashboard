========================
Team and repository tags
========================

.. image:: https://governance.openstack.org/tc/badges/octavia-dashboard.svg
    :target: https://governance.openstack.org/tc/reference/tags/index.html

.. Change things from this point on

=================
octavia-dashboard
=================

Horizon panels for Octavia

* Free software: Apache license
* Documentation: https://docs.openstack.org/developer/octavia-dashboard
* Source: https://git.openstack.org/cgit/openstack/octavia-dashboard
* Bugs: https://storyboard.openstack.org/#!/project/909

Features
--------

* Please see octavia repository


Howto
-----

1. Package the octavia_dashboard by running::

    python setup.py sdist

   This will create a python egg in the dist folder, which can be used to
   install on the horizon machine or within horizon's python virtual
   environment.

2. Copy ``_1482_project_load_balancer_panel.py`` in
   ``octavia_dashboard/enabled`` directory
   to ``openstack_dashboard/local/enabled``.

3. (Optional) Copy the policy file into horizon's policy files folder, and
   add this config ``POLICY_FILES``::

    'octavia': 'octavia_policy.json',

4. Django has a compressor feature that performs many enhancements for the
   delivery of static files. If the compressor feature is enabled in your
   environment (``COMPRESS_OFFLINE = True``), run the following commands::

    $ ./manage.py collectstatic
    $ ./manage.py compress

5. Finally restart your web server to enable octavia-dashboard
   in your Horizon::

    $ sudo service apache2 restart
