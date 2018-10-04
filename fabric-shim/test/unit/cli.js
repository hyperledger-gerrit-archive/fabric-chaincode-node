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

/*global describe it beforeEach afterEach */

'use strict';

const sinon = require('sinon');

const yargs = require('yargs');
const path = require('path');

describe('fabric-chaincode-node cli', () => {
	let sandbox;

	class fakePromise {
		then(cb) {
			cb();
			return this;
		}

		catch(cb) {
			cb();
			return this;
		}
	}

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		sandbox.stub(yargs, 'commandDir').returns(yargs);
		sandbox.stub(yargs, 'env').returns(yargs);
		sandbox.stub(yargs, 'help').returns(yargs);
		sandbox.stub(yargs, 'example').returns(yargs);
		sandbox.stub(yargs, 'wrap').returns(yargs);
		sandbox.stub(yargs, 'alias').returns(yargs);
		sandbox.stub(yargs, 'version').returns(yargs);

		sandbox.stub(process, 'exit');
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('Main test', () => {
		it('should setup yargs correctly', () => {
			sandbox.stub(yargs, 'describe').returns(yargs);
			require('../../cli.js');
			sinon.assert.calledOnce(yargs.commandDir);
			sinon.assert.calledWith(yargs.commandDir, './lib/cmds');
			sinon.assert.calledOnce(yargs.env);
			sinon.assert.calledWith(yargs.env, 'CORE');
			sinon.assert.calledOnce(yargs.help);
			sinon.assert.calledOnce(yargs.example);
			sinon.assert.calledOnce(yargs.wrap);
			sinon.assert.calledOnce(yargs.alias);
			sinon.assert.calledOnce(yargs.version);
			sinon.assert.calledOnce(yargs.describe);
			sinon.assert.calledWith(process.exit, 0);
		});

		it('Should handle resolved promise', () => {
			sandbox.stub(yargs, 'describe').returns({ argv: {thePromise: new fakePromise()} });
			delete require.cache[path.resolve(__dirname, '../../cli.js')];
			require('../../cli.js');
			sinon.assert.calledWith(process.exit, 0);
		});

		it('Should handle rejected promise', () => {
			sandbox.stub(yargs, 'describe').returns({ argv: {thePromise: new fakePromise()} });
			delete require.cache[path.resolve(__dirname, '../../cli.js')];
			require('../../cli.js');
			sinon.assert.calledWith(process.exit, 1);
		});
	});
});