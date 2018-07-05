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

        this.unkownFn = () => {
            throw new Error('You\'ve asked to invoke a function that does not exist');
        };
    }

    /**
     * Sets the fn to call if something unknown comes in
     * @param {function} fn fn - (if null then ignored)
     */
    $setUnkownFn(fn){
        if (fn){
            this.unkownFn = fn;
        }
    }

    /**
     * Gets the fn to call to use if nothing specified
     * @return {function} function
     */
    $getUnkownFn(){
        return this.unkownFn;
    }

    /**
     * This is invoked before each function
     *
     * @param {function} fn fn to invoke prior to the transaction function being called
     */
    $setBeforeFn(fn){
        if (fn){
            this.beforeFn = fn;
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