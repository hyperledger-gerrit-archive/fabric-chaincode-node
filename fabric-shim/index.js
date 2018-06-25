/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

// This is the underlying SPI level interface that all chaincode should implement
// Direct export of this is maintained for backward compatibility
module.exports = require('./lib/shim/chaincode.js');

// SPI function export
module.exports.spi = {
	startChaincode : require('./lib/contract-spi/bootstrap').bootstrap,
	registerContract : require('./lib/contract-spi/bootstrap.js').register,
	chaincodeInterface : require('./lib/shim/chaincode.js')
};