#ifndef DEVICE_LIST_HPP
#define DEVICE_LIST_HPP

#include <vector>

#include "camera/v4l2-camera.hpp"
#include "ehd/ehd-device.hpp"
#include "net/broadcast-server.hpp"
#include "nlohmann/json.hpp"
#include "settings/settings-manager.hpp"
using json = nlohmann::json;

class DeviceList {
    public:
    DeviceList();

    libehd::Device *get_ehd(std::string usbInfo);

    json serialize_pipeline(gst::Pipeline *pipeline);

    json serialize_ehd(libehd::Device *ehd);

    libehd::Device *find_device_with_path(std::string path);

    void enumerate();

    void load_devices(const std::vector<settings::SerializedDevice> &devices);

    void start_monitoring();

    void stop_monitoring();

    json serialize();

    public:
    std::vector<v4l2::Device *> v4l2_devices;
    std::vector<libehd::Device *> ehd_devices;

    private:
    void _monitor_devices();

    pthread_t _monitor_thread;
    std::vector<v4l2::devices::DEVICE_INFO> _devices;
    BroadcastServer _broadcast_server;

    json _devices_array;
};

#endif
