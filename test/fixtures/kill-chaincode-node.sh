#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0
#
ps aux
echo "###########################"
echo $(ps aux | awk '/--peer.address/ {print $2}')
echo "###########################"
kill $(ps aux | awk '/--peer.address/ {print $2}')
ps aux