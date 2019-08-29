=================
Octavia Dashboard
=================

Team and repository tags
========================

.. image:: https://governance.openstack.org/tc/badges/octavia-dashboard.svg
    :target: https://governance.openstack.org/tc/reference/tags/index.html

.. Change things from this point on

octavia-dashboard
=================

Horizon panels for Octavia

* Free software: Apache license
* Documentation: https://docs.openstack.org/octavia-dashboard/latest/
* Source: https://opendev.org/openstack/octavia-dashboard
* Release notes: https://docs.openstack.org/releasenotes/octavia-dashboard/
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
   to ``openstack_dashboard/local/enabled``::

    $ cp -a \
      ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard/enabled/_1482_*.py \
      ${HORIZON_DIR}/openstack_dashboard/local/enabled/

3. (Optional) Generate the policy file and copy into horizon's policy files
   folder, and copy ``_1499_load_balancer_settings.py`` in
   ``octavia_dashboard/local_settings.d`` directory
   to ``openstack_dashboard/local/local_settings.d``::

    $ oslopolicy-policy-generator \
      --config-file \
      ${OCTAVIA_DIR}/etc/policy/octavia-policy-generator.conf \
      --output-file \
      ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard/conf/octavia_policy.yaml
    $ cp -a \
      ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard/conf/octavia_policy.yaml \
      ${HORIZON_DIR}/openstack_dashboard/conf/
    $ cp -a \
      ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard/local_settings.d/_1499_*.py \
      ${HORIZON_DIR}/openstack_dashboard/local/local_settings.d/

4. Django has a compressor feature that performs many enhancements for the
   delivery of static files. If the compressor feature is enabled in your
   environment (``COMPRESS_OFFLINE = True``), run the following commands::

    $ ./manage.py collectstatic
    $ ./manage.py compress

5. Finally restart your web server to enable octavia-dashboard
   in your Horizon::

    $ sudo service apache2 restart
