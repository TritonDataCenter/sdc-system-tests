#!/usr/bin/node

var test = require('tap').test;
var async = require('async');
var child = require('child_process');
var fs = require('fs');

test("Check SDC health", function(t){
    t.plan(3);
    child.exec('/smartdc/bin/sdc-healthcheck -p', function(err, stdout, stderr){
        t.equal(err, null, "sdc-healthcheck exited cleanly");
        t.notEqual(stderr, '', "service output is not blank");
        t.notLike(stdout, /offline/g, "no services showing as offline");
        t.end()
    });
});

test("Check services status", function(t){
    t.plan(3);
    child.exec('svcs -xv', function(err, stdout, stderr){
        t.equal(stdout, '', "svcs -xv shows no output on stdout");
        t.equal(stderr, '', "svcs -xv shows no output on stderr");
        t.equal(err, null, "svcs -xv exited cleanly");
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
    t.like(release_obj.timestamp, new RegExp('^\d{8}T\d{6}Z$'), "timestamp is correct format");
    t.end();

});

test("Check platform version numbers", function(t){
    t.plan(7);

    async.series([
        function(cb){
            child.exec('uname -v', function(err, stdout, stderr){
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
        t.like(platform_dir, new RegExp('joyent_\d{8}T\d{6}Z'), "uname -v format is correct");
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

