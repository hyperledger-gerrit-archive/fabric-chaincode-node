/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

/* eslint-disable no-console */
'use strict';

const fs = require('fs-extra');
const path = require('path');

require('chai').should();
const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));

const rewire = require('rewire');
// class under test
const Bootstrap = require('../../../../../lib/contract-spi/bootstrap');
const Contract = require('fabric-contract-api').Contract;
const Generate = rewire('../../../../../lib/cmds/metadata/lib/generate');

function log(...e) {
    // eslint-disable-next-line
    console.log(...e);
}

describe('generate', () => {

    /**
     * A fake  contract class; pure loading tests in this file
     */
    class sc extends Contract {
        constructor() {
            super();
        }
        /**
         * @param {object} api api
         */
        alpha(api) {
            log(api);
        }
    }

    class MockChaincodeFromContract {
        constructor(contracts, serializers, metadata, title, version) {
            this.contracts = contracts;
            this.serializers = serializers;
            this.metadata =  metadata;
            this.title = title;
            this.version = version;
        }
    }

    let sandbox;
    let getInfoFromContractStub;
    let getMetadataStub;
    let infoStub;
    let writeJSONStub;


    beforeEach('Sandbox creation', () => {
        sandbox = sinon.createSandbox();
        writeJSONStub = sandbox.stub();
    });

    afterEach('Sandbox restoration', () => {
        sandbox.restore();
    });

    describe('#handler', () => {
        let args = {'module-path': process.cwd(), fileName : path.resolve(process.cwd(), 'file')};

        beforeEach('Sandbox creation', () => {
            const FakeLogger = {
                info : () => {}
            };

            getMetadataStub = sandbox.stub(Bootstrap, 'getMetadata');
            getInfoFromContractStub = sandbox.stub(Bootstrap, 'getInfoFromContract');
            infoStub = sandbox.stub(FakeLogger, 'info');

            Generate.__set__('logger', FakeLogger);
        });

        afterEach('Sandbox restoration', async () => {
            getMetadataStub.restore();
            getInfoFromContractStub.restore();
            if (args.fileName) {
                await fs.remove(args.fileName);
            }
        });

        it ('should write the contract metadata to a json file when no file extension is specified', async () => {
            getMetadataStub.resolves({title: 'some title'});
            getInfoFromContractStub.returns(
                {
                    contracts: [sc],
                    serializers : {},
                    title: 'some title',
                    version: 'some version'
                }
            );
            const originalFS = Generate.__get__('fs');
            Generate.__set__('fs', {writeJSON: writeJSONStub});
            const originalChaincodeFromContract = Generate.__get__('ChaincodeFromContract');
            Generate.__set__('ChaincodeFromContract', MockChaincodeFromContract);

            await Generate.handler(args);

            sinon.assert.calledOnce(writeJSONStub);
            sinon.assert.calledWith(writeJSONStub, args.fileName + '.json', {title: 'some title'});
            sinon.assert.calledOnce(getInfoFromContractStub);
            sinon.assert.calledOnce(getMetadataStub);

            Generate.__set__('ChaincodeFromContract', originalChaincodeFromContract);
            Generate.__set__('fs', originalFS);
        });

        it ('should write the contract metadata to a json file when the .json file extension is specified', async () => {
            args.fileName = path.resolve(process.cwd(), 'file.json');
            getMetadataStub.resolves({title: 'some title'});
            getInfoFromContractStub.returns(
                {
                    contracts: [sc],
                    serializers : {},
                    title: 'some title',
                    version: 'some version'
                }
            );
            const originalFS = Generate.__get__('fs');
            Generate.__set__('fs', {writeJSON: writeJSONStub});
            const originalChaincodeFromContract = Generate.__get__('ChaincodeFromContract');
            Generate.__set__('ChaincodeFromContract', MockChaincodeFromContract);

            await Generate.handler(args);

            sinon.assert.calledOnce(writeJSONStub);
            sinon.assert.calledWith(writeJSONStub, args.fileName, {title: 'some title'});
            sinon.assert.calledOnce(getInfoFromContractStub);
            sinon.assert.calledOnce(getMetadataStub);

            Generate.__set__('ChaincodeFromContract', originalChaincodeFromContract);
            Generate.__set__('fs', originalFS);
        });

        it ('should write the contract metadata to the specified file extension when a non .json extension is specified', async () => {
            args.fileName = path.resolve(process.cwd(), 'file.txt');
            getMetadataStub.resolves({title: 'some title'});
            getInfoFromContractStub.returns(
                {
                    contracts: [sc],
                    serializers : {},
                    title: 'some title',
                    version: 'some version'
                }
            );
            const originalFS = Generate.__get__('fs');
            Generate.__set__('fs', {writeJSON: writeJSONStub});
            const originalChaincodeFromContract = Generate.__get__('ChaincodeFromContract');
            Generate.__set__('ChaincodeFromContract', MockChaincodeFromContract);

            await Generate.handler(args);

            sinon.assert.calledOnce(writeJSONStub);
            sinon.assert.calledWith(writeJSONStub, args.fileName, {title: 'some title'});
            sinon.assert.calledOnce(getInfoFromContractStub);
            sinon.assert.calledOnce(getMetadataStub);

            Generate.__set__('ChaincodeFromContract', originalChaincodeFromContract);
            Generate.__set__('fs', originalFS);
        });

        it ('should log out the contract metadata to when no file-name arg is passed ', async () => {
            args = {'module-path': process.cwd()};
            getMetadataStub.resolves({title: 'some title'});
            getInfoFromContractStub.returns(
                {
                    contracts: [sc],
                    serializers : {},
                    title: 'some title',
                    version: 'some version'
                }
            );
            const originalFS = Generate.__get__('fs');
            Generate.__set__('fs', {writeJSON: writeJSONStub});
            const originalChaincodeFromContract = Generate.__get__('ChaincodeFromContract');
            Generate.__set__('ChaincodeFromContract', MockChaincodeFromContract);

            await Generate.handler(args);

            sinon.assert.notCalled(writeJSONStub);
            sinon.assert.calledOnce(getInfoFromContractStub);
            sinon.assert.calledOnce(getMetadataStub);
            sinon.assert.calledOnce(infoStub);
            infoStub.getCall(0).args.should.deep.equal(['Metadata is : \n', '{ title: \'some title\' }']);

            Generate.__set__('ChaincodeFromContract', originalChaincodeFromContract);
            Generate.__set__('fs', originalFS);
        });

    });


});
