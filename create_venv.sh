#!/bin/bash

echo "Creating virtual python enviornment in .env directory"

python3 -m venv .env

echo "Installing requirements..."

source .env/bin/activate && pip install -r backend_py/requirements.txt

echo "Virtual environment created."
