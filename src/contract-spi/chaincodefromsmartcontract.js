/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const shim = require('../shim/chaincode');
const SmartContract = require('../contract-api/smartcontract');

const Logger = require('../shim/logger');
const logger = Logger.getLogger('contracts-spi/chaincodefromsmartcontract.js');

/**
 * The user will have written a class than extends the 'SmartContract' interface; this
 * is expressed in terms of domain specific functions - that need to be called in the
 * lower-level 'invoke' and 'init' functions.
 *
 * This class impelements the 'invoke' and 'init' functions and does the 'routing'
 *
 **/
class ChaincodeFromSmartContract {

    /**
     * Takes an array contract classes, and looks for the functions within those files.
     * Stores a reference to those, so they can be specifically called at a later time
     *
     * @param {SmartContract[]} contractClasses array of smart contracts to register
     */
    constructor(contractClasses) {

        // the structure that stores the 'function-pointers', contents of the form
        // {  namespace : { smartContractClass,  smartContract,  functionNames[] }}
        this.contracts = {};

        if (!contractClasses){
            throw new Error('Missing argument: array of contract classes');
        }

        for (let smartContractClass of contractClasses){

            const smartContract = new(smartContractClass);
            if (!(smartContract instanceof SmartContract)) {
                throw new Error(`invalid smart contract instance ${smartContract}`);
            }

            const propNames = Object.getOwnPropertyNames(Object.getPrototypeOf(smartContract));

            const functionNames = [];
            for (const propName of propNames) {
                const propValue = smartContract[propName];
                if (typeof propValue !== 'function') {
                    continue;
                } else if (propName === 'constructor') {
                    continue;
                }

                functionNames.push(propName);
            }
            let namespace = smartContract.$getNamespace();
            logger.debug(functionNames,smartContractClass,namespace);
            this.contracts[`${namespace}`] = { smartContractClass, smartContract, functionNames };
        }

    }

    /**
     * The init fn is called for updated and init operations; the user though can include any function
     * in these calls. Therefore we are giving the user the responsibility to put the correct function in
     *
     * @param {ChaincodeStub} stub Stub class giving the full api
     */
    async Init(stub) {
        return this.Invoke(stub);
    }

    /**
     * The invoke fn is called for all the invoke operations; init is also redirected to here
     *
     * @param {ChaincodeStub} stub Stub class giving the full api
     */
    async Invoke(stub) {
        try {
            const { fcn, params } = stub.getFunctionAndParameters();

            // special case to return meta-information
            if (fcn === '$getFunctions') {
                const result = await this.$getFunctions(stub);
                return shim.success(result);
            }

            let ns = fcn.split('_')[0];
            let fn = fcn.split('_')[1];

            if (!this.contracts[ns]){
                throw new Error(`Namespace is sadly not known :${ns}:`);
            }

            const functionExists = this.contracts[ns].functionNames.indexOf(fn) !== -1;
            if (functionExists) {
                // use the spread operator to make this pass the arguments seperately not as an arry
                const result = await this.contracts[ns].smartContract[fn](stub, ...params);
                return shim.success(result);
            } else {
                throw new Error(`No smart contract function ${fn}`);
            }
        } catch (error) {
            return shim.error(error);
        }
    }

    /**
     *
     * @param {ChaincodeStub} stub Stub class giving the full api
     */
    async $getFunctions(stub) {
        return Buffer.from(JSON.stringify(this.contracts));
    }

}

module.exports = ChaincodeFromSmartContract;