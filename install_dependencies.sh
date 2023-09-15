#!/bin/bash
# must be run with sudo

GO_VERSION=1.21.0

install_dependencies_frontend() {
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  nvm install node # "node" is an alias for the latest version
}

install_dependencies_backend() {
  apt-get install -y cmake bash libglib2.0-dev libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev libudev-dev libboost-all-dev gstreamer1.0-tools gstreamer1.0-x gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-libav
}

install_dependencies_system_api() {
  # Download the latest version of Golang
  wget https://go.dev/dl/go$GO_VERSION.linux-armv6l.tar.gz
  
  # Extract the archive into the proper directory
  tar -C /usr/local -xzf go$GO_VERSION.linux-armv6l.tar.gz

  # Remove the downloaded archive
  rm go$GO_VERSION.linux-armv6l.tar.gz

  # Add the go binary to the PATH environment variable
  echo 'export GOROOT=/usr/local/go' >> ~/.bashrc
  echo 'export GOPATH=$HOME/go' >> ~/.bashrc
  echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
  source ~/.bashrc

}


install_dependencies() {
  # apt-get update && apt-get upgrade -y;
  # install_dependencies_frontend;
  # install_dependencies_backend;
  install_dependencies_system_api;
}

install_dependencies
