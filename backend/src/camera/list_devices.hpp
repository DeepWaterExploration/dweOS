#ifndef LIST_DEVICES_HPP
#define LIST_DEVICES_HPP

#include <dirent.h>
#include <linux/usb/video.h>
#include <linux/uvcvideo.h>

#include <algorithm>  //for sorting
#include <cstring>
#include <iostream>
#include <map>
#include <memory>
#include <regex>
#include <sstream>
#include <string>
#include <vector>

namespace v4l2 {
namespace devices {

struct DEVICE_INFO {
    std::string device_name;
    std::string bus_info;
    std::vector<std::string> device_paths;
};

inline bool is_device_name(std::string devname) {
    std::regex regex(R"(video\d+)");
    return std::regex_match(devname, regex);
}

inline void list(std::vector<DEVICE_INFO> &devices) {
    dirent *ep;
    DIR *dp;

    std::map<std::string, DEVICE_INFO> device_map;

    dp = opendir("/sys/class/video4linux/");
    std::vector<std::string> devpaths;
    while (ep = readdir(dp)) {
        if (is_device_name(ep->d_name)) {
            std::string devpath = "/dev/" + std::string(ep->d_name);
            devpaths.push_back(devpath);
        }
    }

    closedir(dp);

    std::sort(devpaths.begin(), devpaths.end());

    for (std::string devpath : devpaths) {
        std::string bus_info;
        int fd = open(devpath.c_str(), O_RDWR);
        v4l2_capability vcap;
        int err = ioctl(fd, VIDIOC_QUERYCAP, &vcap);
        if (!err) {
            // bingo! bus information
            bus_info = reinterpret_cast<char *>(vcap.bus_info);
            if (!bus_info.starts_with("usb"))
                continue;  // Not the correct type of device
            if (device_map.contains(bus_info)) {
                device_map.at(bus_info).device_paths.push_back(devpath);
            } else {
                DEVICE_INFO info;
                info.device_name = "exploreHD";
                info.device_paths.push_back(devpath);
                info.bus_info = bus_info;
                device_map[bus_info] = info;
            }
        } else {
            continue;  // not the kind of device we are looking for
        }
    }

    for (auto &device : device_map) {
        devices.push_back(device.second);
    }

    // for (auto device : devices) {
    //     std::cout << device.bus_info << "\n";
    //     for (auto devpath : device.device_paths) {
    //         std::cout << devpath << "\n";
    //     }
    //     std::cout << "\n";
    // }
}

}  // namespace devices

}  // namespace v4l2

#endif