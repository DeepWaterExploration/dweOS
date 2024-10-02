#!/bin/bash

# Remove the build directory if it exists
rm -rf build || true

# Find and remove all __pycache__ directories
find . -type d -name "__pycache__" -exec rm -rf {} +

# Remove the device_settings.json file if it exists
rm -f device_settings.json || true
