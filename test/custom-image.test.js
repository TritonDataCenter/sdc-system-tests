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

var data = {
    name: 'incremental-image',
    version: '1.0.0'
};

var base_uuid = 'f669428c-a939-11e2-a485-b790efc0f0c1';
var base_kvm_uuid = '30e9e4c8-bbf2-11e2-ac3b-3b598ee13393';
var restricted_package = '92e2b20a-0c37-11e3-9605-63a778146273';
var kvm_restricted_package = 'a3501ccc-0c37-11e3-965d-ef7e825515c9';
var six5server = '44454c4c-3700-104e-8033-cac04f475131';
var old7server = '44454c4c-3700-104d-8032-cac04f475131';

var motd = 'booga booga';

test('custom image (base 13.1.0) on 6.5 CN', function(t) {
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
            __dirname, customImageUuid, motd, six5server);
        exec(cmd2, function (err2, stdout2, stderr2) {
            t.ifError(err2, format('error running "%s":\n'
                + '  err: %s\n'
                + '  stdout: %s\n'
                + '  stderr: %s', cmd2, err2, stdout2, stderr2));
            var cmd3 = '/opt/smartdc/bin/sdc-imgadm delete ' + customImageUuid;
            exec(cmd3, function (err3, stdout3, stderr3) {
                t.ifError(err3, format('error running "%s":\n'
                        + '  err: %s\n'
                        + '  stdout: %s\n'
                        + '  stderr: %s', cmd3, err3, stdout3, stderr3));
                    t.end();
            });
        });
    });
});

test('custom image (base 13.1.0) on latest 7.0 CN with CloudAPI & DAPI', function(t) {
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
        var cmd2 = format('%s/try-custom-image %s "%s"',
            __dirname, customImageUuid, motd);
        exec(cmd2, function (err2, stdout2, stderr2) {
            t.ifError(err2, format('error running "%s":\n'
                + '  err: %s\n'
                + '  stdout: %s\n'
                + '  stderr: %s', cmd2, err2, stdout2, stderr2));
            var cmd3 = '/opt/smartdc/bin/sdc-imgadm delete ' + customImageUuid;
            exec(cmd3, function (err3, stdout3, stderr3) {
                t.ifError(err3, format('error running "%s":\n'
                        + '  err: %s\n'
                        + '  stdout: %s\n'
                        + '  stderr: %s', cmd3, err3, stdout3, stderr3));
                    t.end();
            });
        });
    });
});

test('custom KVM image (base CentOS6)', function(t) {
    var cmd1 = format('%s/mk-custom-image %s "%s" \'%s\' %s',
        __dirname, base_kvm_uuid, motd, JSON.stringify(data), kvm_restricted_package);
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
        var cmd2 = format('%s/try-custom-image %s "%s"',
            __dirname, customImageUuid, motd);
        exec(cmd2, function (err2, stdout2, stderr2) {
            t.ifError(err2, format('error running "%s":\n'
                + '  err: %s\n'
                + '  stdout: %s\n'
                + '  stderr: %s', cmd2, err2, stdout2, stderr2));
            var cmd3 = '/opt/smartdc/bin/sdc-imgadm delete ' + customImageUuid;
            exec(cmd3, function (err3, stdout3, stderr3) {
                t.ifError(err3, format('error running "%s":\n'
                        + '  err: %s\n'
                        + '  stdout: %s\n'
                        + '  stderr: %s', cmd3, err3, stdout3, stderr3));
                    t.end();
            });
        });
    });
});
