/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/
declare module 'fabric-contract-api' {

    import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
    export class Context {
        stub: ChaincodeStub;
        clientIdentity: ClientIdentity;
    }

    export class Contract {
        constructor(namespace?: string);

        beforeTransaction(ctx : Context): Promise<any>;
        afterTransaction(ctx : Context,result: any): Promise<any>;

        unknownTransaction(ctx : Context): Promise<any>;

        createContext(): Context;
        getNamespace(): string;

    }
}
