/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/
declare module 'fabric-shim' {

    import { LoggerInstance } from 'winston';

    import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

    export class Shim {
        static error(msg: Buffer): ErrorResponse;

        static newLogger(name: string): LoggerInstance;

        static start(chaincode: ChaincodeInterface): any;

        static success(payload?: Buffer): SuccessResponse;
    }

    interface SuccessResponse extends ChaincodeResponse {
    }

    interface ErrorResponse extends ChaincodeResponse {
    }

    export class ClientIdentity {
        attrs: string[];

        constructor(stub: Stub);

        assertAttributeValue(attrName: string, attrValue: string): boolean;

        getAttributeValue(attrName: string): string | null;

        getID(): string;

        getMSPID(): string;

        getX509Certificate(): X509;
    }

    interface ProposalCreator {
        mspid: string;

        getMspid(): string;
    }

    export class SignedProposal {
        signature: Buffer;
        proposal: Proposal;
    }

    interface Proposal {
        header: Header;
        payload: ChaincodeProposalPayload;
    }

    interface Header {
        channel_header: ChannelHeader;
        signature_header: SignatureHeader;
    }

    interface ChannelHeader {
        type: ChannelHeaderType;
        version: number;
        timestamp: any;
        channel_id: string;
        tx_id: string;
        epoch: number;
    }

    interface SignatureHeader {
        creator: ProposalCreator;
        nonce: Buffer;
    }

    interface ChaincodeProposalPayload {
        input: Buffer;
        transientMap: Map<string, Buffer>;
    }

    enum ChannelHeaderType {
        MESSAGE = 0,
        CONFIG,
        CONFIG_UPDATE,
        ENDORSER_TRANSACTION,
        ORDERER_TRANSACTION,
        DELIVER_SEEK_INFO,
        CHAINCODE_PACKAGE,
    }

    interface ChaincodeResponse {
        status: number;
        message: string;
        payload: Buffer;
    }

    export class Stub {
        static RESPONSE_CODE: {
            ERROR: number;
            ERRORTHRESHOLD: number;
            OK: number;
        };
        
        constructor(client: any, channel_id: any, txId: any, chaincodeInput: any, signedProposal?: any);

        createCompositeKey(objectType: string, attributes: string[]): string;

        deleteState(key: string): Promise<any>;

        getArgs(): string[];

        getBinding(): string;

        getChannelID(): string;

        getCreator(): ProposalCreator;

        getFunctionAndParameters(): { params: string[], fcn: string };

        getHistoryForKey(key: string): Promise<Iterators.HistoryQueryIterator>;

        getQueryResult(query: string): Promise<Iterators.StateQueryIterator>;

        getSignedProposal(): SignedProposal;

        getState(key: string): Promise<Buffer>;

        getPrivateData(collection: string, key: string): Promise<Buffer>;

        putPrivateData(collection: string, key: string, value: Buffer): Promise<void>;

        deletePrivateData(collection: string, key: string): Promise<void>;

        getPrivateDataByRange(collection: string, startKey: string, endKey: string): Promise<Iterators.StateQueryIterator>;

        getPrivateDataByPartialCompositeKey(collection: string, objectType: string, attributes: string[]): Promise<Iterators.StateQueryIterator>;

        getPrivateDataQueryResult(collection: string, query: string): Promise<Iterators.StateQueryIterator>;

        getStateByPartialCompositeKey(objectType: string, attributes: string[]): Promise<Iterators.StateQueryIterator>;

        getStateByRange(startKey: string, endKey: string): Promise<Iterators.StateQueryIterator>;

        getStringArgs(): string[];

        getTransient(): Map<string, Buffer>;

        getTxID(): string;

        getTxTimestamp(): Timestamp;

        invokeChaincode(chaincodeName: string, args: Buffer[], channel: string): Promise<ChaincodeResponse>;

        putState(key: string, value: Buffer): Promise<void>;

        setEvent(name: string, payload: Buffer): void;

        splitCompositeKey(compositeKey: string): SplitCompositekey;
    }

    interface SplitCompositekey {
        objectType: string;
        attributes: string[];
    }

    interface ChaincodeInterface {
        Init(stub: Stub): Promise<ChaincodeResponse>;

        Invoke(stub: Stub): Promise<ChaincodeResponse>;
    }

    export namespace Iterators {

        interface Iterator {
            close(): void;

            next(): Promise<any>;
        }

        interface HistoryQueryIterator extends Iterator {
            next(): Promise<NextKeyModificationResult>;
        }

        interface StateQueryIterator extends Iterator {
            next(): Promise<NextResult>;
        }

    }

    interface NextResult {
        value: KV;
        done: boolean;
    }

    interface NextKeyModificationResult {
        value: KeyModification;
        done: boolean;
    }

    interface X509 {
        subject: Subject;
        issuer: Issuer;
        notBefore: string;
        notAfter: string;
        altNames?: (string)[] | null;
        signatureAlgorithm: string;
        fingerPrint: string;
        publicKey: any;
    }

    interface Subject {
        countryName: string;
        postalCode: string;
        stateOrProvinceName: string;
        localityName: string;
        streetAddress: string;
        organizationName: string;
        organizationalUnitName: string;
        commonName: string;
    }

    interface Issuer {
        countryName: string;
        stateOrProvinceName: string;
        localityName: string;
        organizationName: string;
        commonName: string;
    }

    interface KV {
        key: string;
        value: any;
    }

    interface KeyModification {
        is_delete: boolean;
        value: Buffer;
        timestamp: Timestamp;
        tx_id: string;
    }

    export class HistoryQueryIterator {
        constructor(handler: any, channel_id: any, txID: any, response: any, type: any);

        next(): Promise<NextKeyModificationResult>;

        close(): Promise<any>;
    }

    export class StateQueryIterator {
        constructor(handler: any, channel_id: any, txID: any, response: any, type: any);

        next(): Promise<NextResult>;

        close(): Promise<any>;
    }
}
