'use strict';

const _ = require('lodash');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const chalk = require('chalk');

/**
 *
 */
class Chaincode /*extends Exec */ {

    /**
     *
     */
    constructor(){

    }
    //docker exec cli peer chaincode invoke <%= options.tlsArgs %> -C <%= options.channelName %> -n <%= options.ccName %> -c \'{"Args":["org.mynamespace.removes_getAssetValue"]}\' 2>&1
    /**
     * @param {String} args options to pass to invoke
     */
    invoke(args) {
        let options= {
            tlsArgs:this.tlsArgs,
            channelName:this.channelName,
            ccName:this.ccName,
            args
        };
        let cmdTemplate = _.template('docker exec cli peer chaincode invoke <%= tlsArgs %> -C <%= channelName %> -n <%= ccName %> -c \'<%= args %>\' 2>&1');
        let cmdStr = cmdTemplate(options);
        console.log(chalk`{grey Command to execute is {bold ${cmdStr} }}`);
        let result = this._exec(cmdStr);
        return result;
    }

    /**
     * place to add on extra ctrl bits to the exec cmd
     * @param {String} cmdStr command string to pass to the shell
     */
    _exec(cmdStr){
        return exec(cmdStr);
    }



}

module.exports = Chaincode;