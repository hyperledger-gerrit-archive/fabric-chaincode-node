/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';
const getParams = require('get-params');
const utils = require('./utils');
require('reflect-metadata');

function isPrimitive(type) {
    switch (type) {
        case 'string':
        case 'number':
        case 'boolean':
            return true;

        default:
            return false;
    }

}

module.exports.Transaction = function Transaction(commit = true) {
    return (target, propertyKey) => {
        const transactions = Reflect.getMetadata('fabric:transactions', target) || [];
        const paramNames = getParams(target[propertyKey]);
        const description = '';
        const contextType = target.createContext().constructor;
        const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];

        let numRemoved = 0;
        const parameters = paramTypes.filter((paramType, paramIdx) => {
            const filter = paramType === contextType;

            if (filter) {
                paramNames.splice(paramIdx - numRemoved++, 1);
            }

            return !filter;
        }).map((paramType, paramIdx) => {
            const paramName = paramNames[paramIdx];
            const obj = {
                name: paramName,
                description,
                schema: {

                }
            };
            const type = typeof paramType === 'function' ? paramType.name.toLowerCase() : paramType.toString().toLowerCase();
            if (isPrimitive(type)) {
                obj.schema.type = type;
            } else {
                obj.schema.$ref = `#/components/schemas/${type}`;
            }

            return obj;
        });

        const tag = [];
        if (commit) {
            tag.push('submitTx');
        }

        utils.appendOrUpdate(transactions, 'name', propertyKey, {
            tag: tag,
            parameters: parameters
        });

        Reflect.defineMetadata('fabric:transactions', transactions, target);
    };
};

module.exports.Returns = function Returns(returnType) {
    return (target, propertyKey) => {
        const transactions = Reflect.getMetadata('fabric:transactions', target) || [];

        utils.appendOrUpdate(transactions, 'name', propertyKey, {
            returns: {
                name: 'success',
                schema: {
                    type: returnType.toLowerCase()
                }
            }
        });

        Reflect.defineMetadata('fabric:transactions', transactions, target);
    };
};
