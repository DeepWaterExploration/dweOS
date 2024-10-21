#!/bin/bash

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root"
  exit 1
fi

INSTALL_DIR=/opt/DWE_OS_2
SCRIPT_RUN_DIR=$PWD

# Check if a tag name was provided as an argument
if [ -z "$1" ]; then
    VERSION="latest"
else
    VERSION=$1
fi

if [ "$VERSION" == "latest" ]; then
    echo "Installing DWE_OS 2 (latest release)"
    DOWNLOAD_URL="https://github.com/DeepwaterExploration/DWE_OS_2/releases/latest/download/release.tar.gz"
else
    echo "Installing DWE_OS 2 version $VERSION"
    DOWNLOAD_URL="https://github.com/DeepwaterExploration/DWE_OS_2/releases/download/$VERSION/release.tar.gz"
fi

wget $DOWNLOAD_URL -O release.tar.gz

tar -xvzf release.tar.gz

if [ -d "$INSTALL_DIR" ]; then
    echo "$INSTALL_DIR does exist, deleting."
    rm -rf $INSTALL_DIR
fi

mkdir -p ${INSTALL_DIR}

cp -r release/* ${INSTALL_DIR}

cd ${INSTALL_DIR}

sh install_requirements.sh &&
sh create_venv.sh &&

# copy and enable service
cp ${INSTALL_DIR}/service/* /etc/systemd/system/
systemctl enable dwe_os_2
systemctl start dwe_os_2

# cleanup
cd $SCRIPT_RUN_DIR

rm -rf release
rm release.tar.gz

if [ "$VERSION" == "latest" ]; then
    echo "Successfully installed DWE_OS 2 (latest version)"
else
    echo "Successfully installed DWE_OS 2 ($VERSION)"
fi
