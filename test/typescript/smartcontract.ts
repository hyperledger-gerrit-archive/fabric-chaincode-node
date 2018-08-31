/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/

import { Contract, Context, IntermediaryFn } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';

interface cpContext extends Context {
    cpList: string;
}

export default class TestContract extends Contract {

    constructor() {
        super('org.papernet.commercialpaper');

		const intermediaryFn: IntermediaryFn  = function (ctx){
            return ctx;
		}

		this.setBeforeFn(intermediaryFn);
        this.setAfterFn(intermediaryFn);
        this.setUnknownFn(intermediaryFn);
    }

    async Transaction(ctx: Context)  {
		const stubApi : ChaincodeStub = ctx.stub;
		const clientIdentity : ClientIdentity = ctx.clientIdentity;

        const afterFn: IntermediaryFn  = this.getAfterFn();
		const beforeFn: IntermediaryFn = this.getBeforeFn();
		const unknownFn: IntermediaryFn = this.getUnknownFn();
        const data: object = this.getMetadata();
        const ns: string = this.getNamespace();
    }
}

