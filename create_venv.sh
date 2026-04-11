#!/bin/bash

echo "Creating virtual python environment in .venv directory"

python3 -m venv .venv

echo "Installing requirements..."

. .venv/bin/activate && pip install -r backend_py/requirements.txt

echo "Virtual environment created."
