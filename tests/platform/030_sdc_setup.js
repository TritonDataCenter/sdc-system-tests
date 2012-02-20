#!/usr/bin/node

var test = require('tap').test;
var child = require('child_process');

test("Install headnode zones", { timeout: 600000 }, function(t) {
    t.plan(1);
    child.exec("sdc-setup -c headnode -A", 
        function(err, stdout, stderr){
            t.equal(err, null, "sdc-setup exited cleanly");
            
            // What else should we test for here?
            t.end();
        }
    );
});

test("Services come up as expected", function(t) {
    t.plan(3);
    
    child.exec('svcs -xvZ', function(err, stdout, stderr){
        t.equal(stdout, '', "svcs -xvZ shows no output on stdout");
        t.equal(stderr, '', "svcs -xvZ shows no output on stderr");
        t.equal(err, null, "svcs -xvZ exited cleanly");
        t.end();
    });

});

test("Check SDC health", function(t){
    t.plan(3);
    child.exec('/smartdc/bin/sdc-healthcheck -p', function(err, stdout, stderr){
        t.equal(err, null, "sdc-healthcheck exited cleanly");
        t.notEqual(stdout, '', "service output is not blank");
        t.notLike(stdout, new RegExp('(?:offline|svc-err)','gm'), "no services showing as offline");
        t.end()
    });
});

