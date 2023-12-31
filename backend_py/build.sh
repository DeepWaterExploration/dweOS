mkdir build -p
cc -fPIC -shared -o ${PWD}/build/camera_helper.so ${PWD}/src/camera_helper.c
