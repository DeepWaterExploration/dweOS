#!/bin/bash

install_dependencies_frontend() {
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  nvm install node # "node" is an alias for the latest version
  exec $SHELL
}

install_dependencies_backend() {
  sudo apt install cmake bash
  sudo apt-get install libglib2.0-dev
}


install_dependencies() {
  sudo apt update && sudo apt upgrade;
  install_dependencies_frontend;
  install_dependencies_backend;
}

install_dependencies
