#!/bin/bash

VERSION=v0.0.6-alpha
INSTALL_DIR=/opt/DWE_OS_2

echo "Installing ${VERSION} of DWE_OS_2 (https://github.com/DeepwaterExploration/DWE_OS_2/releases/download/$VERSION/release.tar.gz)"

wget https://github.com/DeepwaterExploration/DWE_OS_2/releases/download/$VERSION/release.tar.gz

tar -xvzf release.tar.gz

mkdir -p ${INSTALL_DIR}

cp -r release/* ${INSTALL_DIR}

cd ${INSTALL_DIR}

sh install_requirements.sh

sh create_venv.sh

echo "Successfully installed DWE_OS_2 ${VERSION}"
