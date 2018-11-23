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
    setMetadata(metadata) {
        this.metadata = metadata;
    }
    /**
     * Gets meta data associated with this Chaincode deployment
     */
    async GetMetadata() {
        return this.metadata;
    }

}

module.exports = SystemContract;
