/*
 Copyright Arne Rutjes All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const Stub = require('./stub');

/**
 * MockStub is an implementation of ChaincodeStubInterface for unit testing chaincode.
 * Use this instead of ChaincodeStub in your chaincode's unit test calls to Init or Invoke.
 */
class MockStub {
	constructor(name, chaincode, channel_id) {
		this.name = name;
		this.chaincode = chaincode;
		this.channel_id = channel_id;
		this.state = {};
		this.args = [];
		this.binding = '';
	}

	getArgs() {
		return this.args;
	}

	getStringArgs() {
		return this.args;
	}

	getFunctionAndParameters() {
		return Stub.prototype.getFunctionAndParameters.apply(this);
	}

	getTxID() {
		return this.txID;
	}

	getChannelID() {
		return this.channel_id;
	}

	getCreator() {
		return this.creator;
	}

	getTransient() {
		return this.transientMap;
	}

	getSignedProposal() {
		return this.signedProposal;
	}

	getTxTimestamp() {
		return this.txTimestamp;
	}

	getBinding() {
		return this.binding;
	}

	async getState(key) {
		return Promise.resolve(this.state[key] || '');
	}

	async putState(key, value) {
		this.state[key] = value;

		return Promise.resolve();
	}

	async deleteState(key) {
		delete this.state[key];

		return Promise.resolve();
	}

	async getStateByRange(startKey, endKey) {
		throw new Error('Not implemented.');
	}

	async getQueryResult(query) {
		throw new Error('Not implemented.');
	}

	async getHistoryForKey(key) {
		throw new Error('Not implemented.');
	}

	async invokeChaincode(chaincodeName, args, channel) {
		throw new Error('Not implemented.');
	}

	setEvent(name, payload) {
		return Stub.prototype.setEvent.apply(this, arguments);
	}

	createCompositeKey(objectType, attributes) {
		return Stub.prototype.createCompositeKey.apply(this, arguments);
	}

	splitCompositeKey(compositeKey) {
		return Stub.prototype.createCompositeKey.apply(this, arguments);
	}

	async getStateByPartialCompositeKey(objectType, attributes) {
		throw new Error('Not implemented.');
	}

	/**
	 * Invoke this chaincode, also starts and ends a transaction.
	 */
	async mockInvoke(txID, args) {
		this.args = args;

		this.mockTransactionStart(txID);
		const res = await this.chaincode.Invoke.apply(this.chaincode, [this]);
		this.mockTransactionEnd();

		return res;
	}

	/**
	 * Initialize this chaincode, also starts and ends a transaction.
	 */
	async mockInit(txID, args) {
		this.args = args;

		this.mockTransactionStart(txID);
		const res = await this.chaincode.Init.apply(this.chaincode, [this]);
		this.mockTransactionEnd();

		return res;
	}

	/**
	 * Used to indicate to a chaincode that it is part of a transaction.
	 * This is important when chaincodes invoke each other.
	 * MockStub doesn't support concurrent transactions at present.
	 */
	mockTransactionStart(txID, transientMap, signedProposal, binding, txTimeStamp) {
		this.txID = txID;
		this.transientMap = transientMap || {};
		this.signedProposal = signedProposal || {};
		this.binding = binding || '';
		this.txTimestamp = txTimeStamp || {
			seconds: 0,
			nanos: 0
		};
	}

	/**
	 * End a mocked transaction, clearing the txID, transientMap, signedProposal,
	 * binding, txTimestamp.
	 */
	mockTransactionEnd() {
		this.txID = '';
		this.transientMap = {};
		this.signedProposal = {};
		this.binding = '';
		this.txTimestamp = {
			seconds: 0,
			nanos: 0
		};
	}
}

module.exports = MockStub;