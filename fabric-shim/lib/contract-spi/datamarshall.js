/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Logger = require('../logger');
const logger = Logger.getLogger('contracts-spi/datamarshall.js');
const Ajv = require('ajv');

module.exports = class DataMarshall {

    /** Constructs a DataMarshall that is able to use a serializer to convert to and from the buffers
     * that are used in variety of places.
     *
     * @param {String} requestedSerializer name of the requested serializer
     * @param {Object} serializers mapping of names to the implementation of the serializers
     */
    constructor(requestedSerializer, serializers, schemas) {
        let cnstr = serializers[requestedSerializer];
        if (typeof cnstr === 'string') {
            cnstr = require(cnstr);
        }

        this.serializer = new (cnstr)();

        this.ajv = new Ajv({useDefaults: true,
            coerceTypes: false,
            allErrors: true
        });
        this.schemas = schemas;
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
    fromWireBuffer(result, schema) {
        const value =  this.serializer.fromBuffer(result, schema);

        return {value, validateData:value};
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

                const {value, validateData} = this.fromWireBuffer(supplied, expected.schema);
                const validator = this.ajv.compile(schema);
                const valid = validator(validateData);
                logger.debug(`Argument is ${valid}`);

                returnParams.push(value);
            } else if (schema.$ref) {

                const {value, validateData} = this.fromWireBuffer(supplied, expected.schema);
                const valid = this.schemas[name].validator(validateData);
                logger.debug(`Argument is ${valid}`);
                returnParams.push(value);
            } else {
                throw new Error('incorrect type information');
            }
        }
        logger.debug(returnParams);
        return returnParams;
    }
};
