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

    libehd::Device *find_device_with_id(std::string usbID);

    void save_device(libehd::Device *ehd);

    void enumerate();

    void start_monitoring();

    void stop_monitoring();

    json serialize();

    public:
    std::vector<v4l2::Device *> v4l2_devices;
    std::vector<libehd::Device *> ehd_devices;

    private:
    void _monitor_devices();

    void _load_device(libehd::Device *device,
        const settings::SerializedDevice *serialized_device);

    void _load_devices();

    pthread_t _monitor_thread;
    std::vector<v4l2::devices::DEVICE_INFO> _devices;
    BroadcastServer _broadcast_server;
    settings::SettingsManager _settingsManager;

    json _devices_array;
};

#endif
