#!/bin/bash

build_frontend() {
  # Run TypeScript compiler
  npx tsc
  # Run Vite build
  npx vite build
}

build_frontend
