'use strict';

const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const fs = require('fs');
const path = require('path');
const getTLSArgs = require('../../build/test/utils').getTLSArgs;

function getPackageVersion() {
    const packageJsonPath = path.join(__dirname, './../../package.json');
    const packageJson = fs.readFileSync(packageJsonPath);
    const version = JSON.parse(packageJson.toString()).version;
    return version;
}

async function packPackage(packageName, ccName) {
    const version = getPackageVersion();
    const p = path.join(__dirname, `../../${packageName}`);
    const packCmd = `cd ${p} && npm pack && mv ./${packageName}-${version}.tgz ../test/fv/${ccName}/`;
    await exec(packCmd);
}

async function packPackages(ccName) {
    await packPackage('fabric-contract-api', ccName);
    await packPackage('fabric-shim', ccName);
    await packPackage('fabric-shim-crypto', ccName);
}

async function deletePackage(packageName, ccName) {
    const version = getPackageVersion();
    const cmd = `rm ${__dirname}/${ccName}/${packageName}-${version}.tgz`;
    await exec(cmd);
}

async function deletePackages(ccName) {
    await deletePackage('fabric-contract-api', ccName);
    await deletePackage('fabric-shim', ccName);
    await deletePackage('fabric-shim-crypto', ccName);
}

async function install(ccName) {
    // const folderName = '/opt/gopath/src/github.com/fv/' + ccName;
    const folderName = '/opt/gopath/src/github.com/chaincode/fv/' + ccName;
    const cmd = `docker exec %s peer chaincode install -l node -n ${ccName} -v v0 -p ${folderName}`;
    await exec(util.format(cmd, 'org1_cli'));
    await exec(util.format(cmd, 'org2_cli'));
}

async function instantiate(ccName, func, args) {
    const cmd = `docker exec org1_cli peer chaincode instantiate ${getTLSArgs()} -o orderer.example.com:7050 -l node -C mychannel -n ${ccName} -v v0 -c '${printArgs(func, args)}' -P 'OR ("Org1MSP.member")'`;
    const res = await exec(cmd);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return res;
}

function printArgs(func, args) {
    if (!Array.isArray(args) && func) {
        args = [func];
    } else if (func) {
        args = [func, ...args];
    } else {
        args = [];
    }

    for (const key in args) {
        args[key] = `${args[key]}`;
    }
    return JSON.stringify({Args: args});
}

async function invoke(ccName, func, args) {
    const cmd = `docker exec org1_cli peer chaincode invoke ${getTLSArgs()} -o orderer.example.com:7050 -C mychannel -n ${ccName} -c '${printArgs(func, args)}' --waitForEvent 2>&1`;

    const {stderr} = await exec(cmd);
    if (stderr) {
        throw new Error(stderr);
    }
}

async function query(ccName, func, args) {
    const cmd = `docker exec org2_cli peer chaincode query ${getTLSArgs()} -C mychannel -n ${ccName} -c '${printArgs(func, args)}'`;

    const {stdout, stderr} = await exec(cmd);
    if (stderr) {
        throw new Error(stderr);
    }

    return stdout.trim().replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"'); // remove surrounding quotes and unescape
}

async function installAndInstantiate(ccName, instantiateFunc, instantiateArgs) {
    await install(ccName);
    return instantiate(ccName, instantiateFunc, instantiateArgs);
}

const TIMEOUTS = {
    LONG_STEP : 240 * 1000,
    MED_STEP : 120 * 1000,
    SHORT_STEP: 60 * 1000,
    LONG_INC : 30 * 1000,
    MED_INC : 10 * 1000,
    SHORT_INC: 5 * 1000
};

module.exports = {installAndInstantiate, invoke, query, packPackages, deletePackages, TIMEOUTS};
