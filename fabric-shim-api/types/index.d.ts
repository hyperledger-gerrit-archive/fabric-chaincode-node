/*
 Copyright 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/
declare module 'fabric-shim-api' {

    import { EventEmitter } from 'events';
    import { LoggerInstance } from 'winston';

    interface Timestamp {
        seconds: number;
        nanos: number;
    }

    interface ChaincodeResponse {
        status: number;
        message: string;
        payload: Buffer;
    }

    export function error(msg: Buffer): ChaincodeResponse;
    export function newLogger(name: string): LoggerInstance;
    export function start(chaincode: ChaincodeInterface): any;
    export function success(payload?: Buffer): ChaincodeResponse;

    export class Shim {
        static error(msg: Buffer): ChaincodeResponse;
        static newLogger(name: string): LoggerInstance;
        static start(chaincode: ChaincodeInterface): any;
        static success(payload?: Buffer): ChaincodeResponse;
    }

    export class ClientIdentity {
        constructor(stub: ChaincodeStub);
        assertAttributeValue(attrName: string, attrValue: string): boolean;
        getAttributeValue(attrName: string): string | null;
        getID(): string;
        getIDBytes(): Uint8Array;
        getMSPID(): string;
    }

    interface SerializedIdentity {
        mspid: string;
        idBytes: Buffer;
    }

    interface QueryResponseMetadata {
        fetchedRecordsCount: number;
        bookmark: string;
    }

    interface StateQueryResponse<T> {
        iterator: T;
        metadata: QueryResponseMetadata;
    }

    enum RESPONSE_CODE {
        OK = 200,
        ERRORTHRESHOLD = 400,
        ERROR = 500
    }

    class ResponseCode {
        OK: number;
        ERRORTHRESHOLD: number;
        ERROR: number;
    }

    interface AsyncIterable<T> {
        [Symbol.asyncIterator]: () => AsyncIterator<T>;
    }

    export class ChaincodeStub {
        getArgs(): string[];
        getStringArgs(): string[];
        getFunctionAndParameters(): { params: string[], fcn: string };

        getTxID(): string;
        getChannelID(): string;
        getCreator(): SerializedIdentity;
        getTransient(): Map<string, Buffer>;

        getSignedProposal(): ChaincodeProposal.SignedProposal;
        getTxTimestamp(): Timestamp;
        getBinding(): string;

        getState(key: string): Promise<Buffer>;
        putState(key: string, value: Buffer): Promise<void>;
        deleteState(key: string): Promise<void>;
        setStateValidationParameter(key: string, ep: Buffer): Promise<void>;
        getStateValidationParameter(key: string): Promise<Buffer>;
        getStateByRange(startKey: string, endKey: string): Promise<Iterators.StateQueryIterator> & AsyncIterable<Iterators.KV>;
        getStateByRangeWithPagination(startKey: string, endKey: string, pageSize: number, bookmark?: string): Promise<StateQueryResponse<Iterators.StateQueryIterator>> & AsyncIterable<Iterators.KV>;
        getStateByPartialCompositeKey(objectType: string, attributes: string[]): Promise<Iterators.StateQueryIterator> & AsyncIterable<Iterators.KV>;
        getStateByPartialCompositeKeyWithPagination(objectType: string, attributes: string[], pageSize: number, bookmark?: string): Promise<StateQueryResponse<Iterators.StateQueryIterator>> & AsyncIterable<Iterators.KV>;

        getQueryResult(query: string): Promise<Iterators.StateQueryIterator> & AsyncIterable<Iterators.KV>;
        getQueryResultWithPagination(query: string, pageSize: number, bookmark?: string): Promise<StateQueryResponse<Iterators.StateQueryIterator>> & AsyncIterable<Iterators.KV>;
        getHistoryForKey(key: string): Promise<Iterators.HistoryQueryIterator> & AsyncIterable<Iterators.KeyModification>;

        invokeChaincode(chaincodeName: string, args: string[], channel: string): Promise<ChaincodeResponse>;
        setEvent(name: string, payload: Buffer): void;

        createCompositeKey(objectType: string, attributes: string[]): string;
        splitCompositeKey(compositeKey: string): SplitCompositekey;

        getPrivateData(collection: string, key: string): Promise<Buffer>;
        getPrivateDataHash(collection: string, key: string): Promise<Buffer>;
        putPrivateData(collection: string, key: string, value: Buffer): Promise<void>;
        deletePrivateData(collection: string, key: string): Promise<void>;
        setPrivateDataValidationParameter(collection: string, key: string, ep: Buffer): Promise<void>;
        getPrivateDataValidationParameter(collection: string, key: string): Promise<Buffer>;
        getPrivateDataByRange(collection: string, startKey: string, endKey: string): Promise<Iterators.StateQueryIterator> & AsyncIterable<Iterators.KV>;
        getPrivateDataByPartialCompositeKey(collection: string, objectType: string, attributes: string[]): Promise<Iterators.StateQueryIterator> & AsyncIterable<Iterators.KV>;
        getPrivateDataQueryResult(collection: string, query: string): Promise<Iterators.StateQueryIterator> & AsyncIterable<Iterators.KV>;

        static RESPONSE_CODE: ResponseCode;
    }

    interface SplitCompositekey {
        objectType: string;
        attributes: string[];
    }

    interface ChaincodeInterface {
        Init(stub: ChaincodeStub): Promise<ChaincodeResponse>;
        Invoke(stub: ChaincodeStub): Promise<ChaincodeResponse>;
    }

    export namespace Iterators {

        interface CommonIterator<T> {
            close(): Promise<void>;
            next(): Promise<NextResult<T>>;
        }

        interface NextResult<T> {
            value: T;
            done: boolean;
        }

        type HistoryQueryIterator = CommonIterator<KeyModification>;
        type StateQueryIterator = CommonIterator<KV>;

        interface NextKeyModificationResult {
            value: KeyModification;
            done: boolean;
        }

        interface KV {
            namespace: string;
            key: string;
            value: Uint8Array;
        }

        interface KeyModification {
            isDelete: boolean;
            value: Uint8Array;
            timestamp: Timestamp;
            txId: string;
        }
    }

    export namespace ChaincodeProposal {
        interface SignedProposal {
            proposal: Proposal;
            signature: Uint8Array;
        }

        interface Proposal {
            header: Header;
            payload: ChaincodeProposalPayload;
        }

        interface Header {
            channelHeader: ChannelHeader;
            signatureHeader: SignatureHeader;
        }

        interface ChannelHeader {
            type: HeaderType;
            version: number;
            timestamp: Timestamp;
            channelId: string;
            txId: string;
            epoch: number;
            extension: Uint8Array;
            tlsCertHash: Uint8Array;
        }

        interface SignatureHeader {
            creator: SerializedIdentity;
            nonce: Uint8Array;
        }

        interface ChaincodeProposalPayload {
            input: Buffer;
            getInput(): Buffer;
            transientMap: Map<string, Buffer>;
            getTransientMap(): Map<string, Buffer>;
        }

        enum HeaderType {
            MESSAGE = 0,
            CONFIG = 1,
            CONFIG_UPDATE = 2,
            ENDORSER_TRANSACTION = 3,
            ORDERER_TRANSACTION = 4,
            DELIVER_SEEK_INFO = 5,
            CHAINCODE_PACKAGE = 6,
            PEER_ADMIN_OPERATION = 8
        }
    }

    export class KeyEndorsementPolicy {
        constructor(policy?: Buffer);
        getPolicy(): Buffer;
        addOrgs(role: string, ...newOrgs: string[]): void;
        delOrgs(...delOrgs: string[]):void;
        listOrgs(): string[];
    }

    export enum ENDORSER_ROLES {
        MEMBER = 'MEMBER',
        PEER = 'PEER'
    }
}
