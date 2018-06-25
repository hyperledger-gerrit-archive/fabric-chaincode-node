'use strict';

// SDK Library to asset with writing the logic

const Contract = require('fabric-shim').contractapi.Contract;

// Business logic (well just util but still it's general purpose logic)
const util = require('util');

/**
 * Support the Updating of values within the SmartContract
 */
class UpdateValues extends Contract {

    /**
	 * Sets a namespace so that the functions in this particular class can
	 * be separated from others.
	 */
    constructor() {
        super('org.mynamespace.updates');
        this.$setUnknownFn(this.unknownFn);
    }

    /** The function to invoke if something unkown comes in.
	 *
	 */
    async uknownFn(){
        throw new Error('Big Friendly letters ->>> DON\'T PANIC');
    }

    /**
	 * A function that will setup a starting value
	 * Note that this is not expliclity called from init.  IF you want it called from init, then
	 * specifiy it in the fn name when init is invoked.
	 */
    async setup(){
        return this.putState('dummyKey', Buffer.from('Starting Value'));
    }

    /**
	 *
	 * @param {int|string} newAssetValue new asset value to set
	 */
    async setNewAssetValue(newAssetValue) {
        console.info(`Transaction ID: ${this.getTxID()}`);
        console.info(`New Asset value will be ${newAssetValue}`);

        return this.putState('dummyKey', Buffer.from(newAssetValue));
    }

    /**
	 * Doubles the api if it is a number fail otherwise

	 */
    async doubleAssetValue() {
        console.info(`Transaction ID: ${this.getTxID()}`);

        let value = await this.getState('dummyKey');
        if (isNaN(value)) {
            let str = `'Need to have numerc value set to double it, ${value}`;
            console.error(str);
            throw new Error(str);
        } else {
            let v = value*2;
            await this.putState('dummyKey', v);
            return v;
        }
    }

}

module.exports = UpdateValues;