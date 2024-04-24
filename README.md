<!--
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
-->

<!--
    Copyright (c) 2014, Joyent, Inc.
    Copyright 2024 MNX Cloud, Inc.
-->

# sdc-system-tests

This repository is part of the Triton Data Center project. For contribution
guidelines, issues, and general documentation, visit the main
[Triton](http://github.com/TritonDataCenter/triton) project page.

A repo to hold general Triton system tests -- i.e. those independent of tests
in specific service repos.


# Building

    make release


# Testing

Get a build (see above) package to an SDC headnode global zone (e.g. in CoaL)
and run its `runtests`. E.g.:

    cd /var/tmp
    gtar xf sdc-system-tests-version.tgz
    bash /var/tmp/sdc-system-tests-$version/runtests

