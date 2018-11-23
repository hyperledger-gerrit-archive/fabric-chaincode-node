/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Logger = require('../logger');
const logger = Logger.getLogger('contracts-spi/datamarshall.js');

module.exports = class DataMarshall {

    /** Constructs a DataMarshall that is able to use a serializer to convert to and from the buffers
     * that are used in variety of places.
     *
     * @param {String} requestedSerializer name of the requested serializer
     * @param {Object} serializers mapping of names to the implementation of the serializers
     */
    constructor(requestedSerializer, serializers, chaincode) {
        let cnstr = serializers[requestedSerializer];
        if (typeof cnstr === 'string') {
            cnstr = require(cnstr);
        }

        this.serializer = new (cnstr)();


        // this.schemas = chaincode.contractImplementations.schemas;
    }

    /** Convert the result into a buffer than can be hand off to grpc (via the shim)
     * to be sent back to the peer
     *
     * @param {Object} result something to send
     * @return {Buffer} byte buffer to send
     */
    toWireBuffer(result) {
        return this.serializer.toBuffer(result);
    }

    /**
     * Convert the result from a buffer that has come from the wire (via GRPC)
     * back to an object
     *
     * @param {Object} result something to send
     * @return {Buffer} byte buffer to send
     */
    fromWireBuffer(result) {
        return this.serializer.fromBuffer(result);
    }

    fromWire(result, type) {

    }

    /**
     * Process all the parameters
     *
     * @param {object} fn Function currently being called
     * @param {array} parameters Parameters as passed from the shim
     * @return {array} of parameters that can be passed to the actual tx function
     */
    handleParameters(fn, parameters) {
        const expectedParams = fn.parameters;
        if (!expectedParams) {
            return [];
        }

        if (expectedParams.length !== fn.parameters.length) {
            throw new Error(`Expected ${expectedParams.length} parameters, but ${fn.parameters.length} have been supplied`);
        }

        const returnParams = [];

        // check each parameter matches the type and then demarshall
        for (let i = 0; i < fn.parameters.length; i++) {
            const supplied = parameters[i];
            const expected = expectedParams[i];
            logger.debug(expected);
            logger.debug(supplied);
            // check the type
            const schema = expected.schema;
            const name = expected.name;
            if (schema.type) {
                // simple type conversion here
                // TODO: better support here; refactor of internal data structure needed
                switch (schema.type) {
                    case 'string':
                        returnParams.push(supplied);
                        break;
                    default:
                        returnParams.push(JSON.parse(supplied));
                        break;
                }
                returnParams.push(supplied);
            } else {
                throw new Error('incorrect type information');
            }
        }

        return returnParams;
    }
};
