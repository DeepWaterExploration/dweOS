#!/bin/bash

set -e

GITHUB_REPO="${GITHUB_REPO:-DeepwaterExploration/DWE_OS_2}"
SOURCE_REPO="${SOURCE_REPO:-DeepWaterExploration/dweOS}"
INSTALLER_URL="${INSTALLER_URL:-https://raw.githubusercontent.com/${SOURCE_REPO}/main/install-local.sh}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root"
  exit 1
fi

# Check if a tag name was provided as an argument
if [ -z "$1" ]; then
    VERSION="latest"
else
    VERSION=$1
fi

if [ "$VERSION" == "latest" ]; then
    echo "Installing DWE_OS 2 (latest release)"
    DOWNLOAD_URL="https://github.com/${GITHUB_REPO}/releases/latest/download/release.tar.gz"
else
    echo "Installing DWE_OS 2 ($VERSION)"
    DOWNLOAD_URL="https://github.com/${GITHUB_REPO}/releases/download/$VERSION/release.tar.gz"
fi

WORK_DIR=$(mktemp -d)
cleanup() {
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

wget "$DOWNLOAD_URL" -O "$WORK_DIR/release.tar.gz"

# Releases carry their own installer, so online and offline installs run
# exactly the same code. Releases cut before that was true fall back to
# fetching the installer from the branch this script came from.
INSTALLER="$WORK_DIR/release/install-local.sh"
if tar -tzf "$WORK_DIR/release.tar.gz" | grep -qx "release/install-local.sh"; then
    tar -xzf "$WORK_DIR/release.tar.gz" -C "$WORK_DIR" release/install-local.sh
else
    echo "This release predates the bundled installer, fetching it from $SOURCE_REPO"
    mkdir -p "$WORK_DIR/release"
    wget "$INSTALLER_URL" -O "$INSTALLER"
fi

bash "$INSTALLER" "$WORK_DIR/release.tar.gz"
