/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const path = require('path');

gulp.task('lint', function () {
	return gulp.src([
		'**/*.js',
		'!src/node_modules/**',
		'!test/node_modules/**',
		'!test/typescript/*.js',
		'!coverage/**',
		'!docs/**'
	], {
		base: path.join(__dirname, '..')
	}).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failAfterError());
});
