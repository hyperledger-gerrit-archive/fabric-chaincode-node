#!/bin/bash -e

# Publish nodeenv docker image after successful merge
publish_Nodeenv_Image() {
  echo
  echo -e "\033[32m -----------> Publish nodeenv docker image" "\033[0m"
  ver=$(cat package.json | grep version | awk -F\" '{ print $4 }')
  echo $ver | grep -q snapshot
  res=$?
  if [ $res -eq 0 ]; then
    echo "PUBLISH NODEENV SNAPSHOT IMAGES TO NEXUS3"
    # 10003 points to docker.snapshot
    DOCKER_REPOSITORY=nexus3.hyperledger.org:10003/hyperledger
    # SETTINGS_FILE stores the nexus credentials 
    USER=$(xpath -e "//servers/server[id='$DOCKER_REPOSITORY']/username/text()" "$SETTINGS_FILE")
    PASS=$(xpath -e "//servers/server[id='$DOCKER_REPOSITORY']/password/text()" "$SETTINGS_FILE")
    docker login $DOCKER_REPOSITORY -u "$USER" -p "$PASS"
    # tag nodeenv latest tag to nexus3 repo
    docker tag hyperledger/fabric-nodeenv $DOCKER_REPOSITORY/fabric-nodeenv:$ARCH-latest
    docker tag hyperledger/fabric-nodeenv $DOCKER_REPOSITORY/fabric-nodeenv:$ARCH-$VERSION-stable 
    # Push nodeenv image to nexus3 docker.snapshot
    docker push $DOCKER_REPOSITORY/hyperledger/fabric-nodeenv:$ARCH-latest
    docker push $DOCKER_REPOSITORY/hyperledger/fabric-nodeenv:$ARCH-$VERSION-stable
  else
    if [ $GERRIT_BRANCH == "master" ]; then
      DOCKER_REPOSITORY=hyperledger
      # tag nodeenv latest tag to nexus3 repo
      docker tag hyperledger/fabric-nodeenv $DOCKER_REPOSITORY/fabric-nodeenv:$ARCH-$ver
      # Push nodeenv image to nexus3 docker.snapshot
      docker push $DOCKER_REPOSITORY/hyperledger/fabric-nodeenv:$ARCH-$ver
    else
      echo "Nodeenv Docker Image available only on master branch"
  fi
    docker images
}
