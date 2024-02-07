#!/bin/bash

echo "Creating virtual python environment in .env directory"

python3 -m venv .env

echo "Installing requirements..."

. .env/bin/activate && pip install -r backend_py/requirements.txt

echo "Virtual environment created."
