'use strict';

// SDK Library to asset with writing the logic

// imaginee the next line to be

const Contract = require('fabric-shim').contractapi.Contract;

// Business logic (well just util but still it's general purpose logic)
// const util = require('util');

/**
 * Support the Updating of values within the Contract
 */
class RemoveValues extends Contract {

    /**
     *
     */
    constructor() {
        super('org.mynamespace.removes');

        // going to leave the default 'not known function' handling alone
    }

    /**
     *
     * @param {*} api
     */
    async quarterAssetValue() {
        console.info('Transaction ID: ' + this.getTxID());

        let value = await this.getState('dummyKey');
        if (isNan(value)) {
            let str = `'Need to have numerc value set to quarter it, ${value}`;
            console.error(str);
            throw new Error(str);
        } else {
            let v = value/4;
            await api.putState('dummyKey', v);
            return v;
        }
    }


    async getAssetValue(){
        console.info('Transaction ID: ' + this.getTxID());

        let value = await this.getState('dummyKey');

        return value;
    }

}

module.exports = RemoveValues;