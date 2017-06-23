#!/bin/bash

# This script will be executed inside post_test_hook function in devstack gate

set -x

DIR=${BASH_SOURCE%/*}
source $DIR/commons $@

set +e
cd /opt/stack/new/octavia-dashboard
sudo -H -u stack tox -e py27integration
retval=$?
set -e

if [ -d ${OCTAVIA_DASHBOARD_SCREENSHOTS_DIR}/ ]; then
  cp -r ${OCTAVIA_DASHBOARD_SCREENSHOTS_DIR}/ /home/jenkins/workspace/gate-octavia-dashboard-dsvm-integration/
fi
exit $retval
