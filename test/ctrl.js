/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const util = require('util');

const tls = process.env.TLS ? process.env.TLS : 'false';
const delay = require('delay');
const chai = require('chai');
chai.should();
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
chai.use(require('chai-match'));
const ChaincodeProxy = require('./chaincode');

/**
 * Helper function should tls tests be required
 * @return {String} tls configuration
*/
function getTLSArgs() {
    let args = '';
    if (tls === 'true') {
        args = util.format('--tls %s --cafile %s', tls,
            '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem');
    }
    return args;
}
// because the peer CLI for the instantiate call returns
// before the transaction gets committed to the ledger, we
// introduce a wait for 3 sec before running the invoke
// or it seems any invoke call as well

describe('Check invocation of actually deployed chaincode',()=>{


    describe('validating deployed Smart Contract', ()=>{
        let ccProxy;

        beforeEach('',()=>{
            ccProxy = new ChaincodeProxy();
            ccProxy.channelName = 'mychannel';
            ccProxy.ccName = 'mysmartcontract';
            ccProxy.tlsArgs = getTLSArgs();
        });

        it('should set and get a value correctly',async ()=>{

            let testValue='beta';
            let result;
            result = await ccProxy.invoke(`{"Args":["org.mynamespace.updates_setNewAssetValue","${testValue}"]}`);
            expect(result.stdout).to.match(/Chaincode invoke successful\. result: status:200/);
            await delay(3000);

            result = await ccProxy.invoke('{"Args":["org.mynamespace.removes_getAssetValue"]}');
            expect(result.stdout).to.match(/Chaincode invoke successful\. result: status:200 payload:"(.+)"/).and.capture(0).equals(testValue);
        });

        it('should return the correct error if the request fn does not exist',async ()=>{
            return ccProxy.invoke('{"Args":["org.mynamespace.updates_wibble"]}')
                .then((a)=>{
                    expect.fail();
                })
                .catch((e)=>{
                    expect(e.stdout).to.match(/endorsement failure during invoke/);
                });
        });

        it('should return the correct error if the namespace is missing',async ()=>{
            return ccProxy.invoke('{"Args":["org.mynamespace.wibble"]}')
                .then((a)=>{
                    expect.fail();
                })
                .catch((e)=>{
                    expect(e.stdout).to.match(/endorsement failure during invoke/);
                });
        });


    });



});


