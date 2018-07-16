/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const path = require('path');
const shim = require('../shim/chaincode');
const ChaincodeFromSmartContract = require('./chaincodefromsmartcontract');
const Logger = require('../shim/logger');

const logger = Logger.getLogger('contracts-spi/bootstrap.js');
/**
 * This provides SPI level functions to 'bootstrap' or 'get the chaincode going'
 * This is achieved through introspection of the package.json that defines the
 * node module
 */

/**
 *
 * @param {SmartContract} contracts contract to register to use
 */
function register(contracts){
    shim.start(new ChaincodeFromSmartContract(contracts));
}

/**
 * This is the main entry point for starting the user's chaincode
 */
function go(){

    let jsonPath = path.resolve(__dirname,'..','..','..','package.json');
    // let's find the package.json file
    let json = require(jsonPath);
    logger.debug('starting up and reading package.json at %s',jsonPath);
    logger.debug(json);
    if (json.contracts){
        logger.debug('Using contracts spec in the package.json');
        // this is the declaratitivee way of specifing the classes that should be used.
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
        register(r.contracts);
    } else  {
        throw new Error('Can not detect any of the indications of how this is a contact instaance');
    }

}

module.exports.bootstrap = go;
module.exports.register = register;