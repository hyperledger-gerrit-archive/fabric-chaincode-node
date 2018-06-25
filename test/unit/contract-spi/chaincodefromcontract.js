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

// test specific libraries
const chai = require('chai');
chai.should();
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
const mockery = require('mockery');
const mlog= require('mocha-logger');

// standard utility fns
const path = require('path');

// class under test
const pathToRoot = '../../..';
const bootstrap = require(path.join(pathToRoot, 'src/contract-spi/bootstrap'));
const Contract = require(path.join(pathToRoot, 'src/contract-api/contract'));
const ChaincodeFromContract = require(path.join(pathToRoot, 'src/contract-spi/chaincodefromcontract'));
const shim = require(path.join(pathToRoot, 'src/shim/chaincode'));
const FarbicStubInterface = require(path.join(pathToRoot,'src/shim/stub'));
const alphaStub = sinon.stub();
describe('',()=>{



    /**
     * A fake  contract class;
     */
    class SCAlpha extends Contract {
        /** */
        constructor() {
            super('alpha');
        }
        /**
         * @param {object} api api
         * @param {String} arg1 arg1
         * @param {String} arg2 arg2
         */
        alpha(api,arg1,arg2) {
            alphaStub(api,arg1,arg2);
        }
    }

    /**
     * A fake  contract class;
     */
    class SCBeta extends Contract {
        /** */
        constructor() {
            super('beta');
            this.property='value';
        }
        /**
         * @param {object} api api
         */
        beta(api) {

        }
    }

    let sandbox;

    beforeEach('Sandbox creation', () => {
        sandbox = sinon.createSandbox();
        mlog.log('sandbox creation');
    });

    afterEach('Sandbox restoration', () => {
        sandbox.restore();
    });

    describe('#constructor',()=>{

        it('should handle no classes being past in',()=>{
            (()=>{
                new ChaincodeFromContract();
            }).should.throw(/Missing argument/);
        });

        it('should handle classes that are not of the correc type',()=>{
            let tempClass =   class{
                /**  */
                constructor(){}
            };

            (()=>{
                new ChaincodeFromContract([
                    tempClass
                ]);
            }).should.throw(/invalid contract/);
        });

        it('should correctly create valid chaincode instance',()=>{
            SCBeta.prototype.fred='fred';
            let cc = new ChaincodeFromContract([SCAlpha,SCBeta]);

            // get the contracts that have been defined
            expect(cc.contracts).to.have.keys('alpha','beta');
            expect(cc.contracts.alpha).to.include.keys('functionNames');
            expect(cc.contracts.beta).to.include.keys('functionNames');
            expect(cc.contracts.beta.functionNames).to.include('beta');
            expect(cc.contracts.alpha.functionNames).to.include('alpha');
        });

    });

    describe('#init',()=>{

        it('should call the Invoke method',async ()=>{
            let stubFake = {};

            let cc = new ChaincodeFromContract([SCAlpha,SCBeta]);
            sandbox.stub(cc,'Invoke');
            await cc.Init(stubFake);

            sinon.assert.calledOnce(cc.Invoke);
            sinon.assert.calledWith(cc.Invoke,stubFake);

        });

    });

    describe('#invoke',()=>{
        it('should invoke the alpha function',async ()=>{
            let fakeerror = sinon.fake((e)=>{
                sinon.assert.fail(e);
                mlog.log(e);
            });
            sandbox.replace(shim,'error',fakeerror);
            let fakesuccess = sinon.fake((e)=>{
                mlog.log(e);
            });
            sandbox.replace(shim,'success',fakesuccess);

            let cc = new ChaincodeFromContract([SCAlpha,SCBeta]);
            let stubInterface = sinon.createStubInstance(FarbicStubInterface);
            stubInterface.getFunctionAndParameters.returns({
                fcn:'alpha_alpha',
                params: [   'arg1','arg2'   ]
            }  );

            await cc.Invoke(stubInterface);
            sinon.assert.calledOnce(alphaStub);
            sinon.assert.calledWith(alphaStub,'arg1','arg2');
        });

        it('should throw correct error with missing namespace',async ()=>{
            let fakeerror = sinon.fake((e)=>{
                mlog.log(e);
            });
            sandbox.replace(shim,'error',fakeerror);
            let fakesuccess = sinon.fake((e)=>{
                mlog.log(e);
            });
            sandbox.replace(shim,'success',fakesuccess);

            let cc = new ChaincodeFromContract([SCAlpha,SCBeta]);
            let stubInterface = sinon.createStubInstance(FarbicStubInterface);
            stubInterface.getFunctionAndParameters.returns({
                fcn:'wibble_alpha',
                params: [   'arg1','arg2'   ]
            }  );

            await cc.Invoke(stubInterface);
            sinon.assert.calledOnce(shim.error);
            expect(fakeerror.args[0][0]).to.be.instanceOf(Error);
            expect(fakeerror.args[0][0].toString()).to.match(/Error: Namespace is sadly not known :wibble:/);
        });


        it('should throw correct error with wrong function name',async ()=>{
            let fakeerror = sinon.fake((e)=>{
                mlog.log(e);
            });
            sandbox.replace(shim,'error',fakeerror);
            let fakesuccess = sinon.fake((e)=>{
                mlog.log(e);
            });
            sandbox.replace(shim,'success',fakesuccess);

            let cc = new ChaincodeFromContract([SCAlpha,SCBeta]);
            let stubInterface = sinon.createStubInstance(FarbicStubInterface);
            stubInterface.getFunctionAndParameters.returns({
                fcn:'alpha_wibble',
                params: [   'arg1','arg2'   ]
            }  );

            await cc.Invoke(stubInterface);
            sinon.assert.calledOnce(shim.error);
            expect(fakeerror.args[0][0]).to.be.instanceOf(Error);
            expect(fakeerror.args[0][0].toString()).to.match(/Error: No contract function wibble/);
        });

    });

    describe('#getFunctions',()=>{
        it('should respond with the correct set of functions',async ()=>{
            let fakeerror = sinon.fake((e)=>{
                sinon.assert.fail(e);
                mlog.log(e);
            });
            sandbox.replace(shim,'error',fakeerror);
            let fakesuccess = sinon.fake((e)=>{
                mlog.log(e);
            });
            let cc = new ChaincodeFromContract([SCAlpha,SCBeta]);
            let stubInterface = sinon.createStubInstance(FarbicStubInterface);
            stubInterface.getFunctionAndParameters.returns({
                fcn:'$getFunctions',
                params: [   'arg1','arg2'   ]
            }  );

            let data = await cc.Invoke(stubInterface);
            console.log(data.toString('utf8'));
        });
    });


});