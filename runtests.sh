#!/bin/bash
#
# Copyright (c) 2012, Joyent, Inc. All rights reserved.
#
# Run all sdc-system-tests.
#

if [ "$TRACE" != "" ]; then
    export PS4='${BASH_SOURCE}:${LINENO}: ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
    set -o xtrace
fi
set -o errexit
set -o pipefail



#---- support functions

function fatal
{
    echo "$(basename $0): fatal error: $*"
    exit 1
}



#---- mainline

START_TIME=$(date +%s)
TOP=$(cd $(dirname $0)/; pwd)
TAP=./node_modules/tap/bin/tap.js


cd $TOP

# Setup a clean output dir.
OUTPUT_DIR=/var/tmp/sdc-system-tests
echo "# Setup a clean output dir ($OUTPUT_DIR)."
rm -rf /var/tmp/sdc-system-tests
mkdir -p /var/tmp/sdc-system-tests

echo ""
test_files=$(ls -1 test/*.test.js)
if [[ -n "$test_files" ]]; then
    PATH=/usr/node/bin:$PATH TAP=1 $TAP $test_files \
        | tee $OUTPUT_DIR/sdc-system-tests.tap
fi

# See AGENT-465
## Agent Tests
#(
#    export AMQP_HOST=`bash /lib/sdc/config.sh -json | json rabbitmq_admin_ip`
#    export SERVER_UUID=`sysinfo | json UUID`
#    export NODE_PATH="/usr/vm/node_modules:/usr/node_modules"
#
#    # Provisioner
#    cd /opt/smartdc/agents/lib/node_modules/provisioner-v2
#    LIST_OF_TESTS=`find test -type f -name 'test-*.js' | sort`
#    IFS=$'\n'
#    mkdir -p ${TOP}/tap_output/provisioner
#    for tap_test in $LIST_OF_TESTS; do
#        tap_out=$(echo $tap_test | sed 's#^test/##g')
#        tap_out=$(echo $tap_out | sed 's#/#__#g')
#        tap_out+=".tap"
#        # we want to continue running through all tests even if some fail
#        ./node_modules/.bin/nodeunit --reporter tap $tap_test > ${TOP}/tap_output/provisioner/$tap_out 2>/dev/null || true
#    done
#)

## Run post-sdc-setup tests
#(
#    LIST_OF_TESTS=`find tests/platform -type f -name 'post-*' | sort`
#    IFS=$'\n'
#    mkdir -p $TOP/tap_output/platform
#    for tap_test in $LIST_OF_TESTS; do
#        tap_out=$(echo $tap_test | sed 's#^tests/##g')
#        tap_out=$(echo $tap_out | sed 's#/#__#g')
#        tap_out+=".tap"
#        # we want to continue running through all tests even if some fail
#        ./node_modules/tap/bin/tap.js --timeout 1200 --tap $tap_test > ./tap_output/platform/$tap_out 2>/dev/null || true
#    done
#)
#
#tar -czf tap_output.tgz tap_output/
