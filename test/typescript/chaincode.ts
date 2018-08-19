import * as shim from 'fabric-shim';

import { Shim, 
    Stub, 
    Iterators, 
    ChaincodeInterface, 
    ChaincodeResponse, 
    ClientIdentity, 
    X509,
    SplitCompositekey,
    SerializedIdentity,
    ChaincodeProposal
 } from "fabric-shim";

import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { LoggerInstance } from 'winston';


class testTS implements ChaincodeInterface {
    async Init(stub: Stub): Promise<ChaincodeResponse> {
        const logger: LoggerInstance = shim.newLogger('init');
        return shim.success();
    }

    async Invoke(stub: Stub): Promise<ChaincodeResponse> {
        const logger: LoggerInstance = Shim.newLogger('invoke');
        const args: string[] = stub.getArgs();
        const strArgs: string[] = stub.getStringArgs();
        const {fcn, params} =  stub.getFunctionAndParameters();    
        const FunctionsAndParameters: {fcn: string, params: string[]} =  stub.getFunctionAndParameters();       

        if (fcn === 'ThrowError') {
            const err: Error = new Error('Had a problem');
            return shim.error(Buffer.from(err.message));
        }

        if (fcn === 'ThrowErrorShim') {
            const err: Error = new Error('Had a problem');
            return Shim.error(Buffer.from(err.message));
        }

        if (fcn === 'SuccessShim') {
            return Shim.success();
        }

        await this.testAll(stub);

        if (fcn === 'nopayload') {
            return shim.success();
        }
        return shim.success(Buffer.from('all good'));
    }

    async testAll(stub: Stub): Promise<void> {
        this.testCompositeKey(stub);
        await this.testState(stub);
        await this.testOtherIteratorCalls(stub);
        await this.testPrivateData(stub);
        await this.testOtherStubCalls(stub);
        this.testClientIdentity(stub);
        this.testProposal(stub);
    }

    testCompositeKey(stub: Stub): void {
        const key: string = stub.createCompositeKey('obj', ['a', 'b']);
        const splitKey: SplitCompositekey = stub.splitCompositeKey(key);        
    }

    async testState(stub: Stub): Promise<void> {
        const key: string = stub.createCompositeKey('obj', ['a', 'b']);
        const getState: Buffer = await stub.getState(key);

        let promise: Promise<void> = stub.putState(key, Buffer.from('Something'));
        await promise;
        promise = stub.deleteState(key);
        await promise;
        const compKeyIterator: Iterators.StateQueryIterator = await stub.getStateByPartialCompositeKey('obj', ['a', 'b']);    
        const StateByRange: Iterators.StateQueryIterator = await stub.getStateByRange('key2', 'key6');
        const stateQIterator: Iterators.StateQueryIterator = await StateByRange;
        this.testIterator(compKeyIterator);
        this.testStateQueryIterator(compKeyIterator);
        this.testIterator(stateQIterator);
        this.testStateQueryIterator(stateQIterator);

    }

    async testOtherIteratorCalls(stub: Stub): Promise<void> {
        const key: string = stub.createCompositeKey('obj', ['a', 'b']);
        const getHistForKey: Iterators.HistoryQueryIterator = await stub.getHistoryForKey(key);
        const queryResult: Iterators.StateQueryIterator = await stub.getQueryResult('Mango query');
        this.testIterator(getHistForKey);
        this.testHistoryQueryIterator(getHistForKey);
        this.testIterator(queryResult);
        this.testStateQueryIterator(queryResult);
    }

    async testIterator(iterator: Iterators.CommonIterator) {
        const historyNext: Promise<any> = iterator.next();
        const nextVal: any = await historyNext;
        const historyClose: Promise<any> = iterator.close();
        const finalVal: any = await historyClose;
    }

    async testHistoryQueryIterator(historyQuery: Iterators.HistoryQueryIterator) {
        const historyNext: Iterators.NextKeyModificationResult = await historyQuery.next();
        await historyQuery.close();
        let done: boolean = historyNext.done;
        let keyMod: Iterators.KeyModification = historyNext.value;
        let isDelete: boolean = keyMod.is_delete;
        isDelete = keyMod.getIsDelete();
        let timestamp: Timestamp = keyMod.timestamp;
        timestamp = keyMod.getTimestamp();
        let txid: string = keyMod.tx_id;
        txid = keyMod.getTxId();
        let value: Buffer = keyMod.value;
        value = keyMod.getValue();
    }

    async testStateQueryIterator(stateQuery: Iterators.StateQueryIterator) {
        const stateNext: Iterators.NextResult = await stateQuery.next();
        await stateQuery.close();
        let done: boolean = stateNext.done;
        let keyVal: Iterators.KV = stateNext.value;
        let key: string = keyVal.key;
        key = keyVal.getKey();
        let val: Buffer = keyVal.value;
        val = keyVal.getValue();
    }    

    async testPrivateData(stub: Stub): Promise<void> {
        const collection: string = 'a-collection';
        const key: string = stub.createCompositeKey('obj', ['a', 'b']);
        const value: string = 'some value';

        const privateDataByRange: Iterators.StateQueryIterator = await stub.getPrivateDataByRange(collection, key, value);
        const privateDataByPartialCompKey: Iterators.StateQueryIterator = await stub.getPrivateDataByPartialCompositeKey(collection, 'objid', ['a', 'b']);
        const privateDataQueryResult: Iterators.StateQueryIterator = await stub.getPrivateDataQueryResult(collection, value);

        const getPrivDate: Buffer = await stub.getPrivateData(collection, key);
        const putPrivData: Promise<void> =  stub.putPrivateData(collection, key, Buffer.from(value, 'utf-8'));
        await putPrivData;
        const delPrivateData: Promise<void> = stub.deletePrivateData(collection, key);   
        await delPrivateData;     

    }

    async testOtherStubCalls(stub: Stub): Promise<void> {
        const binding: string = stub.getBinding();
        const channelID: string = stub.getChannelID();    
        stub.setEvent('eventid', Buffer.from('some data', 'utf-8'));
        const transient: Map<string, Buffer> = stub.getTransient();
        const TxID: string = stub.getTxID();
        const TxTimestamp: Timestamp = stub.getTxTimestamp();

        const creator: SerializedIdentity = stub.getCreator();   
        let idbytes: Buffer = creator.getIdBytes();
        idbytes = creator.id_bytes;
        let mspid: string = creator.mspid;
        mspid = creator.getMspid();    

        const invokeChaincode: ChaincodeResponse = await stub.invokeChaincode('ccid', ['bob', 'duck'], 'channelid');
    }

    testClientIdentity(stub: Stub): void {
        const cID = new ClientIdentity(stub);
        const name = 'mockName';
        const value = 'mockValue';
        const attributeValue: string | null = cID.getAttributeValue(name);
        const id: string = cID.getID();
        const mspid: string = cID.getMSPID();
        const newAttributeValue: boolean = cID.assertAttributeValue(name, value);
        const X509Certificate: X509.Certificate = cID.getX509Certificate();   
        //TODO:  
        //this.testCert(X509Certificate);  
    }

    testProposal(stub: Stub): void {
        const proposal: ChaincodeProposal.SignedProposal = stub.getSignedProposal();
        //TODO
        //this.testSignedProposal(proposal);
    }
}
Shim.start(new testTS());
