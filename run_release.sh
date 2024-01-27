#!/bin/bash

# expects create_venv.sh to have been run

# needs sudo perms for the go backend
sudo .env/bin/python3 run_release.py
