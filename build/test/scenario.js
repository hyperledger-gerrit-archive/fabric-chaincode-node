/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const gulp = require('gulp');
const shell = require('gulp-shell');
const rename = require('gulp-rename');
const wait = require('gulp-wait');
const util = require('util');
const fs = require('fs-extra');
const path = require('path');
let runSequence = require('run-sequence');
const log = require('fancy-log');
const test = require('../../test/base.js');
const packageJson = '{' +
'  "name": "smartcontract-test",' +
'  "version": "1.0.0-snapshot",' +
'  "description": "Test suite for fabric-shim",' +
'  "license": "Apache-2.0",' +
'  "scripts": { "start" : "startChaincode" },'+
'  "dependencies": {' +
'    "fabric-shim": "file:./fabric-shim",' +
'    "fabric-shim-crypto": "file:./fabric-shim-crypto",' +
'    "chai": "^4.1.1",' +
'    "chai-as-promised": "^7.1.1"' +
'  }' +
'}';

const execFile = util.promisify(require('child_process').execFile);
const CHANNEL_NAME = 'mychannel';
const CC_NAME = 'mysmartcontract';
const tls = process.env.TLS ? process.env.TLS : 'false';
const delay = require('delay');

gulp.task('test-scenario',['invokeAllFns']);

/**
 * Invoke all the smart contract functions
 */
gulp.task('invokeAllFns',(done)=>{

    let tasks = [
        // ensure that the fabric is setup and the chaincode has been constructed
        'st-copy-chaincode',

        // install
        'st-install_chaincode',

        // instantiate
        // 'st-instantiate_chaincode',

        // invoke all functions
        // 'invoke_functions'

    ];

    runSequence(...tasks,done);
    // gulp.series(...tasks,(done)=>{done();});

});

gulp.task('delay',()=>{
    log('waiting for 3seconds...');
    return delay(3000);
});

/** */
function getTLSArgs() {
    let args = '';
    if (tls === 'true') {
        args = util.format('--tls %s --cafile %s', tls,
            '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem');
    }
    return args;
}

gulp.task('invoke_functions',async (done)=>{

    let options={};
    let script = 'docker';
    let args = util.format('exec cli peer chaincode invoke %s -C %s -n %s -c %s',
        getTLSArgs(),
        CHANNEL_NAME,
        CC_NAME,
        '\'{"Args":["get"]}\'').split(' ');

    const {error, stdout, stderr} = await execFile(script,args, options);

    if (error){
        done(error);
    }

    // validate the stdout/stderr
    console.log(stdout);
    console.log(stderr);
    done();

});


gulp.task('st-copy-shim', ['protos'], () => {
    // first ensure the chaincode folder has the latest shim code
    let srcPath = path.join(__dirname, '../../src/**');
    let destPath = path.join(test.BasicNetworkTestDir, 'src/mysmartcontract.v0/node_modules/fabric-shim');
    fs.ensureDirSync(destPath);
    log('hello'+destPath);
    return gulp.src(srcPath)
        .pipe(gulp.dest(destPath));
});

gulp.task('st-copy-shim-crypto', ['st-copy-shim'], () => {
    // first ensure the chaincode folder has the latest shim code
    let srcPath = path.join(__dirname, '../../fabric-shim-crypto/**');
    let destPath = path.join(test.BasicNetworkTestDir, 'src/mysmartcontract.v0/node_modules/fabric-shim-crypto');
    fs.ensureDirSync(destPath);

    return gulp.src(srcPath)
        .pipe(gulp.dest(destPath));
});

gulp.task('st-copy-chaincode', ['st-copy-shim-crypto'], () => {

    // create a package.json in the chaincode folder
    let destPath = path.join(test.BasicNetworkTestDir, 'src/mysmartcontract.v0/package.json');
    fs.writeFileSync(destPath, packageJson, 'utf8');

    // copy the test.js to chaincode folder
    let srcPath = path.join(__dirname, '../../test/scenario/*.js');
    destPath = path.join(test.BasicNetworkTestDir, 'src/mysmartcontract.v0');
    return gulp.src(srcPath)
        .pipe(gulp.dest(destPath));
});

// make sure `gulp channel-init` is run first
gulp.task('st-install_chaincode', () => {
    return gulp.src('*.js', {read: false})
        .pipe(shell([
            util.format('docker exec cli peer chaincode install -l node -n %s -v v0 -p %s',
                'mysmartcontract',
                // the /etc/hyperledger/config has been mapped to the
                // basic-network folder in the test setup for the CLI docker
                '/etc/hyperledger/config/src/mysmartcontract.v0')

        ]));
});

gulp.task('st-instantiate_chaincode', () => {
    return gulp.src('*.js', {read: false})
        .pipe(shell([
            util.format('docker exec cli peer chaincode instantiate -o %s %s -l node -C %s -n %s -v v0 -c %s -P %s',
                'orderer.example.com:7050',
                getTLSArgs(),
                CHANNEL_NAME,
                'mysmartcontract',
                '\'{"Args":["setup"]}\'',
                '\'OR ("Org1MSP.member")\'')
        ]));
});