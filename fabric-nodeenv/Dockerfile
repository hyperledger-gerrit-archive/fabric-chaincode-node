# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
ARG NODE_VER=8
FROM node:${NODE_VER}-alpine AS base
ENV CORE_MODULE_PATH=/usr/local/chaincode
RUN apk add --no-cache \
	make \
	python \
	g++;
RUN mkdir -p /chaincode/input \
	&& mkdir -p /chaincode/output \
	&& mkdir -p /usr/local/src \
	&& mkdir -p /usr/local/chaincode;
COPY ./fabric-shim /usr/local/src/tmp
RUN cd /usr/local/src/tmp &&\
	tar zxvf $(npm pack) &&\
	mv /usr/local/src/tmp/package/* /usr/local/src &&\
	cd /usr/local/src &&\
	rm -rf /usr/local/src/tmp &&\
	npm install;