cmake_minimum_required(VERSION 3.1)
project(backend VERSION 0.0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(JSON_BuildTests OFF CACHE INTERNAL "")

find_package(PkgConfig REQUIRED)
pkg_check_modules(GSTLIBS REQUIRED
    glib-2.0
    gstreamer-check-1.0
    libudev)
find_package(Threads REQUIRED)

include_directories(
    /usr/lib/x86_64-linux-gnu/glib-2.0/include
    /usr/include/glib-2.0
    /usr/include/gstreamer-1.0
    src
    thirdparty/cpp-httplib
    thirdparty/websocketpp
)

add_subdirectory(thirdparty/cwalk)
add_subdirectory(thirdparty/fmt)
add_subdirectory(thirdparty/json)
add_subdirectory(thirdparty/websocketpp)
add_subdirectory(thirdparty/pugixml)

set(SOURCE
    ${SOURCE}
    src/camera/v4l2-camera.cpp
    src/ehd/ehd-option.cpp
    src/ehd/ehd-device.cpp
    src/ehd/device-list.cpp
    src/gstreamer/gst-pipeline.cpp
    src/net/broadcast-server.cpp
    src/settings/settings-manager.cpp
)

set(CMAKE_EXECUTABLE_SUFFIX ".bin")

add_executable(backend
    ${SOURCE}
    src/apps/server.cpp)
target_compile_options(backend PRIVATE "-Wno-pmf-conversions") # Remove warning regarding function conversion
target_link_libraries(backend PRIVATE ${GSTLIBS_LIBRARIES})
target_link_libraries(backend PRIVATE cwalk)
target_link_libraries(backend PRIVATE fmt)
target_link_libraries(backend PRIVATE nlohmann_json::nlohmann_json)
target_link_libraries(backend PRIVATE Threads::Threads)
target_link_libraries(backend PRIVATE pugixml)
