#!/bin/bash

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root"
  exit 1
fi

INSTALL_DIR=/opt/DWE_OS_2
# The new version is built here, so a failed download or dependency install
# leaves the existing install untouched
STAGING_DIR=${INSTALL_DIR}.new
BACKUP_DIR=${INSTALL_DIR}.old
# Settings saved by the backend in the install directory, kept across updates
SETTINGS_FILES="device_settings.json server_preferences.json"

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
    echo "Installing DWE_OS 2 ($VERSION)"
    DOWNLOAD_URL="https://github.com/DeepwaterExploration/DWE_OS_2/releases/download/$VERSION/release.tar.gz"
fi

DOWNLOAD_DIR=$(mktemp -d)
trap 'rm -rf "$DOWNLOAD_DIR" "$STAGING_DIR"' EXIT

wget $DOWNLOAD_URL -O "$DOWNLOAD_DIR/release.tar.gz"

tar -xzf "$DOWNLOAD_DIR/release.tar.gz" -C "$DOWNLOAD_DIR"

rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"

cp -r "$DOWNLOAD_DIR"/release/* "$STAGING_DIR"

cd "$STAGING_DIR"

sh install_requirements.sh
sh create_venv.sh

cd /

# check if the service is already running, and stop it if necessary
if systemctl is-active --quiet dwe_os_2; then
    echo "Stopping currently running dwe_os_2 service..."
    systemctl stop dwe_os_2
fi

# swap the new install in, keeping the old one until the swap succeeds
rm -rf "$BACKUP_DIR"
if [ -d "$INSTALL_DIR" ]; then
    echo "Replacing existing install at $INSTALL_DIR"
    for file in $SETTINGS_FILES; do
        if [ -f "$INSTALL_DIR/$file" ]; then
            cp "$INSTALL_DIR/$file" "$STAGING_DIR/$file"
        fi
    done
    mv "$INSTALL_DIR" "$BACKUP_DIR"
fi

if ! mv "$STAGING_DIR" "$INSTALL_DIR"; then
    echo "Failed to install, restoring the previous install"
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        mv "$BACKUP_DIR" "$INSTALL_DIR"
        systemctl start dwe_os_2
    fi
    exit 1
fi

# copy and enable service
cp ${INSTALL_DIR}/service/* /etc/systemd/system/
systemctl daemon-reload
systemctl enable dwe_os_2
systemctl start dwe_os_2

rm -rf "$BACKUP_DIR"

if [ "$VERSION" == "latest" ]; then
    echo "Successfully installed DWE_OS 2 (latest version)"
else
    echo "Successfully installed DWE_OS 2 ($VERSION)"
fi
