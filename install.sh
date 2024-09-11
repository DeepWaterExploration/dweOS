#!/bin/bash

INSTALL_DIR=/opt/DWE_OS_2
SCRIPT_RUN_DIR=$PWD

echo "Installing DWE_OS_2 (https://github.com/DeepwaterExploration/DWE_OS_2/releases/latest/download/release.tar.gz)"

wget https://github.com/DeepwaterExploration/DWE_OS_2/releases/latest/download/release.tar.gz

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

echo "Successfully installed DWE_OS_2 ${VERSION}"

cp ${INSTALL_DIR}/service/* /etc/systemd/system/
systemctl enable dwe_os_2
systemctl start dwe_os_2

# cleanup

cd $SCRIPT_RUN_DIR

rm -rf release
rm release.tar.gz
