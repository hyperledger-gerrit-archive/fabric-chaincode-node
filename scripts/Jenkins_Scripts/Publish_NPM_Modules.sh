#!/bin/bash -e
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

#################################################
#Publish npm module as unstable after merge commit
#npm publish --tag $CURRENT_TAG
#Run this "npm dist-tags ls $pkgs then look for
#unstable versions
#################################################

npmPublish() {
  if [ $RELEASE = "snapshot" ]; then
    echo
    UNSTABLE_VER=$(npm dist-tags ls "$1" | awk "/$CURRENT_TAG"":"/'{
    ver=$NF
    sub(/.*\./,"",rel)
    sub(/\.[[:digit:]]+$/,"",ver)
    print ver}')

    echo "===> UNSTABLE VERSION --> $UNSTABLE_VER"

    UNSTABLE_INCREMENT=$(npm dist-tags ls "$1" | awk "/$CURRENT_TAG"":"/'{
    ver=$NF
    rel=$NF
    sub(/.*\./,"",rel)
    sub(/\.[[:digit:]]+$/,"",ver)
    print ver"."rel+1}')

    echo "===> Incremented UNSTABLE VERSION --> $UNSTABLE_INCREMENT"

  else
      # Publish node modules on latest tag
      echo -e "\033[32m ========> PUBLISH --> $RELEASE_VERSION" "\033[0m"
      npm publish --tag $CURRENT_TAG

fi
}
versions() {

  CURRENT_RELEASE=$(cat package.json | grep version | awk -F\" '{ print $4 }')
  echo -e "\033[32m ========> PUBLISH --> $RELEASE_VERSION" "\033[0m"

  RELEASE=$(cat package.json | grep version | awk -F\" '{ print $4 }' | cut -d "-" -f 2)
  echo -e "\033[32m ===> Current Version --> $RELEASE_VERSION" "\033[0m"

}

cd $WORKSPACE/gopath/src/github.com/hyperledger/fabric-chaincode-node
npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN

cd fabric-shim
versions
# Publish fabric-shim npm module
npmPublish fabric-shim

cd ../fabric-shim-crypto
versions
# Publish fabric-shim-crypto npm module
npmPublish fabric-shim-crypto

cd ../fabric-contract-api
versions
# Publish fabric-contract-api npm module
npmPublish fabric-contract-api
