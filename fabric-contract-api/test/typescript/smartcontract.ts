/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/

import { Contract, Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';

export class ScenarioContext extends Context{

	customFunction(){

	}
}

export default class TestContractOne extends Contract {

    constructor() {
        super('org.papernet.commercialpaper');
    }

	async beforeTransaction(ctx: ScenarioContext){
        const stubApi: ChaincodeStub = ctx.stub;
		const clientIdentity: ClientIdentity = ctx.clientIdentity;

		ctx.customFunction();
	}

	async afterTransaction(ctx: ScenarioContext,result:any){

	}

	async unknownTransaction(ctx: ScenarioContext){

	}

	createContext(){
		return new ScenarioContext();
	}


    async Transaction(ctx: ScenarioContext)  {
        const stubApi: ChaincodeStub = ctx.stub;
        const clientIdentity: ClientIdentity = ctx.clientIdentity;

        const ns: string = this.getNamespace();
    }
}

export class TestContractThree extends Contract {
    constructor() {
        super();
	}

	async Transaction(ctx: Context)  {
        const stubApi: ChaincodeStub = ctx.stub;
        const clientIdentity: ClientIdentity = ctx.clientIdentity;
    }
}
