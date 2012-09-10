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

start_time=$(date +%s)

TOP=$(cd $(dirname $0)/; pwd)
TAP=./node_modules/tap/bin/tap.js


cd $TOP

# Setup a clean output dir.
OUTPUT_DIR=/var/tmp/systests
echo "# Setup a clean output dir ($OUTPUT_DIR)."
rm -rf $OUTPUT_DIR
mkdir -p $OUTPUT_DIR

echo ""
echo "# Run sdc-system-tests."
test_files=$(ls -1 test/*.test.js)
if [[ -n "$test_files" ]]; then
    PATH=/usr/node/bin:$PATH TAP=1 $TAP $test_files \
        | tee $OUTPUT_DIR/sdc-system-tests.tap
fi

echo ""
echo "# Run node-sdc-clients tests."
PATH=/usr/node/bin:$PATH ./node_modules/sdc-clients/test/runtests \
    | tee $OUTPUT_DIR/node-sdc-clients.tap


# Colored summary of results (borrowed from smartos-live.git/src/vm/run-tests).
echo ""
echo "# test results:"

end_time=$(date +%s)
elapsed=$((${end_time} - ${start_time}))

tests=$(grep "^# tests [0-9]" $OUTPUT_DIR/*.tap | cut -d ' ' -f3 | xargs | tr ' ' '+' | bc)
passed=$(grep "^# pass  [0-9]" $OUTPUT_DIR/*.tap | tr -s ' ' | cut -d ' ' -f3 | xargs | tr ' ' '+' | bc)
[[ -z ${tests} ]] && tests=0
[[ -z ${passed} ]] && passed=0
fail=$((${tests} - ${passed}))

echo "# Completed in ${elapsed} seconds."
echo -e "# \033[32mPASS: ${passed} / ${tests}\033[39m"
if [[ ${fail} -gt 0 ]]; then
    echo -e "# \033[31mFAIL: ${fail} / ${tests}\033[39m"
fi
echo ""

if [[ ${tests} != ${passed} ]]; then
    exit 1
fi

