#!/bin/bash
rm -rf build || true
rm -rf src/__pycache__ || true
rm -rf src/devices/__pycache__ || true
rm -rf src/lights/__pycache__ || true
rm -f device_settings.json || true
