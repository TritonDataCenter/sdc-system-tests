#!/usr/bin/node
/*
 * Test creation of an incremental custom image.
 */

var DEBUG = true;
var debug = console.log;
if (!DEBUG) {
    debug = function () {};
}

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


test('custom image (base 13.1.0)', function (t) {
    var data = {
        name: 'incremental-image',
        version: '1.0.0'
    };
    var base_uuid = 'f669428c-a939-11e2-a485-b790efc0f0c1';
    var restricted_package = '9b81f74c-7535-428f-91f6-92f7c5876a45';
    var six5server = '44454c4c-3700-104e-8033-cac04f475131';
    var old7server = '44454c4c-3700-104d-8032-cac04f475131';

    var motd = 'booga booga';
    var cmd1 = format('%s/mk-custom-image %s "%s" \'%s\' %s',
        __dirname, base_uuid, motd, JSON.stringify(data), restricted_package);
    var options = {
        //maxBuffer: 2*1024*1024,  // suggested if TRACE is on
        env: {
            //"TRACE": "1"
        }
    };
    exec(cmd1, options, function (err1, stdout1, stderr1) {
        t.ifError(err1, format('error running "%s":\n'
            + '  err: %s\n'
            + '  stdout: %s\n'
            + '  stderr: %s', cmd1, err1, stdout1, stderr1));
        if (err1) {
            return t.end();
        }
        var customImageUuid = stdout1.trim().split(/\n/g).slice(-1);
        var cmd2 = format('%s/try-custom-image %s "%s" %s',
            __dirname, customImageUuid, motd, old7server);
        exec(cmd2, function (err2, stdout2, stderr2) {
            t.ifError(err2, format('error running "%s":\n'
                + '  err: %s\n'
                + '  stdout: %s\n'
                + '  stderr: %s', cmd2, err2, stdout2, stderr2));
            var cmd3 = format('%s/try-custom-image %s "%s" %s',
                __dirname, customImageUuid, motd, six5server);
            exec(cmd3, function (err3, stdout3, stderr3) {
                t.ifError(err3, format('error running "%s":\n'
                    + '  err: %s\n'
                    + '  stdout: %s\n'
                    + '  stderr: %s', cmd3, err3, stdout3, stderr3));
                var cmd4 = format('%s/try-custom-image %s "%s" %s',
                  __dirname, customImageUuid, motd);
                // CloudAPI provision test (Don't bypass DAPI)
                exec(cmd4, function (err4, stdout4, stderr4) {
                    t.ifError(err4, format('error running "%s":\n'
                        + '  err: %s\n'
                        + '  stdout: %s\n'
                        + '  stderr: %s', cmd4, err4, stdout4, stderr4));
                    var cmd5 = '/opt/smartdc/bin/sdc-imgadm delete ' + customImageUuid;
                    exec(cmd5, function (err5, stdout5, stderr5) {
                        t.ifError(err5, format('error running "%s":\n'
                            + '  err: %s\n'
                            + '  stdout: %s\n'
                            + '  stderr: %s', cmd5, err5, stdout5, stderr5));
                        t.end();
                    });
                });
            });
        });
    });
});
