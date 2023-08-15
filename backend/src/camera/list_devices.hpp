#ifndef LIST_DEVICES_HPP
#define LIST_DEVICES_HPP

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

// https://stackoverflow.com/a/478960
inline std::string exec(const std::string &cmd) {
    std::array<char, 128> buffer;
    std::string result;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(
        popen(cmd.c_str(), "r"), pclose);
    if (!pipe) {
        throw std::runtime_error("popen() failed!");
    }
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    return result;
}

const std::string WHITESPACE = " \n\r\t\f\v";

inline std::string ltrim(const std::string &s) {
    size_t start = s.find_first_not_of(WHITESPACE);
    return (start == std::string::npos) ? "" : s.substr(start);
}

inline std::string rtrim(const std::string &s) {
    size_t end = s.find_last_not_of(WHITESPACE);
    return (end == std::string::npos) ? "" : s.substr(0, end + 1);
}

inline std::string trim(const std::string &s) { return rtrim(ltrim(s)); }

inline void list(std::vector<DEVICE_INFO> &devices) {
    std::string v4l2_list_devices = exec("v4l2-ctl --list-devices");
    std::stringstream v4l2_list_devices_stream(v4l2_list_devices);
    std::string line;
    DEVICE_INFO device = {};
    while (std::getline(v4l2_list_devices_stream, line)) {
        if (!line.empty()) {
            std::regex regex(R"((.+?(?=\(.*\)))\((.*?)\))");
            std::smatch match;
            if (std::regex_search(line, match, regex)) {
                device.device_name = trim(match[1]);
                device.bus_info = trim(match[2]);
            } else {
                if (trim(line).find("/dev/media") == std::string::npos)
                    device.device_paths.push_back(trim(line));
            }
        } else {
            if (device.device_name.find("bcm2835-codec-decode") == std::string::npos && device.device_name.find("bcm2835-isp") == std::string::npos)
                devices.push_back(device);
            device.device_paths.clear();
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
