#!/bin/bash

mkdir build -p
cc -fPIC -shared -o ${PWD}/build/camera_helper.so ${PWD}/camera_helper.c
