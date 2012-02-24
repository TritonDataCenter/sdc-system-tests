#!/usr/bin/node

var test = require('tap').test;
var async = require('async');
var child = require('child_process');
var fs = require('fs');

test("Check SDC health", function(t){
    t.plan(3);
    child.exec('/smartdc/bin/sdc-healthcheck -p', function(err, stdout, stderr){
        t.equal(err, null, "sdc-healthcheck exited cleanly");
        t.notEqual(stdout, '', "service output is not blank");
        t.unlike(stdout, new RegExp('(?:offline|svc-err)','gm'), "no services showing as offline");
        t.end()
    });
});

test("Check services (all zones) status", function(t){
    t.plan(3);
    child.exec('/usr/bin/svcs -xvZ', function(err, stdout, stderr){
        t.equal(stdout, '', "svcs -xvZ shows no output on stdout");
        t.equal(stderr, '', "svcs -xvZ shows no output on stderr");
        t.equal(err, null, "svcs -xvZ exited cleanly");
        t.end();
    });

});

test("Check release.json is in place and looks good", function(t){
    t.plan(5);

    var release_obj = JSON.parse(fs.readFileSync('/usbkey/release.json'));
    t.ok(release_obj.version, "has a version");
    t.ok(release_obj.branch, "has a branch");
    t.ok(release_obj.describe, "has a describe");
    t.ok(release_obj.timestamp, "has a timestamp");
    t.like(release_obj.timestamp, /^\d{8}T\d{6}Z$/, "timestamp is correct format");
    t.end();

});

test("Check platform version numbers", function(t){
    t.plan(7);

    async.series([
        function(cb){
            child.exec('/usr/bin/uname -v', function(err, stdout, stderr){
                cb(null, { err: err, stdout: stdout, stderr: stderr });
            });
        },
        function(cb){
            fs.readdir('/usbkey/os', function(err, files){
                cb(null, { err: err, files: files });
            });
        },
        function(cb){
            fs.readlink('/usbkey/os/latest', function(err, linkpath){
                cb(null, { err: err, link: linkpath });
            });
        }
    ],
    function(err, results){
        // uname -v
        var platform_dir = results[0].stdout.replace("\n", '');
        t.like(platform_dir, /joyent_\d{8}T\d{6}Z/, "uname -v format is correct");
        t.equal(results[0].err, null, "uname -v exited cleanly");
        t.equal(results[0].stderr, '', "uname -v has nothing on stderr");

        platform_dir = platform_dir.replace('joyent_', '');
        // /usbkey/os contents
        t.equal(results[1].files.length, 2, "There are only 2 entries in /usbkey/os");
        t.equivalent(results[1].files.sort(), ['latest', platform_dir].sort(), "/usbkey/os entries are as expected");
        t.equal(results[1].err, null, "no errors reading /usbkey/os");

        // Ensure /usbkey/os/latest points to the correct place
        t.equal(results[2].link, platform_dir, "/usbkey/os/latest link is correct");
        t.end();
    });
     
});


test("Check zpool and correct datasets", function(t){

    async.series([
        function(cb){
            // check for zpool 'zones' existinga
            // zones    42681237504 5303693824  37377543680 12  100 ONLINE  -
            //
            child.exec('/usr/sbin/zpool list -Hp zones', function(err, stdout, stderr){
                cb(null, { err: err, stdout: stdout, stderr: stderr });
            });
        },
        function(cb){
            child.exec('/usr/sbin/zfs list -Hp -d 1 -o name -t filesystem zones | ' +
                    '/usr/bin/grep -v "[0-9a-z]\\{8\\}-[0-9a-z]\\{4\\}-[0-9a-z]\\{4\\}-[0-9a-z]\\{4\\}"',
                function(err, stdout, stderr){
                    var ds_list = stdout.replace(/\n+$/, '');
                    ds_list = ds_list.split("\n").filter(
                        function(element, index, array){ 
                            return element != '' && element != 'zones';
                        }
                    );
                    cb(null, { err: err, ds_list: ds_list });
                }
            );
        },
        function(cb){
            child.exec('/usr/sbin/zfs list -Hp -d 1 -o name -t volume zones | ' +
                    '/usr/bin/grep -v "[0-9a-z]\\{8\\}-[0-9a-z]\\{4\\}-[0-9a-z]\\{4\\}-[0-9a-z]\\{4\\}"',
                function(err, stdout, stderr){
                    var vol_list = stdout.replace(/\n+$/, '');
                    vol_list = vol_list.split("\n");
                    cb(null, { err: err, vol_list: vol_list });
                }
            );
        } 
    ], 
    function(err, results){
        t.plan(8);

        t.equal(results[0].err, null, "zpool listing for 'zones' exited cleanly");
        t.like(results[0].stdout, /^zones\s+?\d+?\s+?/, "zpool zones is listed");
        t.equal(results[0].stderr, '', "no output on stderr");
                    
        // This is a list of known datasets _other_ than any UUID imported datasets
        // this may change over time, but we should be careful of those changes
        var known_ds = ['zones/config', 'zones/cores', 'zones/opt', 'zones/var', 'zones/usbkey'];
        t.equal(results[1].err, null, "filesystems listing exited cleanly");
        t.equivalent(results[1].ds_list.sort(), known_ds.sort(), "Expected datasets exist");
                    
        var known_zvols = ['zones/swap', 'zones/dump'];
        t.equal(results[2].err, null, "volumess listing exited cleanly");
        t.equivalent(results[2].vol_list.sort(), known_zvols.sort(), "Expected volumes exist");
       
        t.ok(fs.statSync('/zones/.system_pool'), ".system_pool file exists");
        t.end();
    });

    // zones/.system_pool
});
