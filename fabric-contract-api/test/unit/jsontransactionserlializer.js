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

/* global describe it beforeEach afterEach  */
'use strict';

const chai = require('chai');
chai.should();
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');

const path = require('path');
// class under test
const pathToRoot = '../../..';

const JSONSerializer = require(path.join(pathToRoot, 'fabric-contract-api/lib/jsontransactionserializer.js'));

describe('jsontransactionserializer.js', () => {

    let sandbox;

    beforeEach('Sandbox creation', () => {
        sandbox = sinon.createSandbox();
    });

    afterEach('Sandbox restoration', () => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it ('should create plain object ok', () => {
            const sc0 = new JSONSerializer();
            sc0.should.be.an.instanceOf(JSONSerializer);
        });

    });


    const data = [
        'HelloWorld',
        42,
        {text:'hello', value: {i:'root -1'}},
        Buffer.from('hello')
    ];

    const buffer = [];

    before(() => {
        data.forEach((e) => {
            buffer.push(Buffer.from(JSON.stringify(e)));
        });
    });

    describe('#toBuffer', () => {

        it ('should return undefined if nothing passed in ', () => {
            const sc0 = new JSONSerializer();
            expect(sc0.toBuffer()).to.be.equal(undefined);
        });

        it ('should return stringifed result', () => {

            const sc0 = new JSONSerializer();

            for (let i = 0; i < data.length; i++) {
                expect(sc0.toBuffer(data[i])).to.deep.equal(buffer[i]);
            }
        });
    });

    describe('#fromBuffer', () => {

        it ('should return throw an error if noting given', () => {
            const sc0 = new JSONSerializer();
            (() => {
                sc0.fromBuffer();
            }).should.throw(/Buffer needs to be supplied/);
        });

        it ('should return inflated data from the buffer', () => {
            const sc0 = new JSONSerializer();
            for (let i = 0; i < data.length; i++) {
                expect(sc0.fromBuffer(buffer[i])).to.deep.equal({value: data[i]});
            }
        });

        it ('should handle errors of unkown type', () => {
            const sc0 = new JSONSerializer();
            (() => {
                sc0.fromBuffer(Buffer.from(JSON.stringify({type:'whatever'})));
            }).should.throw(/Type of whatever is not understood, can't recreate data/);
        });
    });

});
