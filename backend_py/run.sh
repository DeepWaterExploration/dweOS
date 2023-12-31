#!/bin/bash

if ! test -f ${PWD}/build/camera_helper.so; then
    ./build.sh
fi
python3 src
