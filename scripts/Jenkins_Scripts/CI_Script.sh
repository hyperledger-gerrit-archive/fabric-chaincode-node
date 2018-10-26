#!/bin/bash -e
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# exit on first error

export BASE_FOLDER=$WORKSPACE/gopath/src/github.com/hyperledger
# Modify this when change the image tag
export STABLE_TAG=1.3.2-stable
export NEXUS_URL=nexus3.hyperledger.org:10001
export ORG_NAME="hyperledger/fabric"
# Set this in GOPATH
export NODE_VER=8.9.4 # Default nodejs version

export OS_VER=$(dpkg --print-architecture)
echo "-----------> OS_VER" $OS_VER

# Published stable version from nexus
export STABLE_TAG=$OS_VER-$STABLE_TAG
echo "-----------> STABLE_TAG" $STABLE_TAG

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
                      --publish_Api_Docs)
                            publish_Api_Docs
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

# pull fabric images from nexus
pull_Fabric_Images() {
            for IMAGES in peer orderer; do
                 echo "-----------> pull $IMAGES image"
                 echo
                 docker pull $NEXUS_URL/$ORG_NAME-$IMAGES:$STABLE_TAG
                 docker tag $NEXUS_URL/$ORG_NAME-$IMAGES:$STABLE_TAG $ORG_NAME-$IMAGES
                 docker tag $NEXUS_URL/$ORG_NAME-$IMAGES:$STABLE_TAG $ORG_NAME-$IMAGES:$STABLE_TAG
                 docker rmi -f $NEXUS_URL/$ORG_NAME-$IMAGES:$STABLE_TAG
            done
                 echo
                 docker images | grep hyperledger/fabric
}
# pull fabric-ca images from nexus
pull_Fabric_CA_Image() {
        echo
            for IMAGES in ca; do
                 echo "-----------> pull $IMAGES image"
                 echo
                 docker pull $NEXUS_URL/$ORG_NAME-$IMAGES:$STABLE_TAG
                 docker tag $NEXUS_URL/$ORG_NAME-$IMAGES:$STABLE_TAG $ORG_NAME-$IMAGES
	         docker tag $NEXUS_URL/$ORG_NAME-$IMAGES:$STABLE_TAG $ORG_NAME-$IMAGES:$STABLE_TAG
                 docker rmi -f $NEXUS_URL/$ORG_NAME-$IMAGES:$STABLE_TAG
            done
                 echo
                 docker images | grep hyperledger/fabric-ca
}
# run sdk e2e tests
sdk_E2e_Tests() {
        echo
       
        cd $BASE_FOLDER
        git clone --single-branch -b $GERRIT_BRANCH git://cloud.hyperledger.org/mirror/fabric-samples
        cd fabric-chaincode-node

        # Install nvm to install multi node versions
        wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
        # shellcheck source=/dev/null
        export NVM_DIR="$HOME/.nvm"
        # shellcheck source=/dev/null
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
        echo "------> Install NodeJS"
        # This also depends on the fabric-baseimage. Make sure you modify there as well.
        echo "------> Use $NODE_VER for >=release-1.1 branches"
        nvm install $NODE_VER || true
        # use nodejs 8.9.4 version
        nvm use --delete-prefix v$NODE_VER --silent

        echo "npm version ------> $(npm -v)"
        echo "node version ------> $(node -v)"
        echo "npm install ------> starting"

        npm install || err_Check "ERROR!!! npm install failed"
        npm config set prefix ~/npm && npm install -g gulp

        echo "###################"
        echo "------> Run Headless Tests"
        echo "###################"

        gulp test-headless
        DEVMODE=false gulp channel-init

        echo "#######################"
        echo "------> Run Integration and Scenario Tests"
        echo "#######################"

        gulp test-e2e
        if [ $? != 0 ]; then
           # Copy Debug log to $WORKSPACE
           cp /tmp/fabric-shim/logs/*.log $WORKSPACE
           exit 1
        else
           # Copy Debug log to $WORKSPACE
           cp /tmp/fabric-shim/logs/*.log $WORKSPACE
        fi

        echo "#######################" 
        echo "------> Tests Complete"
        echo "#######################" 
}
# Publish unstable npm modules after successful merge on amd64
publish_Unstable() {
        echo
        echo "-----------> Publish unstable npm modules from amd64"
        ./Publish_NPM_Modules.sh
}

# Publish NODE_SDK API docs after successful merge on amd64
publish_Api_Docs() {
        echo
        echo "-----------> Publish NODE_SDK API docs after successful merge on amd64"
        ./Publish_API_Docs.sh
}
Parse_Arguments $@
