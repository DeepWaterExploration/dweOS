#!/bin/bash

# expects create_venv.sh to have been run

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

cd /opt/CH341SER
sudo make load || echo "CH341 module may already be loaded. Continuing..."

cd ${SCRIPT_DIR}

# needs sudo perms
sudo .env/bin/python3 run_release.py "$@"
