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
 * Check for regression of AGENT-420.
 */

var exec = require('child_process').exec;

// node-tap API
if (require.cache[__dirname + '/helper.js'])
    delete require.cache[__dirname + '/helper.js'];
var helper = require('./helper.js');
var after = helper.after;
var before = helper.before;
var test = helper.test;



// This test is to check for regressions against AGENT-420
test("AGENT-420", function(t) {
    exec("/usr/bin/find /opt/smartdc/agents/bin/ -follow -type f ! -perm -a+x",
        function(err, stdout, stderr){
            t.equal(err, null, "Agents bin directory exists");
            t.equal(stdout, '', "No un-executable scripts are linked to");
            t.equal(stderr, '', "No output on stderr");
            t.end();
        }
    );
});
