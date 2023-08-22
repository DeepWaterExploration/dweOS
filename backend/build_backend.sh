#!/bin/bash

build_backend() {
  # Remove build folder if exists
  rm -rf build
  # Create build folder
  mkdir build
  # Go to build folder
  cd build
  # Build for target
  cmake ..
  make
}

build_backend
