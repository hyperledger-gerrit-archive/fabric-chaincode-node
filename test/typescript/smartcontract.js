"use strict";
/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_contract_api_1 = require("fabric-contract-api");
class TestContract extends fabric_contract_api_1.Contract {
    constructor() {
        super('org.papernet.commercialpaper');
        this.setBeforeFn(function (ctx) {
            return ctx;
        });
        this.setAfterFn(function (ctx) {
            return ctx;
        });
        this.setUnkownFn(function (ctx) {
            return ctx;
        });
    }
    async Transaction(ctx) {
        ctx.stub.createCompositeKey('key', []);
        ctx.clientIdentity.getID();
        this.getAfterFn();
        this.getBeforeFn();
        this.getMetadata();
        this.getUnkownFn();
        this.getNamespace();
    }
}
exports.default = TestContract;
//# sourceMappingURL=smartcontract.js.map