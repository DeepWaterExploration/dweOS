#ifndef LIST_DEVICES_HPP
#define LIST_DEVICES_HPP

#include <dirent.h>

#include <algorithm>  //for sorting
#include <cstring>
#include <iostream>
#include <map>
#include <memory>
#include <nlohmann/json.hpp>
#include <regex>
#include <sstream>
#include <string>
#include <vector>
using json = nlohmann::json;

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

    json device_list = json::object();

    dp = opendir("/sys/class/video4linux/");
    while (ep = readdir(dp)) {
        if (is_device_name(ep->d_name)) {
            std::string devpath = "/dev/" + std::string(ep->d_name);
            std::string bus_info;
            int fd = open(devpath.c_str(), O_RDWR);
            v4l2_capability vcap;
            int err = ioctl(fd, VIDIOC_QUERYCAP, &vcap);
            if (!err) {
                // bingo! bus information
                bus_info = reinterpret_cast<char *>(vcap.bus_info);
            } else {
                continue;  // not the kind of device we are looking for
            }
        }
    }

    // for (DEVICE_INFO d : devices) {
    //     std::cout << d.device_name << " " << d.bus_info << std::endl;
    //     for (std::string path : d.device_paths) {
    //         std::cout << path << std::endl;
    //     }
    // }
}

}  // namespace devices

}  // namespace v4l2

#endif