/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const path = require('path');
const debug = require('gulp-debug');

const lint = async () => {
    return gulp.src([
        './lib/**/*.js',
    ], {
        base: path.join(__dirname, '..')
    }).pipe(debug()).pipe(eslint({configFile:'../../.eslintrc'})).pipe(eslint.format()).pipe(eslint.failAfterError());
};

exports.lint = lint;
