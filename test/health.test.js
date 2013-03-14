#!/usr/bin/node
/*
 * Test general health of the SDC core setup.
 */

var exec = require('child_process').exec;
var fs = require('fs');
var format = require('util').format;

var async = require('async');

// node-tap API
if (require.cache[__dirname + '/helper.js'])
    delete require.cache[__dirname + '/helper.js'];
var helper = require('./helper.js');
var after = helper.after;
var before = helper.before;
var test = helper.test;



test("all sdc zones setup successfully", function(t){
    exec('/opt/smartdc/bin/sdc-vmapi /vms '
         + '| json -H -c tags.smartdc_role '
         + '    -c \'tags.smartdc_role !== "portal"\' '
         + '    -aj server_uuid uuid alias',
        function (err, stdout, stderr) {
            t.ifError(err, 'get smartdc_role vms');
            try {
                var vms = JSON.parse(stdout);
            } catch (syntaxErr) {
                t.ifError(syntaxErr, syntaxErr);
            }
            async.forEachSeries(vms, function (vm, next) {
                var cmd = format('/opt/smartdc/bin/sdc-oneachnode -n %s '
                    + 'ls /zones/%s/root/var/svc/setup_complete >/dev/null',
                    vm.server_uuid, vm.uuid);
                exec(cmd, function (vmErr, vmStdout, vmStderr) {
                    t.ifError(vmErr,
                        format('does vm %s (%s) on CN %s have a '
                            + '"/var/svc/setup_complete"? vmErr=%s',
                            vm.uuid, vm.alias, vm.server_uuid, vmErr));
                    next();
                });
            }, function (anyErr) {
                t.ifError(anyErr, anyErr);
                t.end();
            });
        }
    );
});


test("sdc-healthcheck", function(t){
    exec('/opt/smartdc/bin/sdc-healthcheck -p', function(err, stdout, stderr){
        t.equal(err, null, "sdc-healthcheck exited cleanly");
        t.notEqual(stdout, '', "service output is not blank");
        var bad = /(?:offline|svc-err)/gm;
        t.notOk(bad.test(stdout), "no services showing as offline");
        t.end()
    });
});

test("svcs -xvZ", function(t){
    exec('/usr/bin/svcs -xvZ', function(fullErr, fullStdout, fullStderr) {
        var cmdSansPortal = '/usr/bin/svcs -xvZ | grep "Zone:" '
            + '| grep -v $(vmadm lookup -1 alias=portal0)';
        exec(cmdSansPortal, function(err, stdout, stderr) {
            t.equal(stdout, '', format(
                "svcs -xvZ shows no output on stdout (ignore portal0): stdout=%j",
                fullStdout));
            t.equal(stderr, '', format(
                "svcs -xvZ shows no output on stderr (ignore portal0): stderr=%j",
                fullStderr));
            t.end();
        });
    });
});

test("platform version numbers", function(t){
    async.series([
        function(cb){
            exec('/usr/bin/uname -v', function(err, stdout, stderr){
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
        t.ok(/joyent_\d{8}T\d{6}Z/.test(platform_dir), "uname -v format is correct");
        t.equal(results[0].err, null, "uname -v exited cleanly");
        t.equal(results[0].stderr, '', "uname -v has nothing on stderr");
        platform_dir = platform_dir.replace('joyent_', '');

        // /usbkey/os contents
        t.ifError(results[1].err, '/usbkey/os could be read');
        var os_files = results[1].files;
        t.ok(~os_files.indexOf(platform_dir), 'platform is in /usbkey/os');
        t.ok(~os_files.indexOf('latest'), '/usbkey/os/latest exists');

        // Ensure /usbkey/os/latest points to the correct place
        t.equal(results[2].link, platform_dir, "/usbkey/os/latest link is correct");
        t.end();
    });

});


test("zpool and correct datasets", function(t){

    async.series([
        function(cb){
            // check for zpool 'zones' existing
            //  zones    42681237504 5303693824  37377543680 12  100 ONLINE  -
            exec('/usr/sbin/zpool list -Hp zones', function(err, stdout, stderr){
                cb(null, { err: err, stdout: stdout, stderr: stderr });
            });
        },
        function(cb){
            exec('/usr/sbin/zfs list -Hp -d 1 -o name -t filesystem zones | ' +
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
            exec('/usr/sbin/zfs list -Hp -d 1 -o name -t volume zones | ' +
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
        t.equal(results[0].err, null, "zpool listing for 'zones' exited cleanly");
        var stdout = results[0].stdout;
        t.ok(/^zones\s+?\d+?\s+?/.test(stdout), "zpool zones is listed");
        t.equal(results[0].stderr, '', "no output on stderr");

        // This is a list of known datasets _other_ than any UUID imported datasets
        // this may change over time, but we should be careful of those changes
        t.equal(results[1].err, null, "filesystems listing exited cleanly");
        ['zones/config',
         'zones/cores',
         'zones/opt',
         'zones/var',
         'zones/usbkey'].forEach(function (knownDs) {
            t.ok(~results[1].ds_list.indexOf(knownDs),
                'expected dataset exists: '+knownDs);
        });

        var known_zvols = ['zones/swap', 'zones/dump'];
        t.equal(results[2].err, null, "volumes listing exited cleanly");
        t.deepEqual(results[2].vol_list.sort(), known_zvols.sort(),
            "expected volumes exist");

        t.ok(fs.statSync('/zones/.system_pool'), ".system_pool file exists");
        t.end();
    });

    // zones/.system_pool
});
