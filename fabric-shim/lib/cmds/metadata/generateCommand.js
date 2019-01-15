/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const Generate = require ('./lib/generate.js');

module.exports.command = 'generate [options]';
module.exports.desc = 'Generate a file containing the metadata from the deployed contract';
module.exports.builder = (yargs) => {
    yargs.options({
        'file-name': {alias: 'f', required: false, describe: 'The file name/path to save the generated metadata file', type: 'string'},
        'module-path': {alias: 'p', required: false, type: 'string', default: process.cwd()}
    });
    yargs.usage('fabric-chaincode-node metadata generate --file-name "fileName"');

    return yargs;
};

module.exports.handler = (argv) => {
    return argv.thePromise = Generate.handler(argv);
};
