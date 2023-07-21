#!/bin/bash

build_backend() {
  # Update submodules
  git submodule update --init --recursive
  # Install apt dependencies
  sudo apt-get install -y libglib2.0-dev
  sudo apt-get install -y libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev
  sudo apt-get install -y libudev-dev
  sudo apt-get install -y libboost-all-dev
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
