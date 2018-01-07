/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const test = require('../base.js');

let Chaincode = class {
	async Init(stub) {
		return 'init called';
	}

	async Invoke(stub) {
		return 'invoke called';
	}
};

const MockStub = require('../../src/lib/mockstub');

test('getters and setters', (t) => {
	let stub = new MockStub('test', new Chaincode());
	const initialFcnAndArgs = ['fcn', 'arg1', 'arg2'];
	stub.args = initialFcnAndArgs;

	const args = ['arg1', 'arg2'];
	const fcnAndParams = stub.getFunctionAndParameters();
	t.deepEqual(fcnAndParams.params, args, 'Get function and parameters: parameters');
	t.deepEqual(stub.getStringArgs(), initialFcnAndArgs, 'Get string args');
	t.deepEqual(stub.getArgs(), initialFcnAndArgs, 'Get args');
	t.deepEqual(fcnAndParams.params, args, 'Get function and parameters: parameters');
	t.equal(fcnAndParams.fcn, 'fcn', 'Get function and parameters: function');

	stub = new MockStub('test', new Chaincode());
	stub.txID = 'test';
	t.equal(stub.getTxID(), 'test', 'Get transaction id');

	stub = new MockStub('test', new Chaincode());
	stub.txTimestamp = 123;
	t.equal(stub.getTxTimestamp(), 123, 'Get tx timestamp');

	stub = new MockStub('test', new Chaincode());
	stub.binding = {binding: 'binding'};
	t.deepEqual(stub.getBinding(), {binding: 'binding'}, 'Get binding');

	stub = new MockStub('test', new Chaincode());
	stub.signedProposal = {signed: 'proposal'};
	t.deepEqual(stub.getSignedProposal(), {signed: 'proposal'}, 'Get signed proposal');

	stub = new MockStub('test', new Chaincode());
	stub.creator = 'testcreator';
	t.equal(stub.getCreator(), 'testcreator', 'Get creator');

	stub = new MockStub('test', new Chaincode());
	stub.setEvent('eventname', Buffer.from('event payload'));
	t.equal(stub.chaincodeEvent.event_name, 'eventname', 'Set event: name');
	t.equal(Buffer.from(stub.chaincodeEvent.payload.toArrayBuffer()).toString(), 'event payload', 'Set event: payload');

	t.end();
});

test('state', async (t) => {
	let stub = new MockStub('test', new Chaincode());
	stub.state = {testKey: 'testValue'};
	t.equal(await stub.getState('testKey'), 'testValue', 'Get a key');
	t.equal(await stub.getState('nonExistingKey'), '', 'Get an empty result on non existing key');

	stub = new MockStub('test', new Chaincode());
	await stub.putState('testKey1', 'testValue1');
	t.equal(stub.state.testKey1, 'testValue1', 'Update the state with putState');
	t.equal(await stub.getState('testKey1'), 'testValue1', 'Get the state after putting it.');

	stub = new MockStub('test', new Chaincode());
	stub.state = {testKey: 'testValue'};
	await stub.deleteState('testKey');
	t.equal(stub.state.testKey, undefined, 'Delete the state');


	t.end();
});

test('mock transactions', async (t) => {

	test('set values on transaction start', async(t) => {
        let stub = new MockStub('test', new Chaincode());
        await stub.mockTransactionStart('testtxid', {test: 'transient'}, {test: 'signedProposal'}, 'testbinding', {seconds: 20});
        t.equal(stub.txID, 'testtxid', 'Set the transaction id on transaction start');
        t.deepEqual(stub.transientMap, {test: 'transient'}, 'Set the transient map on transaction start');
        t.deepEqual(stub.signedProposal, {test: 'signedProposal'}, 'Set the signed proposal on transaction start');
        t.equal(stub.binding, 'testbinding', 'Set the binding on transaction start');
        t.equal(stub.txTimestamp.seconds, 20, 'Set the transaction timestamp on transaction start');


        await stub.mockTransactionEnd();
        t.equal(stub.txID, '', 'Remove the tx id on transaction end');
        t.deepEqual(stub.transientMap, {}, 'Set an empty transient map on tx end');
        t.deepEqual(stub.signedProposal, {}, 'Set an empty signed proposal on transaction end');
        t.deepEqual(stub.transientMap, {}, 'Set an empty transient map on transaction end');
        t.equal(stub.binding, '', 'Set empty binding on transaction end');
        t.equal(stub.txTimestamp.seconds, 0, 'Set seconds to zero on transaction end');

		stub = new MockStub('test', new Chaincode());
        await stub.mockTransactionStart('testtxid');
        t.deepEqual(stub.transientMap, {}, 'Set an empty transient map when not provided');
        t.deepEqual(stub.signedProposal, {}, 'Set an empty signed proposal when not provided');
        t.deepEqual(stub.transientMap, {}, 'Set an empty transient map when not provided');
        t.equal(stub.binding, '', 'Set empty binding when not provided');
        t.equal(stub.txTimestamp.seconds, 0, 'Set seconds to zero when not provided');

		t.end();
	});

	test('init and invoke', async (t) => {
        const args = ['arg1', 'arg2'];

        let stub = new MockStub('test', new Chaincode());
        let res = await
        stub.mockInit('inittxid', args);
        t.equal(res, 'init called', 'Call the chaincode init function with mockInit');

        stub = new MockStub('test', new Chaincode());
        res = await
        stub.mockInvoke('invoketxid', args);
        t.equal(res, 'invoke called', 'Call the chaincode invoke function with mockInvoke');

        t.end();
    });

	t.end();
});
