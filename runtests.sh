#!/bin/bash

#set -o errexit
#set -o pipefail
set -o xtrace

ROOT=$(pwd)

# Explicitly set PATH
PATH=/usr/node/bin:/usr/bin:/usr/sbin:/opt/smartdc/bin:/opt/local/bin:/opt/local/sbin:/opt/smartdc/agents/bin
export PATH

rm -rf ./tap_output
mkdir -p ./tap_output

# enable tests
touch /lib/sdc/.sdc-test-no-production-data

# Run pre-sdc-setup tests
(
    LIST_OF_TESTS=`find tests/platform -type f -name 'pre-*' | sort`
    IFS=$'\n'
    mkdir -p $ROOT/tap_output/platform
    for tap_test in $LIST_OF_TESTS; do
        tap_out=$(echo $tap_test | sed 's#^tests/##g')
        tap_out=$(echo $tap_out | sed 's#/#__#g')
        tap_out+=".tap"
        # we want to continue running through all tests even if some fail
        ./node_modules/tap/bin/tap.js --timeout 1200 --tap $tap_test > ./tap_output/platform/$tap_out 2>/dev/null || true
    done
)

# Agent Tests
(
    export AMQP_HOST=`bash /lib/sdc/config.sh -json | json rabbitmq_admin_ip` 
    export SERVER_UUID=`sysinfo | json UUID`
    export NODE_PATH="/usr/vm/node_modules:/usr/node_modules"

    # Dataset Manager
    cd /opt/smartdc/agents/lib/node_modules/dataset_manager
    zpool list nodezfstest 2>/dev/null || bash ./mktestpool.sh
    LIST_OF_TESTS=`find tests -type f -name 'test-*.js' | sort`
    IFS=$'\n'
    mkdir -p ${ROOT}/tap_output/dataset_manager
    for tap_test in $LIST_OF_TESTS; do
        tap_out=$(echo $tap_test | sed 's#^tests/##g')
        tap_out=$(echo $tap_out | sed 's#/#__#g')
        tap_out+=".tap"
        # we want to continue running through all tests even if some fail
        ./node_modules/.bin/nodeunit --reporter tap $tap_test > ${ROOT}/tap_output/dataset_manager/$tap_out 2>/dev/null || true
    done

    # Provisioner
    cd /opt/smartdc/agents/lib/node_modules/provisioner-v2
    LIST_OF_TESTS=`find test -type f -name 'test-*.js' | sort`
    IFS=$'\n'
    mkdir -p ${ROOT}/tap_output/provisioner
    for tap_test in $LIST_OF_TESTS; do
        tap_out=$(echo $tap_test | sed 's#^test/##g')
        tap_out=$(echo $tap_out | sed 's#/#__#g')
        tap_out+=".tap"
        # we want to continue running through all tests even if some fail
        ./node_modules/.bin/nodeunit --reporter tap $tap_test > ${ROOT}/tap_output/provisioner/$tap_out 2>/dev/null || true
    done
)

# VM Tests
if [[ -d "/usr/vm/test" ]]; then
    mkdir -p ${ROOT}/tap_output/vm-tests
    # run in subshell so pwd is not affected
    (
       cd /usr/vm/test
       for t in $(ls tests/*.js); do
           ./runtest ${t} > ${ROOT}/tap_output/vm-tests/vm-$(basename ${t} .js).tap 2>/dev/null || true
       done
    )
fi

# Run post-sdc-setup tests
(
    LIST_OF_TESTS=`find tests/platform -type f -name 'post-*' | sort`
    IFS=$'\n'
    mkdir -p $ROOT/tap_output/platform
    for tap_test in $LIST_OF_TESTS; do
        tap_out=$(echo $tap_test | sed 's#^tests/##g')
        tap_out=$(echo $tap_out | sed 's#/#__#g')
        tap_out+=".tap"
        # we want to continue running through all tests even if some fail
        ./node_modules/tap/bin/tap.js --timeout 1200 --tap $tap_test > ./tap_output/platform/$tap_out 2>/dev/null || true
    done
)

tar -czf tap_output.tgz tap_output/
