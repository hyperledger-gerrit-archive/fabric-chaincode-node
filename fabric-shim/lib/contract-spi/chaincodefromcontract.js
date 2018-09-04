/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const shim = require('../chaincode');
const Contract = require('fabric-contract-api').Contract;

const Logger = require('../logger');
const logger = Logger.getLogger('contracts-spi/chaincodefromcontract.js');

const ClientIdentity = require('../chaincode').ClientIdentity;

/**
 * The user will have written a class than extends the 'Contract' interface; this
 * is expressed in terms of domain specific functions - that need to be called in the
 * lower-level 'invoke' and 'init' functions.
 *
 * This class impelements the 'invoke' and 'init' functions and does the 'routing'
 * @ignore
 **/
class ChaincodeFromContract {

	/**
     * Takes an array contract classes, and looks for the functions within those files.
     * Stores a reference to those, so they can be specifically called at a later time
     *
     * @param {Contract[]} contractClasses array of  contracts to register
     */
	constructor(contractClasses) {

		// the structure that stores the 'function-pointers', contents of the form
		// {  namespace : { ContractClass,  Contract,  functionNames[] }}
		this.contracts = {};

		if (!contractClasses){
			throw new Error('Missing argument: array of contract classes');
		}
		// always add in the 'meta' class that has general abilities
		contractClasses.push(require('./meta'));
		logger.debug(contractClasses);


		for (let contractClass of contractClasses){

			let contract = new(contractClass);
			if (!(contract instanceof Contract)) {
				throw new Error(`invalid contract instance ${contract}`);
			}

			const propNames = Object.getOwnPropertyNames(Object.getPrototypeOf(contract));

			const functionNames = [];
			for (const propName of propNames) {
				const propValue = contract[propName];
				if (typeof propValue !== 'function') {
					continue;
				} else if (propName === 'constructor') {
					continue;
				}

				functionNames.push(propName);
			}
			let namespace = contract.getNamespace();
			logger.debug(functionNames,contractClass,namespace);
			this.contracts[`${namespace}`] = { contractClass, functionNames, contract };
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

			let splitFcn = fcn.split('_');

			let ns = splitFcn[0];
			let fn = splitFcn[1];

			if (!this.contracts[ns]){
				throw new Error(`Namespace is not known :${ns}:`);
			}

			let contractInstance = this.contracts[ns].contract;
			let ctx = this.createCtx(stub);

			const functionExists = this.contracts[ns].functionNames.indexOf(fn) !== -1;
			if (functionExists) {

				let beforeHooks = contractInstance.getBeforeHooks();
				ctx = await this._executeHooks(beforeHooks,ctx);

				// use the spread operator to make this pass the arguments seperately not as an array
				const result = await contractInstance[fn](ctx,...params);

				let afterHooks = contractInstance.getAfterHooks();
				ctx = await this._executeHooks(afterHooks,ctx,result);

				return shim.success(result);
			} else {
				let unknownHook = contractInstance.getUnknownHook();
				await unknownHook(ctx);
			}
		} catch (error) {
			return shim.error(error);
		}
	}

	createCtx(stub){
		let ctx = {
			stub,
			clientIdentity: new ClientIdentity(stub)
		};
		return ctx;
	}

	/** Execute each hook in sequence passing on the ctx to the next
	 * Each hook is marked as async, but the next hook is only executed when the previous one has resolvedl
	 * any errors immediatebly thrown
	 *
	 * @param {fn[]} hooks array of functions to call
	 * @param {Context} ctx transactional context
	 * @param {...args} args arguments to pass to the function to call.
	 */
	async _executeHooks(hooks,ctx,...args){
		// type of these has been checked on the way in
		// so assume these are fns, and call
		for (let fn of hooks) {
			ctx = await fn(ctx,...args);
		}
	}

}

module.exports = ChaincodeFromContract;
