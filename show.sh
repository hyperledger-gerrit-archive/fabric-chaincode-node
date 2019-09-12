#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

while [ $# -gt 0 ]
do
    case "$1" in
       -o) OUT_LOG=true; shift;; 
       -e) ERR_LOG=true; shift;;
       -c) COVERAGE=true; shift;;
       *) break;;
    esac
done


echo $@