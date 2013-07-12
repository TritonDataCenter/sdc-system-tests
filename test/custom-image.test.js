#!/usr/bin/node
/*
 * Test creation of a custom image via cloudapi.
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
        name: 'custom-image',
        version: '1.0.0'
    };
    var base_uuid = 'f669428c-a939-11e2-a485-b790efc0f0c1';
    var motd = 'booga booga';
    var cmd = format('%s/mk-custom-image %s "%s" \'%s\'',
        __dirname, base_uuid, motd, JSON.stringify(data));
    var options = {
        env: {
            //"TRACE": "1"
        }
    };
    exec(cmd, options, function (err, stdout, stderr) {
        t.ifError(err, format('error running "%s":\n'
            + '  err: %s\n'
            + '  stdout: %s\n'
            + '  stderr: %s', cmd, err, stdout, stderr));
        if (err) {
            return t.end();
        }
        var customImageUuid = stdout.trim().split(/\n/g).slice(-1);
        var cmd = format('%s/try-custom-image %s "%s"',
            __dirname, customImageUuid, motd);
        exec(cmd, function (err, stdout, stderr) {
            t.ifError(err, format('error running "%s":\n'
                + '  err: %s\n'
                + '  stdout: %s\n'
                + '  stderr: %s', cmd, err, stdout, stderr));
            var cmd = 'sdc-imgadm delete ' + customImageUuid;
            exec(cmd, function (err, stdout, stderr) {
                t.ifError(err, format('error running "%s":\n'
                    + '  err: %s\n'
                    + '  stdout: %s\n'
                    + '  stderr: %s', cmd, err, stdout, stderr));
                t.end();
            });
        });
    });
});
