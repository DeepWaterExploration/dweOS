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

# Update the version string for packaging
python3 update_versioning.py
cd frontend
# Build the frontend
npm run build

cd ..

mkdir -p release/frontend/dist
cp frontend/dist/* -r release/frontend/dist

echo "Successfully packaged frontend"

cp run_release.py release
cp install_requirements.sh release
cp create_venv.sh release
cp run_release.sh release
cp -r service release

tar -czvf release.tar.gz release
