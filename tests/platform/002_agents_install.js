#!/usr/bin/node

var test = require('tap').test;
var child = require('child_process');

// This test is to check for regressions against AGENT-420
test("Agents are installed", function(t) {
    t.plan(3);

    child.exec("find /opt/smartdc/agents/bin/ -follow -type f ! -perm -a+x",
        function(err, stdout, stderr){
            t.equal(err, null, "Agents bin directory exists");
            t.equal(stdout, '', "No un-executable scripts are linked to");
            t.equal(stderr, '', "No output on stderr");
            t.end();
        });
        
});

