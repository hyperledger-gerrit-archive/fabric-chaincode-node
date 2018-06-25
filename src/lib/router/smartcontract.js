const shim = require('../chaincode');
const ChaincodeFromSmartContract = require('./chaincodefromsmartcontract');
class SmartContract {

    constructor(namespace){
        this.namespace = namespace;
    }

    sc_getNamespace(){
        return this.namespace;
    }

    static register(contracts){
        shim.start(new ChaincodeFromSmartContract(contracts));
    }

};

module.exports = SmartContract;