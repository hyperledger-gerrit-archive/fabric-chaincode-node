/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const chai = require('chai');
chai.should();
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
const mockery = require('mockery');
const mlog= require('mocha-logger');

const path = require('path');
// class under test
const pathToRoot = '../../..';
const bootstrap = require(path.join(pathToRoot, 'src/contract-spi/bootstrap'));
const SmartContract = require(path.join(pathToRoot, 'src/contract-api/smartcontract'));
const ChaincodeFromSmartContract = require(path.join(pathToRoot, 'src/contract-spi/chaincodefromsmartcontract'));

const shim = require(path.join(pathToRoot, 'src/shim/chaincode'));

describe('smartcontract.js', () => {

    /**
     * A fake smart contract class; pure loading tests in this file
     */
    class sc extends SmartContract {
        /** */
        constructor() {
            super();
        }
        /**
         * @param {object} api api
         */
        alpha(api) {

        }
    }

    let sandbox;

    beforeEach('Sandbox creation', () => {
        sandbox = sinon.sandbox.create();
        mlog.log('sandbox creation');
    });

    afterEach('Sandbox restoration', () => {
        sandbox.restore();
    });

    describe('#register', () => {

        it('should pass on the registger to the shim', () => {
            sandbox.stub(shim, 'start');
            bootstrap.register([sc]);
            sinon.assert.calledOnce(shim.start);
        });

    });

    describe('#bootstrap', () => {

        beforeEach('enable mockery', () => {
            mockery.enable();
        });

        afterEach('disable mockery', () => {
            mockery.disable();
        });

        it('should use the package.json for the names classes; incorrect spec', () => {
            sandbox.stub(path, 'resolve').withArgs(sinon.match.any,'..','..','..',sinon.match(/package.json/)).returns('jsoncfg');
            mockery.registerMock('jsoncfg', { contracts: 'nonexistant' });
            (() => {
                bootstrap.bootstrap();
            }).should.throw(/not usable/);
        });


        it('should use the package.json for the names classes; incorrect spec', () => {
            sandbox.stub(path, 'resolve').returns('jsoncfg');
            mockery.registerMock('jsoncfg', {
                contracts:  {
                    classes:['nonexistant']
                }
            });

            (() => {
                bootstrap.bootstrap();
            }).should.throw(/is not a constructor/);
        });

        it('should use the package.json for the names classes; valid spec', () => {

            mockery.registerMock('jsoncfg', {
                contracts:  {
                    classes:['sensibleContract']
                }
            });
            sandbox.stub(shim, 'start');
            let resolveStub = sandbox.stub(path, 'resolve');
            resolveStub.withArgs(sinon.match.any,'..','..','..',sinon.match(/package.json/)).returns('jsoncfg');
            resolveStub.withArgs(sinon.match.any,'..','..',sinon.match(/sensibleContract/)).returns('sensibleContract');

            mockery.registerMock('sensibleContract',sc);
            bootstrap.bootstrap();
            sinon.assert.calledOnce(shim.start);
            sinon.assert.calledWith(shim.start,sinon.match.instanceOf(ChaincodeFromSmartContract));
        });

        it('should use the main class defined in the package.json', () => {
            mockery.registerMock('cfgmain.json', {
                main: 'entrypoint'
            });
            mockery.registerMock('entryPoint', sc);
            sandbox.stub(shim, 'start');
            let resolveStub = sandbox.stub(path, 'resolve');
            resolveStub.withArgs(sinon.match.any,'..','..','..',sinon.match(/package.json/)).returns('cfgmain.json');
            resolveStub.withArgs(sinon.match.any,'..','..','..',sinon.match(/entrypoint/)).returns('sensibleContract');

            bootstrap.bootstrap();
            sinon.assert.calledOnce(shim.start);
            sinon.assert.calledWith(shim.start,sinon.match.instanceOf(ChaincodeFromSmartContract));

        });

        it('should throw an error if none of the other methods work', () => {

            mockery.registerMock('another.json', {
                author: 'fred'
            });
            let resolveStub = sandbox.stub(path, 'resolve');
            resolveStub.withArgs(sinon.match.any,'..','..','..',sinon.match(/package.json/)).returns('another.json');
            (()=>{
                bootstrap.bootstrap();
            }).should.throw(/Can not detect any of the indications of how this is a contact instaance/);
        });

    });


});