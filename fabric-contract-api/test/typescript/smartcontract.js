"use strict";
/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_contract_api_1 = require("fabric-contract-api");
class TestContractOne extends fabric_contract_api_1.Contract {
    constructor() {
        super('org.papernet.commercialpaper', { key: 'value' });
        const intermediaryFn = (ctx) => {
            return ctx;
        };
        this.setBeforeFn(intermediaryFn);
        this.setAfterFn(intermediaryFn);
        this.setUnknownFn(intermediaryFn);
    }
    async Transaction(ctx) {
        const stubApi = ctx.stub;
        const clientIdentity = ctx.clientIdentity;
        const afterFn = this.getAfterFn();
        const testCtxAfter = afterFn(ctx);
        const beforeFn = this.getBeforeFn();
        const testCtxBefore = beforeFn(ctx);
        const unknownFn = this.getUnknownFn();
        const testCtxUnkown = beforeFn(ctx);
        const testCtx = afterFn(ctx);
        const data = this.getMetadata();
        const ns = this.getNamespace();
    }
}
exports.default = TestContractOne;
class TestContractTwo extends fabric_contract_api_1.Contract {
    constructor() {
        super('org.papernet.commercialpaper');
    }
}
exports.TestContractTwo = TestContractTwo;
class TestContractThree extends fabric_contract_api_1.Contract {
    constructor() {
        super();
    }
}
exports.TestContractThree = TestContractThree;
//# sourceMappingURL=smartcontract.js.map