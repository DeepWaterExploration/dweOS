#!/bin/bash

# Remove the build directory if it exists
find . -type f -name "*.so" -exec rm {} +

# Find and remove all __pycache__ directories
find . -type d -name "__pycache__" -exec rm -rf {} +

# Remove the device_settings.json file if it exists
rm -f device_settings.json || true
rm -f server_preferences.json || true

find . -type f -name "*.log.*" -exec rm {} +
find . -type f -name "*.log" -exec rm {} +
