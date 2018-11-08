#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

export BASE_FOLDER=$WORKSPACE/gopath/src/github.com/hyperledger
export NEXUS_URL=nexus3.hyperledger.org:10001
export ORG_NAME="hyperledger/fabric"

# error check
err_Check() {
echo "ERROR !!!! --------> $1 <---------"
exit 1
}

Parse_Arguments() {
      while [ $# -gt 0 ]; do
              case $1 in
                      --env_Info)
                            env_Info
                            ;;
                      --pull_Fabric_Images)
                            pull_Fabric_Images
                            ;;
                      --pull_Fabric_CA_Image)
                            pull_Fabric_CA_Image
                            ;;
                      --clean_Environment)
                            clean_Environment
                            ;;
                      --sdk_E2e_Tests)
                            sdk_E2e_Tests
                            ;;
                      --publish_Unstable)
                            publish_Unstable
                            ;;
                      --publish_ApiDocs)
                            publish_ApiDocs
                            ;;
              esac
              shift
      done
}

clean_Environment() {

echo "-----------> Clean Docker Containers & Images, unused/lefover build artifacts"
function clearContainers () {
        CONTAINER_IDS=$(docker ps -aq)
        if [ -z "$CONTAINER_IDS" ] || [ "$CONTAINER_IDS" = " " ]; then
                echo "---- No containers available for deletion ----"
        else
                docker rm -f $CONTAINER_IDS || true
                docker ps -a
        fi
}

function removeUnwantedImages() {
        DOCKER_IMAGES_SNAPSHOTS=$(docker images | grep snapshot | grep -v grep | awk '{print $1":" $2}')

        if [ -z "$DOCKER_IMAGES_SNAPSHOTS" ] || [ "$DOCKER_IMAGES_SNAPSHOTS" = " " ]; then
                echo "---- No snapshot images available for deletion ----"
        else
                docker rmi -f $DOCKER_IMAGES_SNAPSHOTS || true
        fi
        DOCKER_IMAGE_IDS=$(docker images | grep -v 'base*\|couchdb\|kafka\|zookeeper\|cello' | awk '{print $3}')

        if [ -z "$DOCKER_IMAGE_IDS" ] || [ "$DOCKER_IMAGE_IDS" = " " ]; then
                echo "---- No images available for deletion ----"
        else
                docker rmi -f $DOCKER_IMAGE_IDS || true
                docker images
        fi
}

# Delete nvm prefix & then delete nvm
rm -rf $HOME/.nvm/ $HOME/.node-gyp/ $HOME/.npm/ $HOME/.npmrc  || true

mkdir $HOME/.nvm || true

# remove tmp/hfc and hfc-key-store data
rm -rf /home/jenkins/.nvm /home/jenkins/npm /tmp/fabric-shim /tmp/hfc* /tmp/npm* /home/jenkins/kvsTemp /home/jenkins/.hfc-key-store || true

rm -rf /var/hyperledger/*

rm -rf gopath/src/github.com/hyperledger/fabric-ca/vendor/github.com/cloudflare/cfssl/vendor/github.com/cloudflare/cfssl_trust/ca-bundle || true
# yamllint disable-line rule:line-length
rm -rf gopath/src/github.com/hyperledger/fabric-ca/vendor/github.com/cloudflare/cfssl/vendor/github.com/cloudflare/cfssl_trust/intermediate_ca || true

clearContainers
removeUnwantedImages
}

env_Info() {
        # This function prints system info

        #### Build Env INFO
        echo "-----------> Build Env INFO"
        # Output all information about the Jenkins environment
        uname -a
        cat /etc/*-release
        env
        gcc --version
        docker version
        docker info
        docker-compose version
        pgrep -a docker
        docker images
        docker ps -a
}

# pull fabric, ca images from nexus
pull_Docker_Images() {
            for IMAGES in peer orderer tools ca; do
                 docker pull $NEXUS_URL/$ORG_NAME-$IMAGES:${IMAGE_TAG} > /dev/null 2>&1
                          if [ $? -ne 0 ]; then
                                echo -e "\033[31m FAILED to pull docker images" "\033[0m"
                                exit 1
                          fi
                 echo "\033[32m ----------> pull $IMAGES image" "\033[0m"
                 echo
                 docker tag $NEXUS_URL/$ORG_NAME-$IMAGES:${IMAGE_TAG} $ORG_NAME-$IMAGES
                 docker tag $NEXUS_URL/$ORG_NAME-$IMAGES:${IMAGE_TAG} $ORG_NAME-$IMAGES:${ARCH}-${VERSION}
                 docker rmi -f $NEXUS_URL/$ORG_NAME-$IMAGES:${IMAGE_TAG}
            done
                 echo
                 docker images | grep hyperledger/fabric
}
# run sdk e2e tests
sdk_E2e_Tests() {
        echo
       
        echo -e "\033[32m Execute NODE SDK Integration Tests" "\033[0m"
        cd ${WORKSPACE}/gopath/src/github.com/hyperledger/fabric-chaincode-node

        wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
        # shellcheck source=/dev/null
        export NVM_DIR="$HOME/.nvm"
        # shellcheck source=/dev/null
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
        echo "------> Install NodeJS"
        # This also depends on the fabric-baseimage. Make sure you modify there as well.
        echo "------> Use $NODE_VER"
        nvm install $NODE_VER || true
        nvm use --delete-prefix v$NODE_VER --silent

       echo -e "\033[32m npm version ------> $(npm -v)" "\033[0m"
       echo -e "\033[32m node version ------> $(node -v)" "\033[0m"

        npm install || err_Check "ERROR!!! npm install failed"
        npm config set prefix ~/npm && npm install -g gulp

        echo "#################################################"
        echo -e "\033[32m ------> Run Headless Tests" "\033[0m"
        echo "#################################################"

        gulp test-headless
        DEVMODE=false gulp channel-init

        echo "#################################################################"
        echo -e "\033[32m ------> Run Integration and Scenario Tests" "\033[0m"
        echo "#################################################################"

        gulp test-e2e

        if [ $? != 0 ]; then
           # Copy Debug log to $WORKSPACE
           cp /tmp/fabric-shim/logs/*.log $WORKSPACE
           exit 1
        else
           # Copy Debug log to $WORKSPACE
           cp /tmp/fabric-shim/logs/*.log $WORKSPACE
        fi

        DEVMODE=true gulp channel-init
        gulp test-devmode-cli

        if [ $? != 0 ]; then
           # Copy Debug log to $WORKSPACE
           cp /tmp/fabric-shim/logs/*.log $WORKSPACE
           exit 1
        else
           # Copy Debug log to $WORKSPACE
           cp /tmp/fabric-shim/logs/*.log $WORKSPACE
        fi

        echo "#############################################"
        echo -e "\033[32m ------> Tests Complete" "\033[0m"
        echo "#############################################" 
}
# Publish npm modules after successful merge on amd64
publish_NpmModules() {
        echo
        echo -e "\033[32m -----------> Publish npm modules from amd64" "\033[0m"
        ./Publish_NPM_Modules.sh
}

# Publish NODE_SDK API docs after successful merge on amd64
publish_ApiDocs() {
        echo
        echo -e "\033[32m -----------> Publish NODE_SDK API docs after successful merge on amd64" "\033[0m"
        ./Publish_API_Docs.sh
}
Parse_Arguments $@
