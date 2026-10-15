#!/bin/bash

# Installs DWE OS from a release tarball while building a Raspberry Pi image
# (see dweOS-static.Pifile). Unlike install.sh, it doesn't download anything and
# only enables the service, since it runs inside pimod's chroot rather than on
# a booted Pi.
#
# Usage: image_install_script.sh /path/to/release.tar.gz

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then
    echo "Usage: $0 /path/to/release.tar.gz"
    exit 1
fi

TARBALL=$1
INSTALL_DIR=/opt/DWE_OS_2

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Installing DWE OS from $TARBALL"

tar -xzf "$TARBALL" -C "$WORK_DIR"

rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -r "$WORK_DIR"/release/. "$INSTALL_DIR"/

cd "$INSTALL_DIR"

bash install_requirements.sh
bash create_venv.sh

# Neither script stops on errors, so make sure the result is usable instead of
# shipping an image whose service can't start.
command -v gst-launch-1.0 >/dev/null || {
    echo "GStreamer was not installed"
    exit 1
}
.venv/bin/python3 -c "import backend_py.src" || {
    echo "The Python environment is missing dependencies"
    exit 1
}

cp service/* /etc/systemd/system/
systemctl enable dwe_os_2

echo "Successfully installed DWE OS"
