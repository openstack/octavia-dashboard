function octavia_dashboard_install {
    setup_develop $OCTAVIA_DASHBOARD_DIR
}

function octavia_dashboard_configure {
    cp $OCTAVIA_DASHBOARD_ENABLE_FILE_PATH \
        $HORIZON_DIR/openstack_dashboard/local/enabled/
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
        # Initialize and start the Octavia dashboard service
        echo_summary "Initializing octavia-dashboard"
    fi
fi

if [[ "$1" == "unstack" ]]; then
    # Shut down Octavia dashboard services
    :
fi

if [[ "$1" == "clean" ]]; then
    # Remove state and transient data
    # Remember clean.sh first calls unstack.sh

    # Remove octavia-dashboard enabled file and pyc
    rm -f "$HORIZON_DIR"/openstack_dashboard/local/enabled/"$OCTAVIA_DASHBOARD_ENABLE_FILE_NAME"*
fi
