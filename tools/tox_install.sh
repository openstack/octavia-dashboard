#!/usr/bin/env bash

# Many of horizon's repos suffer from the problem of depending on horizon,
# but it not existing on pypi.

# This wrapper for tox's package installer will use the existing package
# if it exists, else use zuul-cloner if that program exists, else grab it
# from horizon master via a hard-coded URL. That last case should only
# happen with devs running unit tests locally.

# From the tox.ini config page:
# install_command=ARGV
# default:
# pip install {opts} {packages}

ZUUL_CLONER=/usr/zuul-env/bin/zuul-cloner
BRANCH_NAME=master

install_project() {
    local project=$1
    local branch=${2:-$BRANCH_NAME}
    local PROJECT_DIR=$HOME/$project
    local ZUULV3_PROJECT_DIR=$HOME/src/git.openstack.org/openstack/$project

    set +e
    project_installed=$(echo "import $project" | python 2>/dev/null ; echo $?)
    set -e

    # The devstack based functional tests have project checked out in
    # $PROJECT_DIR on the test systems - with the change to test in it.
    # Use this directory if it exists, so that this script installs the
    # project version to test here.
    # Note that the functional tests use sudo to run tox and thus
    # variables used for zuul-cloner to check out the correct version are
    # lost.
    if [ -d "$ZUULV3_PROJECT_DIR" ]; then
        echo "FOUND $project code at $ZUULV3_PROJECT_DIR - using"
        $install_cmd -U $ZUULV3_PROJECT_DIR
    elif [ -d "$PROJECT_DIR" ]; then
        echo "FOUND $project code at $PROJECT_DIR - using"
        $install_cmd -U $PROJECT_DIR
    elif [ $project_installed -eq 0 ]; then
        echo "ALREADY INSTALLED" > /tmp/tox_install.txt
        location=$(python -c "import $project; print($project.__file__)")
        echo "ALREADY INSTALLED at $location"

        echo "$project already installed; using existing package"
    elif [ -x "$ZUUL_CLONER" ]; then
        echo "ZUUL CLONER" > /tmp/tox_install.txt
        # Make this relative to current working directory so that
        # git clean can remove it. We cannot remove the directory directly
        # since it is referenced after $install_cmd
        mkdir -p .tmp
        PROJECT_DIR=$(/bin/mktemp -d -p $(pwd)/.tmp)
        pushd $PROJECT_DIR
        $ZUUL_CLONER --cache-dir \
            /opt/git \
            --branch $branch \
            http://git.openstack.org \
            openstack/$project
        cd openstack/$project
        $install_cmd .
        popd
    else
        echo "PIP HARDCODE" > /tmp/tox_install.txt
        if [ -z "$PIP_LOCATION" ]; then
            PIP_LOCATION="git+https://git.openstack.org/openstack/$project@$branch#egg=$project"
        fi
        $install_cmd -U ${PIP_LOCATION}
    fi
}

# Client constraint file contains this client version pin that is in conflict
# with installing the client from source. We should remove the version pin in
# the constraints file before applying it for from-source installation.

CONSTRAINTS_FILE="$1"
shift 1

set -e
set -x

# NOTE(tonyb): Place this in the tox enviroment's log dir so it will get
# published to logs.openstack.org for easy debugging.
localfile="$VIRTUAL_ENV/log/upper-constraints.txt"

if [[ "$CONSTRAINTS_FILE" != http* ]]; then
    CONSTRAINTS_FILE="file://$CONSTRAINTS_FILE"
fi
# NOTE(tonyb): need to add curl to bindep.txt if the project supports bindep
curl "$CONSTRAINTS_FILE" --insecure --progress-bar --output "$localfile"

pip install -c"$localfile" openstack-requirements

# This is the main purpose of the script: Allow local installation of
# the current repo. It is listed in constraints file and thus any
# install will be constrained and we need to unconstrain it.
edit-constraints "$localfile" -- "$CLIENT_NAME"

install_cmd="pip install -c$localfile"

install_project horizon

$install_cmd -U $*
exit $?
