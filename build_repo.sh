# Go to frontend folder
cd frontend
sh ./build_frontend.sh
# Return to root folder
cd ..

# Go to backend folder
cd backend
sh ./build_backend.sh
# Return to root folder
cd ..

# Create a release
if [ -d "release" ]; then rm -Rf release; fi
mkdir release && cd release

mkdir DWE_OS_2_x86_64_Linux && cd DWE_OS_2_x86_64_Linux
mkdir backend && mkdir frontend && mkdir system_api
cp ../../backend/build/backend.bin ./backend
cp ../../frontend/dist/** -r ./frontend
cp ../../system_api/** -r ./system_api
cd ..

zip -r DWE_OS_2_x86_64_Linux DWE_OS_2_x86_64_Linux
rm -rf DWE_OS_2_x86_64_Linux
