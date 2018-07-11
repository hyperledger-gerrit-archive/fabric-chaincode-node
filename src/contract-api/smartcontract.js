/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';

/**
 * The main SmartContact class that all code working within a Chaincode Container must be extending. Provides indentification
 * and helper functions to work with
 *
 */
class SmartContract {

    /**
     * If no namespace given, or it is whitespace default to 'smartcontract'
     * @param {String} namespace namespace for the logic within this SmartContract
     */
    constructor(namespace){
        if (namespace && namespace.trim() !== '' ){
            this.namespace = namespace.trim();
        } else {
            this.namespace = 'smartcontract';
        }

        this.unknownFn = () => {
            throw new Error('You\'ve asked to invoke a function that does not exist');
        };
    }

    /** Is the object a function?
     *
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
    $setUnknownFn(fn){
        if (this._isFunction(fn)){
            this.unknownFn = fn;
        } else {
            throw new Error('Argument is not a function');
        }
    }

    /**
     * Gets the fn to call to use if nothing specified
     * @return {function} function
     */
    $getUnknownFn(){
        return this.unknownFn;
    }

    /**
     * This is invoked before each function
     *
     * @param {function} fn fn to invoke prior to the transaction function being called
     */
    $setBeforeFn(fn){
        if (this._isFunction(fn)){
            this.beforeFn = fn;
        } else {
            throw new Error('Argument is not a function');
        }
    }

    /**
     * Get the function that would be invoked before
     *
     * @return {function} fn
     */
    $getBeforeFn(){
        return this.beforeFn;
    }

    /**
     * @return {String} returns the namepsace
     */
    $getNamespace(){
        return this.namespace;
    }

}

module.exports = SmartContract;