/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const shim = require('../chaincode');

const Logger = require('../logger');
const logger = Logger.getLogger('contracts-spi/chaincodefromcontract.js');
const StartCommand = require('../cmds/startCommand.js');
const DataMarshall = require('./datamarshall.js');
const ClientIdentity = require('../chaincode').ClientIdentity;

const yargs = require('yargs');
const path = require('path');
const Ajv = require('ajv');

require('reflect-metadata');

/**
 * The user will have written a class than extends the 'Contract' interface; this
 * is expressed in terms of domain specific functions - that need to be called in the
 * lower-level 'invoke' and 'init' functions.
 *
 * This class implements the 'invoke' and 'init' functions and does the 'routing'
 * @ignore
 **/
class ChaincodeFromContract {

    /**
     * Takes an array contract classes, and looks for the functions within those files.
     * Stores a reference to those, so they can be specifically called at a later time
     *
     * @param {Contract[]} contractClasses array of  contracts to register
     */
    constructor(contractClasses, serializers, metadata = {}) {

        if (!contractClasses) {
            throw new Error('Missing argument: array of contract classes');
        }
        if (!serializers) {
            throw new Error('Missing argument: serialization implement information');
        }

        this.serializers = serializers;

        // always add in the 'meta' class that has general abilities
        // TODO
        const SystemContract = require('./systemcontract');
        contractClasses.push(SystemContract);

        // Produce the internal data structure that represents the code that is
        // loaded.This should be optimized for the invocation of functions at runtime
        this.contractImplementations = this._resolveContractImplementations(contractClasses);

        // validate the supplied metadata against what code we have just in case
        const errors = this._checkAgainstSuppliedMetadata(metadata);
        if (errors) {
            throw new Error(JSON.stringify(errors));
        }

        // process the metadata. If nothing supplied the code has to be introspected
        // as much as possible

        this.metadata = this._augmentMetadataFromCode(metadata);

        // really do not like this method of duplicating an object
        // But it works and is quick (allegedly)
        this.contractImplementations['org.hyperledger.fabric'].contractInstance.setMetadata(JSON.parse(JSON.stringify(this.metadata)));

        // compile the schemas
        this._compileSchemas();

        // TODO: drop this level
        const util = require('util');
        logger.info('Metadata is : \n', util.inspect(this.metadata, {depth:8}));
        logger.info('Internal structure : \n', util.inspect(this.contractImplementations, {depth:8}));
    }

    /**
     * Compile the complex object schemas into validator functions that can be used
     * for arguments.
     *
     * TODO: should this be here or in the datamarhsal or serializer.... is it making assumptions about the implementation
     */
    _compileSchemas() {

        const schemaList = [];
        for (const name in  this.metadata.components.schemas) {
            const s =  this.metadata.components.schemas[name];
            const props = {};
            s.properties.forEach((e) => {
                props[e.name] = e;
            });

            s.properties = props;
            schemaList.push(s);
        }

        const ajv = new Ajv({useDefaults: true,
            coerceTypes: true,
            allErrors: true,
            schemas:schemaList});

        // create validators for each complex type
        this.contractImplementations.schemas = {};
        schemaList.forEach((e) => {
            const id = e.$id;
            this.contractImplementations.schemas[id] = {};
            this.contractImplementations.schemas[id].validator = ajv.getSchema(id);
        });

    }


    _checkAgainstSuppliedMetadata() {
        let errors;
        return errors;
    }

    /** Load the contract implementation code */
    _resolveContractImplementations(contractClasses) {
        const Contract = require('fabric-contract-api').Contract;

        const implementations = {};
        for (const contractClass of contractClasses) {
            const contract = new(contractClass);
            if (!(contract instanceof Contract)) {
                throw new Error(`invalid contract instance ${contract}`);
            }

            const name = contract.getName();
            const transactions = this._processContractTransactions(contract);
            const info = this._processContractInfo(contract);

            // determine the serialization structure that is needed for this contract
            // create and store the dataMarshall that is needed
            const requestedSerializer = this.serializers.transaction;
            const dataMarshall = new DataMarshall(requestedSerializer, this.serializers.serializers, this);

            implementations[name] = {contractInstance : contract, transactions, info, dataMarshall};

        }
        return implementations;
    }

    /** read the code and create the internal structure representing the code */
    _processContractTransactions(contract) {

        let transactions = [];
        transactions = Reflect.getMetadata('fabric:transactions', contract) || [];
        if (transactions.length === 0) {
            const propNames = Object.getOwnPropertyNames(Object.getPrototypeOf(contract));

            for (const propName of propNames) {
                const propValue = contract[propName];
                if (typeof propValue !== 'function') {
                    continue;
                } else if (propName === 'constructor') {
                    continue;
                } else if (propName.startsWith('_')) {
                    continue;
                }

                transactions.push({
                    name: propName
                });
            }
        }
        return transactions;
    }

    _processContractInfo(contract) {
        return {};
    }

    /** Create the standard method from the code that has been loaded
     * This can use introspection and, if applicable, typescript annotations
     */
    _augmentMetadataFromCode(metadata) {

        if (!metadata.contracts) {
            metadata.contracts = this.contractImplementations;
        }

        // look for the general information representing all the contracts
        // add if nothing has been given by the application
        if (!metadata.info) {
            const opts = StartCommand.getArgs(yargs);
            const modPath = path.resolve(process.cwd(), opts['module-path']);
            const jsonPath = path.resolve(modPath, 'package.json');
            const json = require(jsonPath);
            metadata.info = {};
            metadata.info.version = json.hasOwnProperty('version') ? json.version : '';
            metadata.info.title = json.hasOwnProperty('name') ? json.name : '';
        }

        // obtain the information relating to the complex objects
        if (!metadata.components) {
            metadata.components = {};
            metadata.components.schemas = Reflect.getMetadata('fabric:objects', global) || {};
        }
        return metadata;
    }

    /**
     * The init fn is called for updated and init operations; the user though can include any function
     * in these calls. Therefore we are giving the user the responsibility to put the correct function in
     *
     * @param {ChaincodeStub} stub Stub class giving the full api
     */
    async Init(stub) {
        const fAndP = stub.getFunctionAndParameters();
        if (fAndP.fcn === '') {
            const message = 'Default initiator successful.';
            return shim.success(Buffer.from(message));
        } else {
            return this.invokeFunctionality(stub, fAndP);
        }
    }

    /**
     * The invoke fn is called for all the invoke operations
     *
     * @param {ChaincodeStub} stub Stub class giving the full api
     */
    async Invoke(stub) {
        const fAndP = stub.getFunctionAndParameters();
        return this.invokeFunctionality(stub, fAndP);
    }

    /**
     * The invokeFunctionality function is called for all the invoke operations; init is also redirected to here
     *
     * @param {ChaincodeStub} stub Stub class giving the full api
	 * @param {Object} fAndP Function and Paramters obtained from the smart contract argument
     */
    async invokeFunctionality(stub, fAndP) {
        try {
            const {contractName:cn, function:fn} = this._splitFunctionName(fAndP.fcn);
            logger.debug(`Invoking ${cn} ${fn}`);
            const contractData = this.contractImplementations[cn];

            if (!contractData) {
                throw new Error(`Contract name is not known :${cn}:`);
            }

            const contractInstance = contractData.contractInstance;
            const dataMarshall = contractData.dataMarshall;
            const ctx = contractInstance.createContext();

            ctx.setChaincodeStub(stub);
            ctx.setClientIdentity(new ClientIdentity(stub));

            const functionExists = contractData.transactions.find((transaction) => {
                return transaction.name === fn;
            });

            if (functionExists) {
                // before tx fn
                const parameters = dataMarshall.handleParameters(functionExists, fAndP.params);
                await contractInstance.beforeTransaction(ctx);

                // use the spread operator to make this pass the arguments seperately not as an array
                const result = await contractInstance[fn](ctx, ...parameters);

                // after tx fn
                await contractInstance.afterTransaction(ctx, result);

                return shim.success(dataMarshall.toWireBuffer(result));
            } else {
                await contractInstance.unknownTransaction(ctx);
            }
        } catch (error) {
            logger.error(error);
            return shim.error(error);
        }
    }

    /**
	 * Parse the fcn name to be name and function.  These are separated by a :
	 * Anything after the : is treated as the function name
	 * No : implies that the whole string is a function name
	 *
	 * @param {String} fcn the combined function and name string
	 * @return {Object} split into name and string
	 */
    _splitFunctionName(fcn) {
        // Did consider using a split(':') call to do this; however I chose regular expression for
        // the reason that it provides definitive description.
        // Split will just split - you would then need to write the code to handle edge cases
        // for no input, for multiple :, for multiple : without intervening characters
        // https://regex101.com/ is very useful for understanding

        const regex = /([^:]*)(?::|^)(.*)/g;
        const result = {contractName:'', function:''};

        const m = regex.exec(fcn);
        result.contractName = m[1];
        result.function = m[2];

        return result;
    }

    /**
	 * get information on the contracts
	 */
    getContracts() {
        const data = {
            info: {
                title: this.title,
                version: this.version
            },
            contracts: [],
            components: {
                schemas: this.objects
            }
        };

        if (Object.keys(this.objects).length === 0) {
            delete data.components.schemas;
        }

        for (const c in this.contracts) {
            const contract = this.contracts[c];
            const contractData = {
                info: {
                    title: contract.contract.getName(),
                    version: this.version
                },
                transactions: []
            };

            contractData.name = contract.contract.getName();

            contract.transactions.forEach((tx) => {
                contractData.transactions.push(tx);
            });

            data.contracts.push(contractData);
        }

        return data;
    }

}

module.exports = ChaincodeFromContract;
