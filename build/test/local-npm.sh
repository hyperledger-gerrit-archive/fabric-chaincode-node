#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SRC_ROOT="/tmp/fabric-shim/basic-network/scenario/src"

export GATEWAY="$(docker inspect basicnetwork_basic | grep Gateway | cut -d \" -f4)"
touch /tmp/.npmrc && echo "registry=http://${GATEWAY}:4873/" > /tmp/.npmrc

export NPM_MODULES="fabric-shim fabric-shim-crypto fabric-contract-api"
   
for j in ${NPM_MODULES}; do
    # check the next in the list
    npm publish --userconfig "${DIR}/publish.npmrc" "${SRC_ROOT}/${j}"
done 


