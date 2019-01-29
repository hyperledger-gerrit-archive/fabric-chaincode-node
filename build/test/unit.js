/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const gulp = require('gulp');
const {npm} = require('../npm.js');

npm.useScript('compile');

gulp.task('typescript_check', async () => {
    await npm.run.compile.prefix('fabric-contract-api').spawn();
    await npm.run.compile.prefix('fabric-shim').spawn();
});

gulp.task('test-headless', ['clean-up', 'lint', 'typescript_check', 'protos', 'test-schema'], async () => {
    await npm.run.prefix('fabric-contract-api').test.spawn();
    await npm.run.prefix('fabric-shim').test.spawn();
    await npm.run.prefix('fabric-shim-crypto').test.spawn();
});
