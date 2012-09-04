#!/usr/node/bin/node
/*
 * Check for regression of AGENT-420.
 */

var test = require('tap').test;
var exec = require('child_process').exec;

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
