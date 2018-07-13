/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

// This is the optimistic end-to-end flow that exercise the
// chaincode shim APIs under the controlled flow:
//
// install -> instantiate -> invoke -> query -> upgrade -> invoke -> query
//
// other error-inducing flows can be found in other files in this folder
'use strict';

const gulp = require('gulp');
const shell = require('gulp-shell');
const wait = require('gulp-wait');
const util = require('util');
const fs = require('fs-extra');
const path = require('path');

const constants = require('../../test/constants.js');

const packageJson = '{' +
'  "name": "fabric-shim-test",' +
'  "version": "1.0.0-snapshot",' +
'  "description": "Test suite for fabric-shim",' +
'  "license": "Apache-2.0",' +
'  "scripts": { "start" : "node test.js" },'+
'  "dependencies": {' +
'    "fabric-shim": "file:./fabric-shim",' +
'    "fabric-shim-crypto": "file:./fabric-shim-crypto",' +
'    "chai": "^4.1.1",' +
'    "chai-as-promised": "^7.1.1"' +
'  }' +
'}';
const tls = process.env.TLS ? process.env.TLS : 'false';
const CC_NAME = 'mycc';
const CC2_NAME = 'mycc2';
const CHANNEL_NAME = 'mychannel';
function getTLSArgs() {
	let args = '';
	if (tls === 'true') {
		args = util.format('--tls %s --cafile %s', tls,
			'/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem');
	}
	return args;
}
gulp.task('copy-shim', ['protos'], () => {
	// first ensure the chaincode folder has the latest shim code
	let srcPath = path.join(__dirname, '../../src/**');
	let destPath = path.join(constants.BasicNetworkTestDir, 'src/mycc.v0/fabric-shim');
	fs.ensureDirSync(destPath);
	return gulp.src(srcPath)
		.pipe(gulp.dest(destPath));
});

gulp.task('copy-shim-crypto', ['copy-shim'], () => {
	// first ensure the chaincode folder has the latest shim code
	let srcPath = path.join(__dirname, '../../fabric-shim-crypto/**');
	let destPath = path.join(constants.BasicNetworkTestDir, 'src/mycc.v0/fabric-shim-crypto');
	fs.ensureDirSync(destPath);
	return gulp.src(srcPath)
		.pipe(gulp.dest(destPath));
});

gulp.task('copy-chaincode', ['copy-shim-crypto'], () => {
	// create a package.json in the chaincode folder
	let destPath = path.join(constants.BasicNetworkTestDir, 'src/mycc.v0/package.json');
	fs.writeFileSync(destPath, packageJson, 'utf8');

	// copy the test.js to chaincode folder
	let srcPath = path.join(__dirname, '../../test/integration/test.js');
	destPath = path.join(constants.BasicNetworkTestDir, 'src/mycc.v0');
	return gulp.src(srcPath)
		.pipe(gulp.dest(destPath));
});

// make sure `gulp channel-init` is run first
gulp.task('test-e2e-install-v0', ['copy-chaincode'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(shell([
			util.format('docker exec cli peer chaincode install -l node -n %s -v v0 -p %s',
				CC_NAME,
				// the /etc/hyperledger/config has been mapped to the
				// basic-network folder in the test setup for the CLI docker
				'/etc/hyperledger/config/src/mycc.v0'),
			util.format('docker exec cli peer chaincode install -l node -n %s -v v0 -p %s',
				CC2_NAME,
				// the /etc/hyperledger/config has been mapped to the
				// basic-network folder in the test setup for the CLI docker
				'/etc/hyperledger/config/src/mycc.v0'),

		]));
});

gulp.task('test-e2e-instantiate-v0', ['test-e2e-install-v0'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(shell([
			util.format('docker exec cli peer chaincode instantiate -o %s %s -l node -C %s -n %s -v v0 -c %s -P %s',
				'orderer.example.com:7050',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["init"]}\'',
				'\'OR ("Org1MSP.member")\''),
			util.format('docker exec cli peer chaincode instantiate -o %s %s -l node -C %s -n %s -v v0 -c %s -P %s',
				'orderer.example.com:7050',
				getTLSArgs(),
				CHANNEL_NAME,
				CC2_NAME,
				'\'{"Args":["init", "mycc2"]}\'',
				'\'OR ("Org1MSP.member")\'')

		]));
});

gulp.task('test-e2e-invoke-v0-test1-test2', ['test-e2e-instantiate-v0'], () => {
	return gulp.src('*.js', {read: false})
		// because the peer CLI for the instantiate call returns
		// before the transaction gets committed to the ledger, we
		// introduce a wait for 3 sec before running the invoke
		.pipe(wait(3000))
		.pipe(shell([
			// test1 and test2 of the chaincode are independent of each other,
			// can be called in parallel
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test1"]}\''),
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test2"]}\'')
		]));
});

gulp.task('test-e2e-invoke-v0-test3', ['test-e2e-invoke-v0-test1-test2'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test3"]}\'')
		]));
});

gulp.task('test-e2e-invoke-v0-test4', ['test-e2e-invoke-v0-test3'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test4"]}\'')
		]));
});

gulp.task('test-e2e-invoke-v0-test5', ['test-e2e-invoke-v0-test4'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test5"]}\'')
		]));
});


gulp.task('test-e2e-invoke-v0-test6', ['test-e2e-invoke-v0-test5'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test6"]}\'')
		]));
});

gulp.task('test-e2e-invoke-v0-test7', ['test-e2e-invoke-v0-test6'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test7"]}\'')
		]));
});

gulp.task('test-e2e-invoke-v0-test8', ['test-e2e-invoke-v0-test7'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test8"]}\'')
		]));
});

gulp.task('test-e2e-invoke-v0-test9', ['test-e2e-invoke-v0-test8'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test9"]}\'')
		]));
});

gulp.task('test-e2e-invoke-v0-test10', ['test-e2e-invoke-v0-test9'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test10"]}\'')
		]));
});

// Test encryption support in fabric-shim-crypto
gulp.task('test-e2e-invoke-v0-test11', ['test-e2e-invoke-v0-test10'], () => {
	const cmd = 'docker exec cli peer chaincode invoke %s -C %s -n %s -c %s --transient ' +
				'\'{"encrypt-key":"MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=","iv":"MDEyMzQ1Njc4OTAxMjM0NQ=="}\'';

	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			// values of "encrypt-key" and "iv" below are base64 encoded 32-byte and 16-byte strings respectively
			util.format(cmd,
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test11","newkey","newvalue"]}\'')
		]));
});

// Test decryption support in fabric-shim-crypto
gulp.task('test-e2e-invoke-v0-test12', ['test-e2e-invoke-v0-test11'], () => {
	const cmd = 'docker exec cli peer chaincode query %s -C %s -n %s -c %s --transient ' +
				'\'{"encrypt-key":"MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=","iv":"MDEyMzQ1Njc4OTAxMjM0NQ=="}\'';

	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			// values of "encrypt-key" and "iv" below must be the same as those used to encrypt
			util.format(cmd,
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test12","newkey","newvalue"]}\'')
		]));
});

// Test decryption support in fabric-shim-crypto
gulp.task('test-e2e-invoke-v0-test13', ['test-e2e-invoke-v0-test12'], () => {
	const cmd = 'docker exec cli peer chaincode invoke %s -C %s -n %s -c %s --transient ' +
				'\'{"sign-key":"LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tTUlHSEFnRUFNQk1HQnlxR1NNNDlB' +
				'Z0VHQ0NxR1NNNDlBd0VIQkcwd2F3SUJBUVFnWllNdmYzdzVWa3p6c1RRWUk4WjhJWHVHRlptbWZqSVg' +
				'yWVNTY3FDdkFraWhSQU5DQUFTNkJoRmdXL3EwUHpya3dUNVJsV1R0NDFWZ1hMZ3VQdjZRS3ZHc1c3U3' +
				'FLNlRrY0NmeHNXb1NqeTYvcjFTenpUTW5pM0o4aVFSb0ozcm9QbW94UExLNC0tLS0tRU5EIFBSSVZBV' +
				'EUgS0VZLS0tLS0="}\'';

	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			// value of "sign-key" below is a base64 encoded private key PEM
			util.format(cmd,
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test13","newkey1","newvalue"]}\'')
		]));
});

// Test decryption support in fabric-shim-crypto
gulp.task('test-e2e-invoke-v0-test14', ['test-e2e-invoke-v0-test13'], () => {
	const cmd = 'docker exec cli peer chaincode query %s -C %s -n %s -c %s --transient ' +
				'\'{"sign-key":"LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tTUlHSEFnRUFNQk1HQnlxR1NNNDlB' +
				'Z0VHQ0NxR1NNNDlBd0VIQkcwd2F3SUJBUVFnWllNdmYzdzVWa3p6c1RRWUk4WjhJWHVHRlptbWZqSVg' +
				'yWVNTY3FDdkFraWhSQU5DQUFTNkJoRmdXL3EwUHpya3dUNVJsV1R0NDFWZ1hMZ3VQdjZRS3ZHc1c3U3' +
				'FLNlRrY0NmeHNXb1NqeTYvcjFTenpUTW5pM0o4aVFSb0ozcm9QbW94UExLNC0tLS0tRU5EIFBSSVZBV' +
				'EUgS0VZLS0tLS0="}\'';

	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			// value of "sign-key" below must be the same as those used to sign above
			util.format(cmd,
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test14","newkey1","newvalue"]}\'')
		]));
});

// Test invoke where chaincode responds with an error
gulp.task('test-e2e-invoke-v0-test15', ['test-e2e-invoke-v0-test14'], () => {
	return gulp.src('*.js', {read: false})
		.pipe(wait(3000))
		.pipe(shell([
			util.format('docker exec cli peer chaincode invoke %s -C %s -n %s -c %s',
				getTLSArgs(),
				CHANNEL_NAME,
				CC_NAME,
				'\'{"Args":["test15"]}\'')
		]));
});

gulp.task('test-e2e', ['test-e2e-invoke-v0-test15']);
