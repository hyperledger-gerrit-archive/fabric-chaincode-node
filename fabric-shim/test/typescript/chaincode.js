"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/
const shim = require("fabric-shim");
const fabric_shim_1 = require("fabric-shim");
class TestTS {
    async Init(stub) {
        const logger = shim.newLogger('init');
        return shim.success();
    }
    async Invoke(stub) {
        const logger = fabric_shim_1.Shim.newLogger('invoke');
        const args = stub.getArgs();
        const strArgs = stub.getStringArgs();
        const { fcn, params } = stub.getFunctionAndParameters();
        const FunctionsAndParameters = stub.getFunctionAndParameters();
        if (fcn === 'ThrowError') {
            const err = new Error('Had a problem');
            return shim.error(Buffer.from(err.message));
        }
        if (fcn === 'ThrowErrorShim') {
            const err = new Error('Had a problem');
            return fabric_shim_1.Shim.error(Buffer.from(err.message));
        }
        if (fcn === 'SuccessShim') {
            return fabric_shim_1.Shim.success();
        }
        await this.testAll(stub);
        if (fcn === 'nopayload') {
            return shim.success();
        }
        if (fcn === 'myReturnCode') {
            let rc;
            rc = fabric_shim_1.ChaincodeStub.RESPONSE_CODE.OK;
            rc = shim.RESPONSE_CODE.OK;
            rc = fabric_shim_1.ChaincodeStub.RESPONSE_CODE.ERRORTHRESHOLD;
            rc = shim.RESPONSE_CODE.ERRORTHRESHOLD;
            rc = fabric_shim_1.ChaincodeStub.RESPONSE_CODE.ERROR;
            rc = shim.RESPONSE_CODE.ERROR;
            rc++;
        }
        return shim.success(Buffer.from('all good'));
    }
    async testAll(stub) {
        this.testCompositeKey(stub);
        await this.testState(stub);
        await this.testOtherIteratorCalls(stub);
        await this.testPrivateData(stub);
        await this.testOtherStubCalls(stub);
        this.testClientIdentity(stub);
        this.testProposal(stub);
    }
    testCompositeKey(stub) {
        const key = stub.createCompositeKey('obj', ['a', 'b']);
        const splitKey = stub.splitCompositeKey(key);
    }
    async testState(stub) {
        const key = stub.createCompositeKey('obj', ['a', 'b']);
        const getState = await stub.getState(key);
        let promise = stub.putState(key, Buffer.from('Something'));
        await promise;
        promise = stub.deleteState(key);
        await promise;
        const compKeyIterator = await stub.getStateByPartialCompositeKey('obj', ['a', 'b']);
        const StateByRange = await stub.getStateByRange('key2', 'key6');
        const stateQIterator = await StateByRange;
        this.testIterator(compKeyIterator);
        this.testStateQueryIterator(compKeyIterator);
        this.testIterator(stateQIterator);
        this.testStateQueryIterator(stateQIterator);
    }
    async testOtherIteratorCalls(stub) {
        const key = stub.createCompositeKey('obj', ['a', 'b']);
        const getHistForKey = await stub.getHistoryForKey(key);
        const queryResult = await stub.getQueryResult('Mango query');
        this.testIterator(getHistForKey);
        this.testHistoryQueryIterator(getHistForKey);
        this.testIterator(queryResult);
        this.testStateQueryIterator(queryResult);
    }
    async testIterator(iterator) {
        const historyNext = iterator.next();
        const nextVal = await historyNext;
        const historyClose = iterator.close();
        await historyClose;
    }
    async testHistoryQueryIterator(historyQuery) {
        const historyNext = await historyQuery.next();
        await historyQuery.close();
        const done = historyNext.done;
        const keyMod = historyNext.value;
        let isDelete = keyMod.is_delete;
        isDelete = keyMod.getIsDelete();
        let timestamp = keyMod.timestamp;
        timestamp = keyMod.getTimestamp();
        let txid = keyMod.tx_id;
        txid = keyMod.getTxId();
        let value = keyMod.value;
        value = keyMod.getValue();
    }
    async testStateQueryIterator(stateQuery) {
        const stateNext = await stateQuery.next();
        await stateQuery.close();
        const done = stateNext.done;
        const keyVal = stateNext.value;
        let key = keyVal.key;
        key = keyVal.getKey();
        let val = keyVal.value;
        val = keyVal.getValue();
    }
    async testPrivateData(stub) {
        const collection = 'a-collection';
        const key = stub.createCompositeKey('obj', ['a', 'b']);
        const value = 'some value';
        const privateDataByRange = await stub.getPrivateDataByRange(collection, key, value);
        const privateDataByPartialCompKey = await stub.getPrivateDataByPartialCompositeKey(collection, 'objid', ['a', 'b']);
        const privateDataQueryResult = await stub.getPrivateDataQueryResult(collection, value);
        const getPrivDate = await stub.getPrivateData(collection, key);
        const putPrivData = stub.putPrivateData(collection, key, Buffer.from(value, 'utf-8'));
        await putPrivData;
        const delPrivateData = stub.deletePrivateData(collection, key);
        await delPrivateData;
    }
    async testOtherStubCalls(stub) {
        const binding = stub.getBinding();
        const channelID = stub.getChannelID();
        stub.setEvent('eventid', Buffer.from('some data', 'utf-8'));
        const transient = stub.getTransient();
        const TxID = stub.getTxID();
        const TxTimestamp = stub.getTxTimestamp();
        const creator = stub.getCreator();
        let idbytes = creator.getIdBytes();
        idbytes = creator.id_bytes;
        let mspid = creator.mspid;
        mspid = creator.getMspid();
        const invokeChaincode = await stub.invokeChaincode('ccid', ['bob', 'duck'], 'channelid');
    }
    testClientIdentity(stub) {
        const cID = new fabric_shim_1.ClientIdentity(stub);
        const name = 'mockName';
        const value = 'mockValue';
        const attributeValue = cID.getAttributeValue(name);
        const id = cID.getID();
        const mspid = cID.getMSPID();
        const newAttributeValue = cID.assertAttributeValue(name, value);
        const X509Certificate = cID.getX509Certificate();
        this.testCert(X509Certificate);
    }
    testCert(cert) {
        const subject = cert.subject;
        const issuer = cert.issuer;
        const notAfter = cert.notAfter;
        const notBefore = cert.notBefore;
        const fingerPrint = cert.fingerPrint;
        const publicKey = cert.publicKey;
        const sigAlg = cert.signatureAlgorithm;
        let commonName = issuer.commonName;
        let countryName = issuer.countryName;
        let localityName = issuer.localityName;
        let organisationName = issuer.organizationName;
        let stateOrProvinceName = issuer.stateOrProvinceName;
        stateOrProvinceName = subject.stateOrProvinceName;
        commonName = subject.commonName;
        countryName = subject.countryName;
        localityName = subject.localityName;
        organisationName = subject.organizationName;
        const organisationalUnitName = subject.organizationalUnitName;
        const postcode = subject.postalCode;
        const stateName = subject.stateOrProvinceName;
        const address = subject.streetAddress;
    }
    testProposal(stub) {
        const proposal = stub.getSignedProposal();
        this.testSignedProposal(proposal);
    }
    testSignedProposal(proposal) {
        let prop = proposal.proposal_bytes;
        let sig = proposal.signature;
        prop = proposal.getProposalBytes();
        sig = proposal.getSignature();
        let ext = prop.extension;
        ext = prop.getExtension();
        let hdr = prop.header;
        hdr = prop.getHeader();
        let payload = prop.payload;
        payload = prop.getPayload();
        let cHdr = hdr.channel_header;
        cHdr = hdr.getChannelHeader();
        let sHdr = hdr.signature_header;
        sHdr = hdr.getSignatureHeader();
        let chId = cHdr.channel_id;
        chId = cHdr.getChannelId();
        let epoch = cHdr.epoch;
        epoch = cHdr.getEpoch();
        ext = cHdr.extension;
        ext = cHdr.getExtension();
        let timestamp = cHdr.timestamp;
        timestamp = cHdr.getTimestamp();
        let hash = cHdr.tls_cert_hash;
        hash = cHdr.getTlsCertHash();
        let txId = cHdr.tx_id;
        txId = cHdr.getTxId();
        let type = cHdr.type;
        type = cHdr.getType();
        let version = cHdr.version;
        version = cHdr.getVersion();
        let creator = sHdr.creator;
        creator = sHdr.getCreator();
        let nonce = sHdr.nonce;
        nonce = sHdr.getNonce();
        let input = payload.input;
        input = payload.getInput();
        let map = payload.transientMap;
        map = payload.getTransientMap();
    }
}
fabric_shim_1.Shim.start(new TestTS());
//# sourceMappingURL=chaincode.js.map