/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const ByteBuffer = require('bytebuffer');
const test = require('../base.js');
const sinon = require('sinon');

const Stub = require('fabric-shim/lib/stub.js');
const Handler = require('fabric-shim/lib/handler.js');
const StateQueryIterator = require('fabric-shim/lib/iterators.js').StateQueryIterator;
const HistoryQueryIterator = require('fabric-shim/lib/iterators.js').HistoryQueryIterator;

const grpc = require('grpc');
const path = require('path');

const _commonProto = grpc.load({
	root: path.join(__dirname, '../../src/lib/protos'),
	file: 'common/common.proto'
}).common;

const _proposalProto = grpc.load({
	root: path.join(__dirname, '../../src/lib/protos'),
	file: 'peer/proposal.proto'
}).protos;

const _cclProto = grpc.load({
	root: path.join(__dirname, '../../src/lib/protos'),
	file: 'peer/chaincode.proto'
}).protos;

const _idProto = grpc.load({
	root: path.join(__dirname, '../../src/lib/protos'),
	file: 'msp/identities.proto'
}).msp;

const EXPECTED_MAX_RUNE = '\uffff';

test('Chaincode stub constructor tests', (t) => {
	// arguments from the protobuf are an array of ByteBuffer objects
	let buf1 = ByteBuffer.fromUTF8('invoke');
	let buf2 = ByteBuffer.fromUTF8('someKey');
	let buf3 = ByteBuffer.fromUTF8('someValue');

	t.throws(
		() => {
			new Stub(
				'dummyClient',
				'dummyTxid',
				{
					args: [buf1, buf2, buf3]
				},
				'dummySignedProposal');
		},
		/Failed extracting proposal from signedProposal/,
		'Test invalid proposal object'
	);

	let sp = new _proposalProto.Proposal();

	t.throws(
		() => {
			new Stub(
				'dummyClient',
				'dummyTxid',
				{
					args: [buf1, buf2, buf3]
				},
				{
					proposal_bytes: sp.toBuffer()
				});
		},
		/Proposal header is empty/,
		'Test proposal object with empty header'
	);

	sp.setHeader(Buffer.from('dummyHeader'));

	t.throws(
		() => {
			new Stub(
				'dummyClient',
				'dummyTxid',
				{
					args: [buf1, buf2, buf3]
				},
				{
					proposal_bytes: sp.toBuffer()
				});
		},
		/Proposal payload is empty/,
		'Test proposal object with empty payload'
	);

	sp.setPayload(Buffer.from('dummyPayload'));

	t.throws(
		() => {
			new Stub(
				'dummyClient',
				'dummyTxid',
				{
					args: [buf1, buf2, buf3]
				},
				{
					proposal_bytes: sp.toBuffer()
				});
		},
		/Could not extract the header from the proposal/,
		'Test proposal object with invalid header'
	);

	let header = new _commonProto.Header();

	header.setSignatureHeader(Buffer.from('dummySignatureHeader'));
	sp.setHeader(header.toBuffer());

	t.throws(
		() => {
			new Stub(
				'dummyClient',
				'dummyTxid',
				{
					args: [buf1, buf2, buf3]
				},
				{
					proposal_bytes: sp.toBuffer()
				});
		},
		/Decoding SignatureHeader failed/,
		'Test proposal object with invalid signature header'
	);

	let signatureHeader = new _commonProto.SignatureHeader();
	signatureHeader.setNonce(Buffer.from('12345'));
	signatureHeader.setCreator(Buffer.from('dummyCreator'));
	header.setSignatureHeader(signatureHeader.toBuffer());
	sp.setHeader(header.toBuffer());

	t.throws(
		() => {
			new Stub(
				'dummyClient',
				'dummyTxid',
				{
					args: [buf1, buf2, buf3]
				},
				{
					proposal_bytes: sp.toBuffer()
				});
		},
		/Decoding SerializedIdentity failed/,
		'Test proposal object with invalid creator'
	);

	signatureHeader = new _commonProto.SignatureHeader();
	signatureHeader.setNonce(Buffer.from('12345'));
	signatureHeader.setCreator(new _idProto.SerializedIdentity().toBuffer());
	header.setSignatureHeader(signatureHeader.toBuffer());
	sp.setHeader(header.toBuffer());
	sp.setPayload(Buffer.from('dummy proposal payload'));

	t.throws(
		() => {
			new Stub(
				'dummyClient',
				'dummyTxid',
				{
					args: [buf1, buf2, buf3]
				},
				{
					proposal_bytes: sp.toBuffer()
				});
		},
		/Decoding ChaincodeProposalPayload failed/,
		'Test proposal object with invalid proposal payload'
	);

	header.setChannelHeader(Buffer.from('dummyChannelHeader'));
	sp.setHeader(header.toBuffer());

	t.throws(
		() => {
			new Stub(
				'dummyClient',
				'dummyTxid',
				{
					args: []
				},
				{
					proposal_bytes: sp.toBuffer()
				});
		},
		/Decoding ChannelHeader failed/,
		'Test catching invalid ChannelHeader'
	);

	header = new _commonProto.Header();
	header.setSignatureHeader(signatureHeader.toBuffer());
	sp.setHeader(header.toBuffer());

	let ccpayload = new _proposalProto.ChaincodeProposalPayload();
	ccpayload.setInput(Buffer.from('dummyChaincodeInput'));
	sp.setPayload(ccpayload.toBuffer());
	let stub = new Stub(
		'dummyClient',
		'dummyTxid',
		{
			args: [buf1, buf2, buf3]
		},
		{
			proposal_bytes: sp.toBuffer()
		});
	t.equal(stub.args[0], 'invoke', 'Test parsing first argument');
	t.equal(stub.args[1], 'someKey', 'Test parsing second argument');
	t.equal(stub.getTxID(), 'dummyTxid', 'Test getTxID()');

	t.end();
});

test('invokeChaincode', (t) => {
	let mockHandler = sinon.createStubInstance(Handler);
	let stub = new Stub(
		mockHandler,
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});
	mockHandler.handleInvokeChaincode.resolves('response');

	let dummyArgs = ['arg', 'arg2'];
	let allProm = [];

	let pr = stub.invokeChaincode('mycc', dummyArgs)
		.then(() => {
			t.deepEqual(mockHandler.handleInvokeChaincode.firstCall.args, ['mycc', dummyArgs, 'dummyTxid'], 'Test called with correct arguments');
		})
	allProm.push(pr);
	pr = stub.invokeChaincode('mycc', dummyArgs, 'mychannel')
		.then(() => {
			t.deepEqual(mockHandler.handleInvokeChaincode.secondCall.args, ['mycc/mychannel', dummyArgs, 'dummyTxid'], 'Test called with correct arguments');
		})
	allProm.push(pr);
	Promise.all(allProm)
		.then(() => {
			t.end();
		});
});

test('getState', (t) => {
	let mockHandler = sinon.createStubInstance(Handler);
	let stub = new Stub(
		mockHandler,
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});

	// getState will return a Buffer object
	mockHandler.handleGetState.withArgs('key1', 'dummyTxid').resolves(Buffer.from('response'));
	let allProm = [];

	let pr = stub.getState('key1')
		.then((response) => {
			t.equal(response.toString(), 'response', 'Test getState invokes correctly amd response is correct');
		});
	allProm.push(pr);
	Promise.all(allProm)
		.then(() => {
			t.end();
		});

});

test('putState', (t) => {
	let mockHandler = sinon.createStubInstance(Handler);
	let stub = new Stub(
		mockHandler,
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});
	mockHandler.handlePutState.resolves('response');
	let allProm = [];

	// Must create a Buffer from your data.
	let dataToPut = Buffer.from('some data');
	let pr = stub.putState('key1', dataToPut)
		.then(() => {
			t.deepEqual(mockHandler.handlePutState.firstCall.args, ['key1', dataToPut, 'dummyTxid'], 'Test call to handler is correct');
		});
	allProm.push(pr);
	Promise.all(allProm)
		.then(() => {
			t.end();
		});

});

test('deleteState', (t) => {
	let mockHandler = sinon.createStubInstance(Handler);
	let stub = new Stub(
		mockHandler,
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});
	mockHandler.handleDeleteState.resolves('response');
	let allProm = [];

	let pr = stub.deleteState('key1')
		.then(() => {
			t.deepEqual(mockHandler.handleDeleteState.firstCall.args, ['key1', 'dummyTxid'], 'Test call to handler is correct');
		});

	allProm.push(pr);
	Promise.all(allProm)
		.then(() => {
			t.end();
		});

});

test('getHistoryForKey', (t) => {
	let mockHandler = sinon.createStubInstance(Handler);
	let mockIterator = sinon.createStubInstance(HistoryQueryIterator);
	let stub = new Stub(
		mockHandler,
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});
	mockHandler.handleGetHistoryForKey.resolves(mockIterator);
	let allProm = [];

	let pr = stub.getHistoryForKey('key1')
		.then((result) => {
			t.equal(result, mockIterator, 'Test it returns an iterator');
			t.deepEqual(mockHandler.handleGetHistoryForKey.firstCall.args, ['key1', 'dummyTxid'], 'Test call to handler is correct');
		});

	allProm.push(pr);
	Promise.all(allProm)
		.then(() => {
			t.end();
		});

});

test('getQueryResult', (t) => {
	let mockHandler = sinon.createStubInstance(Handler);
	let mockIterator = sinon.createStubInstance(StateQueryIterator);
	let stub = new Stub(
		mockHandler,
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});
	mockHandler.handleGetQueryResult.resolves(mockIterator);
	let allProm = [];

	let pr = stub.getQueryResult('query1')
		.then((result) => {
			t.equal(result, mockIterator, 'Test it returns an iterator');
			t.deepEqual(mockHandler.handleGetQueryResult.firstCall.args, ['query1', 'dummyTxid'], 'Test call to handler is correct');
		});

	allProm.push(pr);
	Promise.all(allProm)
		.then(() => {
			t.end();
		});

});


test('getStateByRange', (t) => {
	let mockHandler = sinon.createStubInstance(Handler);
	let mockIterator = sinon.createStubInstance(StateQueryIterator);
	let stub = new Stub(
		mockHandler,
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});
	mockHandler.handleGetStateByRange.resolves(mockIterator);
	let allProm = [];

	let pr = stub.getStateByRange('start', 'end')
		.then((result) => {
			t.equal(result, mockIterator, 'Test it returns an iterator');
			t.deepEqual(mockHandler.handleGetStateByRange.firstCall.args, ['start', 'end', 'dummyTxid'], 'Test call to handler is correct');
		});
	allProm.push(pr);

	pr = stub.getStateByRange('', 'end')
		.then((result) => {
			t.equal(result, mockIterator, 'Test it returns an iterator');
			t.deepEqual(mockHandler.handleGetStateByRange.secondCall.args, ['\x01', 'end', 'dummyTxid'], 'Test call to handler is correct');
		});
	allProm.push(pr);

	pr = stub.getStateByRange(null, 'end')
		.then((result) => {
			t.equal(result, mockIterator, 'Test it returns an iterator');
			t.deepEqual(mockHandler.handleGetStateByRange.thirdCall.args, ['\x01', 'end', 'dummyTxid'], 'Test call to handler is correct');
		});
	allProm.push(pr);
	Promise.all(allProm)
		.then(() => {
			t.end();
		});

});



test('setEvent', (t) => {
	let stub = new Stub(
		'dummyClient',
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});

	t.throws(
		() => {
			stub.setEvent();
		},
		/non-empty/,
		'Test catching no parameters'
	);

	t.throws(
		() => {
			stub.setEvent('', 'some data');
		},
		/non-empty/,
		'Test catching blank event name'
	);

	t.throws(
		() => {
			stub.setEvent(['arg'], 'some data');
		},
		/non-empty/,
		'Test catching no string event name'
	);

	stub.setEvent('event1', Buffer.from('payload1'));
	t.equal(stub.chaincodeEvent.getEventName(), 'event1', 'Test event name is correct');
	t.deepEqual(stub.chaincodeEvent.getPayload().toString('utf8'), 'payload1', 'Test payload is correct');
	t.end();
})

test('CreateCompositeKey', (t) => {
	let stub = new Stub(
		'dummyClient',
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});

	t.throws(
		() => {
			stub.createCompositeKey();
		},
		/non-zero length/,
		'Test catching invalid object type'
	);

	t.throws(
		() => {
			stub.createCompositeKey('key');
		},
		/must be an array/,
		'Test catching invalid attributes'
	);

	t.throws(
		() => {
			stub.createCompositeKey('k\x99x33ey', []);
		},
		/Invalid UTF-8/,
		'Test bad utf-8 in object type'
	);

	t.throws(
		() => {
			stub.createCompositeKey('type', ['k\x99x33ey']);
		},
		/Invalid UTF-8/,
		'Test bad utf-8 in attributes'
	);


	t.equal(stub.createCompositeKey('key', []), '\u0000key\u0000', 'Test createCompositeKey with no attributes returns expected key');
	t.equal(stub.createCompositeKey('key', ['attr1']), '\u0000key\u0000attr1\u0000', 'Test createCompositeKey with single attribute returns expected key');
	t.equal(stub.createCompositeKey('key', ['attr1', 'attr2','attr3']), '\u0000key\u0000attr1\u0000attr2\u0000attr3\u0000', 'Test createCompositeKey with multiple attributes returns expected key');

	t.end();
});

test('splitCompositeKey: ', (t) => {
	let objectType;
	let attributes;
	let stub = new Stub(
		'dummyClient',
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});

	// test splitting stuff that was created using the createCompositeKey calls
	({objectType, attributes} = stub.splitCompositeKey(stub.createCompositeKey('key', [])));
	t.equal(objectType, 'key', 'Test splitting of compositeKey with only object type, objecttype part');
	t.deepEqual(attributes, [], 'Test splitting of compositeKey with only object type, attributes part');

	({objectType, attributes} = stub.splitCompositeKey(stub.createCompositeKey('key', ['attr1'])));
	t.equal(objectType, 'key', 'Test splitting of compositeKey with 1 attribute, objecttype part');
	t.deepEqual(attributes, ['attr1'], 'Test splitting of compositeKey with 1 attribute, attributes part');

	({objectType, attributes} = stub.splitCompositeKey(stub.createCompositeKey('key', ['attr1', 'attr2'])));
	t.equal(objectType, 'key', 'Test splitting of compositeKey with >1 attributes, objecttype part');
	t.deepEqual(attributes, ['attr1', 'attr2'], 'Test splitting of compositeKey with >1 attributes, attributes part');

	// pass in duff values
	t.deepEqual(stub.splitCompositeKey(), {objectType: null, attributes: []}, 'Test no value passed');
	t.deepEqual(stub.splitCompositeKey('something'), {objectType: null, attributes: []}, 'Test no delimited value passed');
	t.deepEqual(stub.splitCompositeKey('something\u0000\hello'), {objectType: null, attributes: []}, 'Test incorrectly delimited value passed');
	t.deepEqual(stub.splitCompositeKey('\x00'), {objectType: null, attributes: []}, 'Test on delimiter value passed');

	t.end();
});

test('getStartByPartialCompositeKey', (t) => {
	let stub = new Stub(
		'dummyClient',
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer()
		}
	);

	let expectedKey = '\u0000key\u0000attr1\u0000attr2\u0000';
	let cckStub = sinon.stub(stub, 'createCompositeKey').returns(expectedKey);
	let gsbrStub = sinon.stub(stub, 'getStateByRange');

	stub.getStateByPartialCompositeKey('key', ['attr1', 'attr2']);
	t.equal(cckStub.calledOnce, true, 'Test getStateByPartialCompositeKey calls createCompositeKey once');
	t.deepEqual(cckStub.firstCall.args, ['key', ['attr1', 'attr2']], 'Test getStateByPartialCompositeKey calls createCompositeKey with the correct parameters');
	t.equal(gsbrStub.calledOnce, true, 'Test getStateByPartialCompositeKey calls getStateByRange Once');
	t.deepEqual(gsbrStub.firstCall.args, [expectedKey, expectedKey + EXPECTED_MAX_RUNE], 'Test getStateByPartialCompositeKey calls getStateByRange with the right arguments');
	t.end();

});

test('Arguments Tests', (t) => {
	let buf1 = ByteBuffer.fromUTF8('invoke');
	let buf2 = ByteBuffer.fromUTF8('key');
	let buf3 = ByteBuffer.fromUTF8('value');
	let stub = new Stub(
		'dummyClient',
		'dummyTxid',
		{
			args: [buf1, buf2, buf3]
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});

	t.equal(stub.getArgs().length, 3, 'Test getArgs() returns expected number of arguments');
	t.equal(typeof stub.getArgs()[0], 'string', 'Test getArgs() returns the first argument as string');
	t.equal(stub.getArgs()[1], 'key', 'Test getArgs() returns the 2nd argument as string "key"');
	t.equal(stub.getStringArgs().length, 3, 'Test getStringArgs() returns expected number of arguments');
	t.equal(stub.getStringArgs()[2], 'value', 'Test getStringArgs() returns 3rd argument as string "value"');
	t.equal(typeof stub.getFunctionAndParameters(), 'object', 'Test getFunctionAndParameters() returns and object');
	t.equal(stub.getFunctionAndParameters().fcn, 'invoke', 'Test getFunctionAndParameters() returns the function name properly');
	t.equal(Array.isArray(stub.getFunctionAndParameters().params), true, 'Test getFunctionAndParameters() returns the params array');
	t.equal(stub.getFunctionAndParameters().params.length, 2, 'Test getFunctionAndParameters() returns the params array with 2 elements');
	t.equal(stub.getFunctionAndParameters().params[0], 'key', 'Test getFunctionAndParameters() returns the "key" string as the first param');
	t.equal(stub.getFunctionAndParameters().params[1], 'value', 'Test getFunctionAndParameters() returns the "value" string as the 2nd param');

	stub = new Stub(
		'dummyClient',
		'dummyTxid',
		{
			args: [buf1]
		},
		{
			proposal_bytes: newProposal().toBuffer()
		});
	t.equal(stub.getFunctionAndParameters().fcn, 'invoke', 'Test getFunctionAndParameters() returns the function name properly');
	t.equal(stub.getFunctionAndParameters().params.length, 0, 'Test getFunctionAndParameters() returns the params array with 0 elements');

	stub = new Stub(
		'dummyClient',
		'dummyTxid',
		{
			args: []
		},
		{
			proposal_bytes: newProposal().toBuffer(),
			signature: Buffer.from('dummyHex')
		});
	t.equal(stub.getFunctionAndParameters().fcn, '', 'Test getFunctionAndParameters() returns empty function name properly');
	t.equal(stub.getFunctionAndParameters().params.length, 0, 'Test getFunctionAndParameters() returns the params array with 0 elements');

	t.equal(stub.getCreator().getMspid(), 'dummyMSPId', 'Test getCreator() returns the expected buffer object');
	t.equal(stub.getTransient().get('testKey').toBuffer().toString(), 'testValue', 'Test getTransient() returns the expected transient map object');

	t.equal(stub.getSignedProposal().signature.toString(), 'dummyHex', 'Test getSignedProposal() returns valid signature');
	t.equal(stub.getSignedProposal().proposal.header.signature_header.nonce.toString(), '12345', 'Test getSignedProposal() returns valid nonce');
	t.equal(stub.getSignedProposal().proposal.header.signature_header.creator.mspid, 'dummyMSPId', 'Test getSignedProposal() returns valid mspid');

	t.end();
});

function newProposal() {
	let sp = new _proposalProto.Proposal();
	let signatureHeader = new _commonProto.SignatureHeader();
	let creator = new _idProto.SerializedIdentity();
	creator.setMspid('dummyMSPId');
	signatureHeader.setCreator(creator.toBuffer());
	signatureHeader.setNonce(Buffer.from('12345'));
	let header = new _commonProto.Header();
	header.setSignatureHeader(signatureHeader.toBuffer());
	sp.setHeader(header.toBuffer());
	let ccpayload = new _proposalProto.ChaincodeProposalPayload();
	ccpayload.setInput(Buffer.from('dummyChaincodeInput'));
	ccpayload.setTransientMap({'testKey': Buffer.from('testValue')});
	sp.setPayload(ccpayload.toBuffer());

	return sp;
}
