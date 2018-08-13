/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/
import {
    ChaincodeInterface,
    ChaincodeResponse,
    ClientIdentity,
    ErrorResponse,
    HistoryQueryIterator,
    Iterators,
    NextKeyModificationResult,
    NextResult,
    ProposalCreator,
    Shim,
    SignedProposal,
    SplitCompositekey,
    StateQueryIterator,
    Stub,
    SuccessResponse,
    X509,
} from 'fabric-shim';
import { LoggerInstance } from 'winston';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import * as sinon from 'sinon';

class TSChaincode {

    async Invoke(stub: Stub, identity: ClientIdentity, shim: Shim, historyQuery: HistoryQueryIterator, stateQuery: StateQueryIterator) {
        await this.testStub(stub);
        await this.testClientIdentity(identity);
        await this.testShim(Shim);
        await this.testHistoryQuery(historyQuery);
        await this.testStateQuery(stateQuery);
    }

    async testStub(stub: Stub) {
        const buffer = new ArrayBuffer(8);
        const collection = 'collection name';
        const key = 'mockKey';
        const stringArray: string[] = [''];
        const value = 'some value';
        const args: string[] = stub.getArgs();
        const binding: string = stub.getBinding();
        const channelID: string = stub.getChannelID();
        const createdCompKey: string = stub.createCompositeKey(key, stringArray);
        const delPrivateData: Promise<void> = stub.deletePrivateData(collection, key);
        const delState: Promise<any> = stub.deleteState(key);
        const getHistForKey: Promise<Iterators.HistoryQueryIterator> = stub.getHistoryForKey(key);
        const getState: Promise<Buffer> = stub.getState(key);
        const getPartCompKey: Promise<Iterators.StateQueryIterator> = stub.getStateByPartialCompositeKey(key, stringArray);
        const FunctionsAndParameters: {fcn: string, params: string[]} = stub.getFunctionAndParameters();
        const invokeChaincode: Promise<ChaincodeResponse> = stub.invokeChaincode(value, buffer['bob'], key);
        const mspid: ProposalCreator  = stub.getCreator();
        const privateDataByRange: Promise<Iterators.StateQueryIterator> = stub.getPrivateDataByRange(collection, key, value);
        const privateDataByPartialCompKey: Promise<Iterators.StateQueryIterator> = stub.getPrivateDataByPartialCompositeKey(collection, value, stringArray);
        const privateDataQueryResult: Promise<Iterators.StateQueryIterator> = stub.getPrivateDataQueryResult(collection, value);
        const putPrivateData: Promise<void> = stub.putPrivateData(collection, key, Buffer.from(value, 'utf-8'));
        const putState: Promise<void> = stub.putState(key, Buffer.from(value, 'utf-8'));
        const queryResult: Promise<Iterators.StateQueryIterator> = stub.getQueryResult(value);
        const proposal: SignedProposal = stub.getSignedProposal();
        const StateByPartialCompKey: Promise<Iterators.StateQueryIterator> = stub.getStateByPartialCompositeKey(value, stringArray);
        const stringArgs: string[] = stub.getStringArgs();
        const setEvent: void = stub.setEvent(value, Buffer.from(key, 'utf-8'));
        const splitKey: SplitCompositekey = stub.splitCompositeKey(key);
        const StateByRange: Promise<Iterators.StateQueryIterator> = stub.getStateByRange(key, value);
        const transient: Map<string, Buffer> = stub.getTransient();
        const TxID: string = stub.getTxID();
        const TxTimestamp: Timestamp = stub.getTxTimestamp();
    }

    async testClientIdentity(identity: ClientIdentity) {
        const name = 'mockName';
        const value = 'mockValue';
        const attributeValue: string | null = identity.getAttributeValue(name);
        const id: string = identity.getID();
        const mspid: string = identity.getMSPID();
        const newAttributeValue: boolean = identity.assertAttributeValue(name, value);
        const X509Certificate: X509 = identity.getX509Certificate();
    }

    async testShim(shim: Shim) {
        class CC implements ChaincodeInterface {
            Init(stub: Stub): Promise<ChaincodeResponse> {
                throw new Error('Not implemented');
            }

            Invoke(stub: Stub): Promise<ChaincodeResponse> {
                throw new Error('Not implemented');
            }
        }
        const msg = 'mockMsg';
        const name = 'mockName';
        const handleGetStateStub = sinon.stub().resolves('dummyClient');
        const chain: ChaincodeInterface = new CC();
        const err: ErrorResponse = Shim.error(Buffer.from(msg, 'utf-8'));
        const newLog: LoggerInstance = Shim.newLogger(name);
        const start: any = Shim.start(chain);
        const suc: SuccessResponse = Shim.success(Buffer.from(msg, 'utf-8'));
    }

    async testHistoryQuery(historyQuery: HistoryQueryIterator) {
        const historyClose: Promise<any> = historyQuery.close();
        const historyNext: Promise<NextKeyModificationResult> = historyQuery.next();
    }

    async testStateQuery(stateQuery: StateQueryIterator) {
        const stateClose: Promise<any> = stateQuery.close();
        const stateNext: Promise<NextResult> = stateQuery.next();
    }

}
