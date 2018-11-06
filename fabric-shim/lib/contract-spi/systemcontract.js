/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';
const path = require('path');
const fs = require('fs-extra');
const Contract = require('fabric-contract-api').Contract;
const StartCommand = require('../cmds/startCommand.js');
const yargs = require('yargs');
const Ajv = require('ajv');

/**
 * This is a contract that determines functions that can be invoked to provide general information
 *
 * @class
 * @memberof fabric-contract-api
 */
class SystemContract extends Contract {

    constructor() {
        super('org.hyperledger.fabric');
    }

    /**
	 *
	 * @param {Object} chaincode
	 */
    _setChaincode(chaincode) {
        this.chaincode = chaincode;
    }
    /**
     * Gets meta data associated with this Chaincode deployment
     */
    async GetMetadata() {
        const opts = StartCommand.getArgs(yargs);
        const modPath = path.resolve(process.cwd(), opts['module-path']);
        const metadataPath = path.resolve(modPath, 'contract-metadata', 'metadata.json');
        const ajv = new Ajv();
        if (fs.pathExists(metadataPath) === true) {
            const readMetadata = await fs.readFile(metadataPath);
            const valid = ajv.validate((await fs.readFile('../utils/contact-schema')).toString(), readMetadata.toString());
            if (valid) {
                return readMetadata.toString();
            } else {
                throw new Error('Contract metadata does not match the schema');
            }
        }

        return JSON.stringify(this.chaincode.getContracts());
    }

}

module.exports = SystemContract;
