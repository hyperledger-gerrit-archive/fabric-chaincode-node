## Hyperledger Fabric Shim for node.js chaincodes

This is the project to support the writing of Chaincode within the node.js runtime. The following instructions are orientated to a contributor or an early adopter and therefore describes the steps to build and test the library.

As an application developer, to learn about how to implement **"Smart Contracts"** for Hyperledger Fabric using Node.js, please visit the [documentation](https://fabric-shim.github.io/).

This project publishes `fabric-shim` public npm package for developers consumption.


### Test Node.js Chaincode


Then, enter the CLI container using the docker exec command:
```
docker exec -it cli bash
```

You can then issue commands to install and instantiate the chaincode.:
```
peer chaincode install -l node -n mycc -p /opt/gopath/src/github.com/integration -v v0
peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -l node -n mycc -v v0 -c '{"Args":["init"]}' -P 'OR ("Org1MSP.member")'
```

Note that in the above steps, an "install" call was made to upload the chaincode source to the peer, even though the chaincode is running locally already and has registered with the peer. This is a dummy step only to make the peer logic happy when it checks for the file corresponding to the chaincode during instantiate.

Once the chaincode instantiation has completely successfully, you can send transaction proposals to it with the following commands.

```
peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n mycc -c '{"Args":["test1"]}'
```

In the output of the command, you should see the following indicating successful completion of the transaction:
```
2017-08-14 16:24:04.225 EDT [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 00a Chaincode invoke successful. result: status:200
```

#### Writing your own chaincode

To write your own chaincode is very easy. Create a file named `mychaincode.js` anywhere in the file system.
```
cd ~
mkdir mycc
cd mycc
// create a new node project
npm init
// install fabric-shim at master branch
npm install fabric-shim@unstable
// or using the released version
npm install fabric-shim
touch mychaincode.js
```

Put the following minimum implementation to `mychaincode.js`:
```
const shim = require('fabric-shim');
const util = require('util');

var Chaincode = class {
        Init(stub) {
                return stub.putState('dummyKey', Buffer.from('dummyValue'))
                        .then(() => {
                                console.info('Chaincode instantiation is successful');
                                return shim.success();
                        }, () => {
                                return shim.error();
                        });
        }

        Invoke(stub) {
                console.info('Transaction ID: ' + stub.getTxID());
                console.info(util.format('Args: %j', stub.getArgs()));

                let ret = stub.getFunctionAndParameters();
                console.info('Calling function: ' + ret.fcn);

                return stub.getState('dummyKey')
                .then((value) => {
                        if (value.toString() === 'dummyValue') {
                                console.info(util.format('successfully retrieved value "%j" for the key "dummyKey"', value ));
                                return shim.success();
                        } else {
                                console.error('Failed to retrieve dummyKey or the retrieved value is not expected: ' + value);
                                return shim.error();
                        }
                });
        }
};

shim.start(new Chaincode());
```

Finally, update the "start" script in package.json to "node mychaincode.js":
```
{
	"name": "mychaincode",
	"version": "1.0.0",
	"description": "My first exciting chaincode implemented in node.js",
	"engines": {
		"node": ">=8.4.0",
		"npm": ">=5.3.0"
	},
        "scripts": { "start" : "node mychaincode.js" },
	"engine-strict": true,
	"engineStrict": true,
	"license": "Apache-2.0",
	"dependencies": {
		"fabric-shim": "unstable"
	}
}
```

Now you need to restart the peer in "network" mode instead of "dev" mode.

#### Using Docker

If you used 'gulp channel-init', change directory to the fabric-chaincode-node, set an environment variable "DEVMODE=false" and run the command again.
```
cd fabric-chaincode-node
DEVMODE=false gulp channel-init
```

Next, copy a chaincode to the folder mounted on CLI container and enter the CLI container.
```
cp -r ~/mycc /tmp/fabric-shim/chaincode
docker exec -it cli bash
```

Install the chaincode. The peer CLI will package the node.js chaincode source, without the "node_modules" folder, and send to the peer to install.
```
peer chaincode install -l node -n mycc -p /opt/gopath/src/github.com/mycc -v v0
```

Upon successful response, instantiate the chaincode on the "mychannel" channel created above:
```
peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -l node -n mycc -v v0 -c '{"Args":["init"]}' -P 'OR ("Org1MSP.member")'
```

This will take a while to complete as the peer must perform npm install in order to build a custom docker image to launch the chaincode. When successfully completed, you should see in peer's log message confirmation of committing a new block. This new block contains the transaction to instantiate the chaincode "mycc:v0".

To further inspect the result of the chaincode instantiate command, run `docker images` and you will see a new image listed at the top of the list with the name starting with `dev-`. You can inspect the content of this image by running the following command:
```
docker exec -it dev-peer0.org1.example.com-mycc-v0 bash
root@c188ae089ee5:/# ls /usr/local/src
chaincode.js  fabric-shim  node_modules  package.json
root@c188ae089ee5:/#
```

Once the chaincode instantiation has completely successfully, you can send transaction proposals to it with the following commands.
```
peer chaincode invoke -o orderer.example.com:7050 -C mychannel -c '{"Args":["dummy"]}' -n mycc
```

#### Using Command Binaries

If you used binary command `peer`, restart peer and orderer, and initialize the channel.
If you have previously installed and instantiated a chaincode called by the same name and version, please clear peer's ledger before restarting the network by removing the folder /var/hyperledger/production.
```
rm -r /var/hyperledger/production
```

When launching a peer node, eliminate the `--peer-chaincodev` program argument to start the peer process in network mode.
```
FABRIC_CFG_PATH=./sampleconfig CORE_CHAINCODE_LOGGING_LEVEL=debug FABRIC_LOGGING_SPEC=debug CORE_PEER_ADDRESSAUTODETECT=true .build/bin/peer node start
```

Install and instantiate the chaincode with the following commands.
```
FABRIC_CFG_PATH=./sampleconfig FABRIC_LOGGING_SPEC=debug .build/bin/peer chaincode install -l node -n mycc -v v0 -p ~/mycc
FABRIC_CFG_PATH=./sampleconfig FABRIC_LOGGING_SPEC=debug .build/bin/peer chaincode instantiate -o localhost:7050 -C mychannel -l node -n mycc -v v0 -c '{"Args":["init"]}' -P 'OR ("Org1MSP.member")'
```
