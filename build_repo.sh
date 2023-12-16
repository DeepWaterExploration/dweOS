# Go to frontend folder
cd frontend
sh ./build_frontend.sh
# Return to root folder
cd ..

# Go to backend folder
cd backend_py
sh ./build.sh
# Return to root folder
cd ..

# Create a release
if [ -d "release" ]; then rm -Rf release; fi
mkdir release && cd release

ARCH=$(dpkg --print-architecture)
echo ${ARCH}
mkdir DWE_OS_2_${ARCH}_Linux && cd DWE_OS_2_${ARCH}_Linux
mkdir backend && mkdir frontend && mkdir system_api
cp ../../backend/build/backend.bin ./backend
cp ../../frontend/dist/** -r ./frontend
cp ../../system_api/** -r ./system_api
zip -r DWE_OS_2_${ARCH} DWE_OS_2_${ARCH}
rm -rf DWE_OS_2_${ARCH}
cd ..
