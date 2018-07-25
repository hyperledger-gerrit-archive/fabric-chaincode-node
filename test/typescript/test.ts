/*
* Testing for the typescript declaration file 'index.d.ts' located in 'src/types/index.d.ts/'.
*/
import { 
    Stub, 
    error,
    newLogger,
    start,
    success,
    ClientIdentity,
    HistoryQueryIterator,
    StateQueryIterator
   
} from "fabric-shim";



import * as chai from 'chai';
const should = chai.should();
console.log('#1');
import * as asPromised from 'chai-as-promised';
chai.use(asPromised);
import * as sinon from 'sinon';


describe('Typescript exports for fabric-chaincode-sdk', function() {

    describe('#Stub:', function() {
        // const mockStub = <any> sinon.createStubInstance(Stub);
        // mockStub.getChannelID.returns('dummyChannel');
        const handleGetStateStub = sinon.stub().resolves('dummyClient');
        let mockInstance = new Stub({
            handleGetState: handleGetStateStub
        }, 'dummyChannelID', 'dummyTxid', {
            args: []
        });

        it('Instance of Stub should be created succesfully', function() {

            mockInstance.should.be.an.instanceof(Stub); 

        });

        it('Stub instance should contain a channelID field "dummyChannelID"', function() {

            mockInstance.getChannelID().should.equal('dummyChannelID'); 
            
        });

        it('Checking that all functions are exported', function() {

            mockInstance.createCompositeKey.should.be.ok;
            mockInstance.deleteState.should.be.ok; 
            mockInstance.getArgs.should.be.ok; 
            mockInstance.getBinding.should.be.ok; 
            mockInstance.getChannelID.should.be.ok; 
            mockInstance.getCreator.should.be.ok;
            mockInstance.getFunctionAndParameters.should.be.ok;
            mockInstance.getHistoryForKey.should.be.ok; 
            mockInstance.getQueryResult.should.be.ok; 
            mockInstance.getSignedProposal.should.be.ok; 
            mockInstance.getState.should.be.ok; 
            mockInstance.getPrivateData.should.be.ok; 
            mockInstance.putPrivateData.should.be.ok; 
            mockInstance.deletePrivateData.should.be.ok; 
            mockInstance.getPrivateDataByRange.should.be.ok; 
            mockInstance.getPrivateDataByPartialCompositeKey.should.be.ok; 
            mockInstance.getPrivateDataQueryResult.should.be.ok; 
            mockInstance.getStateByPartialCompositeKey.should.be.ok; 
            mockInstance.getStateByRange.should.be.ok; 
            mockInstance.getStringArgs.should.be.ok; 
            mockInstance.getTransient.should.be.ok; 
            mockInstance.getTxID.should.be.ok; 
            mockInstance.getTxTimestamp.should.be.ok; 
            mockInstance.invokeChaincode.should.be.ok;
            mockInstance.putState.should.be.ok;
            mockInstance.setEvent.should.be.ok;
            mockInstance.splitCompositeKey.should.be.ok;
            
        });

    });
    
    describe('#Shim:', function() {

        it('Exported error function should be called correctly', function() {

            error.should.be.ok;
            newLogger.should.be.ok;
            start.should.be.ok;
            success.should.be.ok;
                
        });

    });

    describe('#ClientIdentity:', function() {
        let SigningId = {};
        SigningId['getMspid'] = sinon.stub();
        SigningId['getIdBytes'] = sinon.stub();
        const toBufferStub = sinon.stub();
        toBufferStub.returns('-----BEGIN CERTIFICATE-----' +
        'MIICEDCCAbagAwIBAgIUXoY6X7jIpHAAgL267xHEpVr6NSgwCgYIKoZIzj0EAwIw' +
        'fzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh' +
        'biBGcmFuY2lzY28xHzAdBgNVBAoTFkludGVybmV0IFdpZGdldHMsIEluYy4xDDAK' +
        'BgNVBAsTA1dXVzEUMBIGA1UEAxMLZXhhbXBsZS5jb20wHhcNMTcwMTAzMDEyNDAw' +
        'WhcNMTgwMTAzMDEyNDAwWjAQMQ4wDAYDVQQDEwVhZG1pbjBZMBMGByqGSM49AgEG' +
        'CCqGSM49AwEHA0IABLoGEWBb+rQ/OuTBPlGVZO3jVWBcuC4+/pAq8axbtKorpORw' +
        'J/GxahKPLr+vVLPNMyeLcnyJBGgneug+ajE8srijfzB9MA4GA1UdDwEB/wQEAwIF' +
        'oDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDAYDVR0TAQH/BAIwADAd' +
        'BgNVHQ4EFgQU9BUt7QfgDXx9g6zpzCyJGxXsNM0wHwYDVR0jBBgwFoAUF2dCPaqe' +
        'gj/ExR2fW8OZ0bWcSBAwCgYIKoZIzj0EAwIDSAAwRQIgcWQbMzluyZsmvQCvGzPg' +
        'f5B7ECxK0kdmXPXIEBiizYACIQD2x39Q4oVwO5uL6m3AVNI98C2LZWa0g2iea8wk' +
        'BAHpeA==' +
        '-----END CERTIFICATE-----');
        let mockBufferStub = <any> {toBuffer: toBufferStub};
        mockBufferStub.toBuffer = toBufferStub;
        SigningId['getIdBytes'].returns(mockBufferStub);
        const getCreatorStub = sinon.stub().returns(SigningId);
        let mockStub = <any> { getCreator: getCreatorStub}
        mockStub.getCreator = getCreatorStub;
        const mockInstance = new ClientIdentity(mockStub);
        

        it('Checking that all functions are exported', function() {
            
            mockInstance.assertAttributeValue.should.be.ok;
            mockInstance.getAttributeValue.should.be.ok;
            mockInstance.getID.should.be.ok;
            mockInstance.getMSPID.should.be.ok;

        });

    });

    describe('#HistoryQueryIterator:', function() {

        const mockInstance = new HistoryQueryIterator(null, null, null, null, null);
        
        it('Instance of HistoryQueryIterator should be created succesfully', function() {

            mockInstance.should.be.an.instanceof(HistoryQueryIterator); 

        });

        it('Checking that all functions are exported', function() {

            mockInstance.next.should.be.ok;
            mockInstance.close.should.be.ok;

        });

    });

    describe('#StateQueryIterator:', function() {
        const mockInstance = new StateQueryIterator(null, null, null, null, null);

        it('Instance of StateQueryIterator should be created succesfully', function() {

            mockInstance.should.be.an.instanceof(StateQueryIterator);

        });

        it('Checking that all functions are exported', function() {

            mockInstance.next.should.be.ok;
            mockInstance.close.should.be.ok;

        });

    });

    

});