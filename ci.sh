#!/bin/bash

set -ev

# clone the repo
# ./CI_Script.sh --clean_Environment --env_Info
# ./CI_Script.sh --pull_Docker_Images


# ./CI_Script.sh --e2e_Tests
# equivalent to the 'gulp test-headless'
# Build will do the unit test and the coverage
node common/scripts/install-run-rush.js install
node common/scripts/install-run-rush.js rebuild

# equivalent to the test-e2e
node common/scripts/install-run-rush.js start-fabric
node common/scripts/install-run-rush.js start-verdaccio
node common/scripts/install-run-rush.js test:fv

# dev mode tests
node common/scripts/install-run-rush.js start-fabric --devmode
node common/scripts/install-run-rush.js test:devmode
node common/scripts/install-run-rush.js test:invctrl

# node common/scripts/install-run-rush.js update-protos

# To check
# Typescript types validation
# coverage is correct
