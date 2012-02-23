#!/usr/bin/node

var test = require('tap').test;
var child = require('child_process');
var async = require('async');
var path = require('path');

test("Install headnode zones", { timeout: 1200000 }, function(t) {
    t.plan(1);
    child.exec("/smartdc/bin/sdc-setup -c headnode -A",
        function(err, stdout, stderr){
            t.equal(err, null, "sdc-setup exited cleanly");

            // What else should we test for here?
            t.end();
        }
    );
});

// While sdc-setup can return truthfully, we need to wait until the zones are "setup"
// before checking any further
function check_all_zones_are_up(cb){
    child.exec('/usr/sbin/vmadm lookup tags.smartdc_role=~.* alias=~0\\$',
        function(err, stdout, stderr){

            var output = stdout;
            output = output.replace(new RegExp('\n$','m'), '');
            var list_of_setup_files = [];
            output.split('\n').forEach(function(item){
                list_of_setup_files.push('/zones/'+item+'/root/var/svc/setup_complete');
            });

            async.every(list_of_setup_files, path.exists, function(result){
                cb(result);
            });
        }
    );
}

test("All zone setups are complete", { timeout: 1200000 }, function(t){
    t.plan(1);

    var zones_are_up = false;
    async.until(
        function () { return (zones_are_up === true); },
        function (cb){
            check_all_zones_are_up(function(result){
                zones_are_up = result;
                setTimeout(function(){
                    cb();
                }, 30000);
            });
        },
        function(err){
            t.ok(true, "All zones are setup");
            t.end();
        }
    );
});

test("Services come up as expected", function(t) {
    t.plan(3);

    child.exec('/usr/bin/svcs -xvZ', function(err, stdout, stderr){
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
        t.unlike(stdout, new RegExp('(?:offline|svc-err)$','gm'), "no services showing as offline");
        t.end()
    });
});

