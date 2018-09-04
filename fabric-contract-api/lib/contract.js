/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';

/**
 * The main Contact class that all code working within a Chaincode Container must be extending. Provides indentification
 * and helper functions to work with
 * @memberof fabric-contract-api
 */
class Contract {

	/**
     * If no namespace given, or it is whitespace default to 'contract'
     * @param {String} namespace namespace for the logic within this contract
     */
	constructor(namespace, metadata = {}){
		if (namespace && namespace.trim() !== '' ){
			this.namespace = namespace.trim();
		} else {
			this.namespace = 'contract';
		}
		this.metadata = metadata;

		this.unknownHook = () => {
			throw new Error('You\'ve asked to invoke a function that does not exist');
		};

		this.beforeHooks = [];
		this.afterHooks = [];

		this.hooksSet = { before:false, after:false, unknown:false};

	}

	/** Is the object a function?
     * @ignore
     * @param {function} fn to be checked
     * @return {boolean} true if function
     */
	_isFunction(fn){
		return !!(fn && fn.constructor && fn.call && fn.apply);
	}

	/**
     * Sets the fn to call if something unknown comes in;
     * If function is not passed a error will be thrown
     *
     * @param {function} fn fn -
     */
	setUnknownHook(hook){
		if (this.hooksSet.unknown){
			throw new Error('Unknown hook can not be updated once set');
		} else {
			this.hooksSet.unknown=true;
		}

		if (this._isFunction(hook)){
			this.unknownHook = hook;
		} else {
			throw new Error('Argument is not a function');
		}
	}

	/**
     * Gets the fn to call to use if nothing specified
     * @return {function} function
     */
	getUnknownHook(){
		return this.unknownHook;
	}

	/**
     * These are the hooks that are invoked before each transaction. An array of functions should be passed,
	 * and they will be executed in order.
	 *
	 * Each function should have the prototype
	 *
	 *    async <name> (Context ctx){
	 *       return ctx
	 *    }
     *
     * @param {function[]} hooks array of fn to invoke prior to the transaction function being called
     */
	setBeforeHooks(hooks){

		if (this.hooksSet.before){
			throw new Error('Before hooks can not be updated once set');
		} else {
			this.hooksSet.before=true;
		}

		if( !Array.isArray(hooks)){
			throw new Error('Argument should be an array of functions');
		}

		let allValid = hooks.reduce((sofarvalid,current)=>{
			if (sofarvalid){
				return this._isFunction(current);
			} else {
				return false;
			}
		}, true);

		if (allValid){
			this.beforeHooks = hooks;
		} else {
			throw new Error('Argument is not a function');
		}
	}

	/**
     * Get the function that would be invoked before
     *
     * @return {function} fn
     */
	getBeforeHooks(){
		return this.beforeHooks;
	}

	/**
     * Get the function that would be invoked after
     *
     * @return {function} fn
     */
	getAfterHooks(){
		return this.afterHooks;
	}

	/**
     * These are the hooks that are invoked before each transaction. An array of functions should be passed,
	 * and they will be executed in order.
	 *
	 * Each function should have the prototype
	 *
	 *    async <name> (Context ctx){
	 *       return ctx
	 *    }
     *
     * @param {function[]} hooks array of fn to invoke prior to the transaction function being called
     */
	setAfterHooks(hooks){
		if (this.hooksSet.after){
			throw new Error('After hooks can not be updated once set');
		} else {
			this.hooksSet.after=true;
		}

		if( !Array.isArray(hooks)){
			throw new Error('Argument should be an array of functions');
		}

		let allValid = hooks.reduce((sofarvalid,current)=>{
			if (sofarvalid){
				return this._isFunction(current);
			} else {
				return false;
			}
		}, true);

		if (allValid){
			this.afterHooks = hooks;
		} else {
			throw new Error('Argument is not a function');
		}
	}

	/**
     * @return {String} returns the namepsace
     */
	getNamespace(){
		return this.namespace;
	}

	/**
	 * Gets meta data about this instance
	 *
	 * @return {Object} object with key/value map of metadata
	 */
	getMetadata(){
		return this.metadata;
	}

}

module.exports = Contract;
