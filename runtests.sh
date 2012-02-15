#!/bin/bash

set -o errexit
set -o pipefail

ROOT=$(pwd)

rm -rf ./tap_output
mkdir -p ./tap_output

LIST_OF_TESTS=`find tests/platform -type f | sort`
IFS=$'\n'
for tap_test in $LIST_OF_TESTS; do
    tap_out=$(echo $tap_test | sed 's#^tests/##g')
    tap_out=$(echo $tap_out | sed 's#/#__#g')
    tap_out+=".tap"
    # we want to continue running through all tests even if some fail
    ./node_modules/tap/bin/tap.js --timeout 600 --diag $tap_test > ./tap_output/$tap_out || true
done

if [[ -f ${ROOT}/vm-tests.tgz && -d /usr/vm/test ]]; then
    mkdir /var/tmp/vm-test.$$
    mount -O -F lofs /var/tmp/vm-test.$$ /usr/vm/test
    # run in subshell so pwd is not affected
    (
       cd /usr/vm/test
       tar -zxf ${ROOT}/vm-tests.tgz
       for t in $(ls tests/*.js); do
           ./run-test ${t} > ${ROOT}/tap_output/vm-$(basename ${t} .js).tap
       done
    )
    umount /var/tmp/vm-test.$$
    rm -rf /var/tmp/vm-test.$$
fi

tar -czf tap_output.tgz tap_output/
