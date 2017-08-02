const shim = require('fabric-shim');

var chaincode = {};
chaincode.Init = function() {
	return shim.success();
};

chaincode.Invoke = function() {
	return shim.success();
};

shim.start(chaincode);