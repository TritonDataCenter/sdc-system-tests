#!/usr/node/bin/node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/*
 * Check for regression of PUBAPI-1003, i.e. ensure we don't
 * allow SSLv3 protocol.
 */

var exec = require('child_process').exec;

// node-tap API
if (require.cache[__dirname + '/helper.js'])
    delete require.cache[__dirname + '/helper.js'];
var helper = require('./helper.js');
var after = helper.after;
var before = helper.before;
var test = helper.test;



test('PUBAPI-1003', function (t) {
    exec('openssl s_client -ssl3 -no_tls1 -connect '
            + '$(vmadm lookup -j alias=cloudapi0 | json -a nics '
            + '| json -c \'this.nic_tag==="external"\' 0.ip):443',
        function (err, stdout, stderr) {
            t.ok(err, 'got an error (expected)');
            t.ok(stdout.indexOf('Secure Renegotiation IS NOT supported') !== -1,
                'did not find expected marker');
            t.end();
        }
    );
});
