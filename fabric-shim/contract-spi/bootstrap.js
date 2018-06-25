/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const path = require('path');
const shim = require('../shim/chaincode');
const ChaincodeFromContract = require('./chaincodefromcontract');
const Logger = require('../shim/logger');

const logger = Logger.getLogger('contracts-spi/bootstrap.js');
/**
 * This provides SPI level functions to 'bootstrap' or 'get the chaincode going'
 * This is achieved through introspection of the package.json that defines the
 * node module
 */

/**
 *
 * @param {Contract} contracts contract to register to use
 */
function register(contracts){
	console.log(contracts);
	shim.start(new ChaincodeFromContract(contracts));
}

/**
 * This is the main entry point for starting the user's chaincode
 */
function go(){

	let jsonPath = path.resolve(__dirname,'..','..','..','package.json');
	console.log(jsonPath);
	// let's find the package.json file
	let json = require(jsonPath);
	logger.debug('starting up and reading package.json at %s',jsonPath);
	logger.debug(json);
	if (json.contracts){
		logger.debug('Using contracts spec in the package.json');
		// this is the declaratitive way of specifing the classes that should be used.
		if (json.contracts.classes){
			let classesToRegister = json.contracts.classes.map((value)=>{
				let p =(path.resolve(__dirname,'..','..',value));
				let r= require(p);
				return r;
			});
			register(classesToRegister);
		} else {
			throw new Error('Contracts element specified in package.json, but the contents are not usable');
		}
	} else if (json.main){
		logger.debug('Using the main entry %s',json.main);

		let p = (path.resolve(__dirname,'..','..','..',json.main));
		let r = require(p);

		if (r.contracts){
			register(r.contracts);
		}else {
			register([r]);
		}
	} else  {
		throw new Error('Can not detect any of the indications of how this is a contact instaance');
	}

}

module.exports.bootstrap = go;
module.exports.register = register;