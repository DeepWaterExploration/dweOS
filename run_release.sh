#!/bin/bash

# expects create_venv.sh to have been run

# Activate the venv
source .env/bin/activate

python3 run_release.py
