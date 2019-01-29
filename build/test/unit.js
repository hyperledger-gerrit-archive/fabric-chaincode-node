/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const gulp = require('gulp');
const npm = require('../npm.js');

gulp.task('typescript_check', async() => {
    await npm.run.compile.prefix('fabric-contract-api').spawn(process.cwd());
    await npm.run.compile.prefix('fabric-shim').spawn(process.cwd());
});

gulp.task('test-headless',  ['clean-up', 'lint', 'typescript_check', 'protos', 'test-schema'], async () => {
    await npm.run.prefix('fabric-contract-api').test.spawn(process.cwd());
    await npm.run.prefix('fabric-shim').test.spawn(process.cwd());
    await npm.run.prefix('fabric-shim-crypto').test.spawn(process.cwd());
});
