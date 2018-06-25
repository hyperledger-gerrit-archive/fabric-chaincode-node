'use strict';

const shim = require('../chaincode');
const SmartContract = require('./smartcontract');
const util = require('util');

/** setups to use a class that extends SmartContract */
class ChaincodeFromSmartContract {

    constructor(contractClasses) {

        this.contracts = {};

        // // const smartContractClass = require('.');
        for (let smartContractClass of contractClasses){
            
            const smartContract = new(smartContractClass);
            if (!(smartContract instanceof SmartContract.constructor)) {
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
                console.log(`found smart contract function ${propName}`);
                functionNames.push(propName);
            }
            let namespace = smartContract.sc_getNamespace();
            this.contracts[`${namespace}`] = { smartContractClass, smartContract, functionNames };
            // Object.assign(this, { smartContractClass, smartContract, functionNames });    
        }
        
    }

    async Init(stub) {
        try {
            const { fcn, params } = stub.getFunctionAndParameters();
            let ns = fcn.split("_")[0];
            let fn = fcn.split("_")[1];
            let { ns, fcn }  = ns_fn.split("_");


            const functionExists = this.contracts[ns].functionNames.indexOf(fn) !== -1;
            if (functionExists) {
                const result = await this.contracts[ns].smartContract[fn](stub, params);
                return shim.success(result);
            } else {
                return shim.success();
            }
        } catch (error) {
            return shim.error(error);
        }
    }

    async Invoke(stub) {
        try {
            const { fcn, params } = stub.getFunctionAndParameters();
            if (fcn === '$getFunctions') {
                const result = await this.$getFunctions(stub);
                return shim.success(result);
            }

            let ns = fcn.split("_")[0];
            let fn = fcn.split("_")[1];
            
            const functionExists = this.contracts[ns].functionNames.indexOf(fn) !== -1;
            if (functionExists) {
                const result = await this.contracts[ns].smartContract[fn](stub, params);
                return shim.success(result);
            } else {
                throw new Error(`no smart contract function ${fn}`);
            }
        } catch (error) {
            return shim.error(error);
        }
    }

    async $getFunctions(stub) {
        return Buffer.from(JSON.stringify(this.contracts));
    }

}

module.exports = ChaincodeFromSmartContract;