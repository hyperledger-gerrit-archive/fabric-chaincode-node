/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

// This is the underlying SPI level interface that all chaincode should implement
// Direct export of this is maintained for backward compatibility
module.exports = require('./shim/chaincode.js');

// the API - all contract code must extend this class
module.exports.contractapi = {
    Contract : require('./contract-api/contract.js')
};

// SPI function export
module.exports.spi = {
    startChaincode : require('./contract-spi/bootstrap').bootstrap,
    registerContract : require('./contract-spi/bootstrap.js').register,
    chaincodeInterface : require('./shim/chaincode.js')
};