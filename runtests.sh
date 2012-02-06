#!/bin/bash

set -o errexit
set -o pipefail


rm -rf ./tap_output
mkdir -p ./tap_output

LIST_OF_TESTS=`find tests/platform -type f | sort`
IFS=$'\n'
for tap_test in $LIST_OF_TESTS; do
    tap_out=$(echo $tap_test | sed 's#^tests/##g')
    tap_out=$(echo $tap_out | sed 's#/#__#g')
    tap_out+=".tap"
    # we want to continue running through all tests even if some fail
    ./node_modules/tap/bin/tap.js --tap $tap_test > ./tap_output/$tap_out || true
done

tar -czf tap_output.tgz tap_output/ 
