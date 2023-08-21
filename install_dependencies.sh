#!/bin/bash
# must be run with sudo

install_dependencies_frontend() {
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  nvm install node # "node" is an alias for the latest version
  exec $SHELL
}

install_dependencies_backend() {
  apt-get install -y cmake bash
  apt-get install -y libglib2.0-dev
  apt-get install -y libglib2.0-dev
  apt-get install -y libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev
  apt-get install -y libudev-dev
  apt-get install -y libboost-all-dev
}


install_dependencies() {
  apt-get update && apt-get upgrade -y;
  install_dependencies_frontend;
  install_dependencies_backend;
}

install_dependencies
