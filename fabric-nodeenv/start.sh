#!/bin/sh
set -ex
CHAINCODE_DIR=/usr/local/src
cd ${CHAINCODE_DIR}
npm start -- "$@"