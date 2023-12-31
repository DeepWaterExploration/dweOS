#!/bin/bash

if test -d release; then
    rm -rf release
fi
mkdir -p release

cd backend_py

echo "Packaging backend"

./clean.sh
# Do not run build.sh, so it will be cross platform
# Everything needed to run build.sh comes with any linux device, and it builds quite fast

cd ..

cp backend_py -r release

echo "Successfully packaged backend"

echo "Packaging frontend"

cd frontend
npm run build

cd ..

mkdir release/frontend
cp frontend/dist/* -r release/frontend

echo "Successfully packaged frontend"

cp run_release.py release
