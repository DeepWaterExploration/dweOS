#!/bin/bash

build_system_api() {
  # Remove build file if it exists
  rm -f system_api
  # Install dependencies
  go mod tidy
  # Build for target
  go build .
}
build_system_api
