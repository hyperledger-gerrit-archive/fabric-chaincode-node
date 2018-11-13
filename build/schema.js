/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

/* eslint-disable no-console*/
'use strict';

const gulp = require('gulp');
// const debug = require('gulp-debug');
// const path = require('path');
// const fs = require('fs');

const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

gulp.task('test-schema', async () => {
    const options = {};
    const script = 'npm';
    const args = util.format('run --prefix fabric-contract-api schema:test').split(' ');

    const {error, stdout, stderr} = await execFile(script, args, options);
    if (error) {
        throw error;
    } else {
        // validate the stdout/stderr
        console.log(stdout);
        console.log(stderr);
    }

});




