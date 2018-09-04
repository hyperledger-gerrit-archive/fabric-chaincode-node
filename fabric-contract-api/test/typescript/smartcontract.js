"use strict";
/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_contract_api_1 = require("fabric-contract-api");
class ScenarioContext extends fabric_contract_api_1.Context {
    customFunction() {
    }
}
exports.ScenarioContext = ScenarioContext;
class TestContractOne extends fabric_contract_api_1.Contract {
    constructor() {
        super('org.papernet.commercialpaper');
    }
    async beforeTransaction(ctx) {
        const stubApi = ctx.stub;
        const clientIdentity = ctx.clientIdentity;
        ctx.customFunction();
    }
    async afterTransaction(ctx, result) {
    }
    async unknownTransaction(ctx) {
    }
    createContext() {
        return new ScenarioContext();
    }
    async Transaction(ctx) {
        const stubApi = ctx.stub;
        const clientIdentity = ctx.clientIdentity;
        const ns = this.getNamespace();
    }
}
exports.default = TestContractOne;
class TestContractThree extends fabric_contract_api_1.Contract {
    constructor() {
        super();
    }
    async Transaction(ctx) {
        const stubApi = ctx.stub;
        const clientIdentity = ctx.clientIdentity;
    }
}
exports.TestContractThree = TestContractThree;
//# sourceMappingURL=smartcontract.js.map