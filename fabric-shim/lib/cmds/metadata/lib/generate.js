/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';
const path = require('path');
const fs = require('fs-extra');
const ChaincodeFromContract = require('../../../contract-spi/chaincodefromcontract.js');
const Bootstrap = require('../../../contract-spi/bootstrap.js');
const Logger = require('../../../logger');
const logger = Logger.getLogger('../../../cmds/metadata/lib/generate');
const util = require('util');

/**
 * fabric-chaincode-node "metadata generate" command
 * @private
 */
class Generate {
    /**
     * This is the main entry point for starting the user's chaincode
     * @ignore
     */
    static async handler(opts) {
        // load up the meta data that the user may have specified
        // this will need to passed in and rationalized with the code as implemented
        const fileMetadata = await Bootstrap.getMetadata(opts['module-path']);
        const {contracts, serializers, title, version} = Bootstrap.getInfoFromContract(opts['module-path']);
        const chaincode = new ChaincodeFromContract(contracts, serializers, fileMetadata, title, version);
        if (opts.fileName) {
            const fileName = path.extname(opts.fileName) === '' ? opts.fileName + '.json' : opts.fileName;
            const filePath = path.resolve(process.cwd(), fileName);
            await fs.writeJSON(filePath, chaincode.metadata);
            logger.info(`File containing metadata has been saved to ${filePath}`);
        } else {
            logger.info('Metadata is : \n', util.inspect(chaincode.metadata, {depth: Infinity}));
        }
    }
}
module.exports = Generate;

