function octavia_dashboard_install {
    setup_develop ${OCTAVIA_DASHBOARD_DIR}
}

function octavia_dashboard_configure {
    cp -a ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard/enabled/_1482_project_load_balancer_panel.py ${HORIZON_DIR}/openstack_dashboard/local/enabled/
    cp -a ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard/local_settings.d/_1499_load_balancer_settings.py ${HORIZON_DIR}/openstack_dashboard/local/local_settings.d/
    oslopolicy-policy-generator --config-file ${OCTAVIA_DIR}/etc/policy/octavia-policy-generator.conf --output-file ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard/conf/octavia_policy.yaml
    cp -a ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard/conf/octavia_policy.yaml ${HORIZON_DIR}/openstack_dashboard/conf/
    if [[ -d ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard/locale ]]; then
        (cd ${OCTAVIA_DASHBOARD_DIR}/octavia_dashboard; DJANGO_SETTINGS_MODULE=openstack_dashboard.settings $PYTHON ../manage.py compilemessages)
    fi
}

if is_service_enabled horizon && is_service_enabled o-api; then
    if [[ "$1" == "stack" && "$2" == "install" ]]; then
        # Perform installation of service source
        echo_summary "Installing octavia-dashboard"
        octavia_dashboard_install
    elif [[ "$1" == "stack" && "$2" == "post-config" ]]; then
        echo_summary "Configuring octavia-dashboard"
        octavia_dashboard_configure
    elif [[ "$1" == "stack" && "$2" == "extra" ]]; then
        :
    fi

    if [[ "$1" == "unstack" ]]; then
        :
    fi

    if [[ "$1" == "clean" ]]; then
        # Remove state and transient data
        # Remember clean.sh first calls unstack.sh
        rm -f ${HORIZON_DIR}/openstack_dashboard/local/enabled/_1482_project_load_balancer_panel.py*
        rm -f ${HORIZON_DIR}/openstack_dashboard/local/local_settings.d/_1499_load_balancer_settings.py*
        rm -f ${HORIZON_DIR}/openstack_dashboard/conf/octavia_policy.yaml
    fi
fi
