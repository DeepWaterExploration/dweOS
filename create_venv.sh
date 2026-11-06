#!/bin/bash

echo "Creating virtual python environment in .venv directory"

python3 -m venv .venv || exit 1

echo "Installing requirements..."

# Offline bundles (create_offline_bundle.sh) include wheels for each Python version
if test -d wheels; then
    . .venv/bin/activate && pip install --no-index --find-links "./wheels" -r backend_py/requirements.txt || exit 1
else
    . .venv/bin/activate && pip install -r backend_py/requirements.txt || exit 1
fi

echo "Virtual environment created."
