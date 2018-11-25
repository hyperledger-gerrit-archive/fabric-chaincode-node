# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
ARG NODE_VER=8.14.0
FROM node:${NODE_VER}-jessie
ENV npm_config_prefix=/home/node/.npm-global
RUN mkdir -p /chaincode/input \
	&& mkdir -p /chaincode/output \
	&& mkdir -p /usr/local/src \
	&& chown -R node:node /usr/local/src \
	&& chown -R node:node /chaincode;
USER node