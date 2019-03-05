#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0
#
ps aux
kill $(ps aux | awk '/--peer.address/ {print $2}')