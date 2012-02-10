#!/bin/bash
#
# Copyright (c) 2012, Joyent, Inc. All Rights Reserved.
#

set -o errexit
set -o xtrace

dir=$1
if [[ -z ${dir} ]]; then
    echo "Usage: $0 <dir>" >&2
    exit 1
fi
dir=$(cd ${dir}; pwd)

if [[ ! -d ${dir} ]]; then
    echo "Invalid directory: ${dir}" >&2
    exit 1
fi

rm -rf ${dir}/illumos-live.tmp
git clone git@git.joyent.com:illumos-live.git ${dir}/illumos-live.tmp
(cd ${dir}/illumos-live.tmp/src/vm && ./tools/build-test-tarball.sh)

if [[ ! -f ${dir}/illumos-live.tmp/src/vm/tests.tar.gz ]]; then
    echo "Failed to create ${dir}/illumos-live.tmp/src/vm/tests.tar.gz" >&2
    exit 1
fi

mv ${dir}/illumos-live.tmp/src/vm/tests.tar.gz ${dir}/vm-tests.tgz
rm -rf ${dir}/illumos-live.tmp

exit 0
