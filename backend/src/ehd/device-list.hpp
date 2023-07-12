#include "nlohmann/json.hpp"
#include "camera/v4l2-camera.hpp"
#include "ehd/ehd-device.hpp"
#include "net/broadcast-server.hpp"
using json = nlohmann::json;

class DeviceList {
public:
    DeviceList(BroadcastServer &broadcast_server);

    libehd::Device *get_ehd(std::string usbInfo);

    json serialize_pipeline(gst::Pipeline *pipeline);

    json serialize_ehd(libehd::Device *ehd);

    libehd::Device *find_device_with_path(std::string path);

    void enumerate();

    void start_monitoring();

    json serialize();

public:
    std::vector<v4l2::Device*> v4l2_devices;
    std::vector<libehd::Device*> ehd_devices;

    json _devices_array;

private:
    void _monitor_devices();

    pthread_t _monitor_thread;
    std::vector<v4l2::devices::DEVICE_INFO> _devices;
    BroadcastServer &_broadcast_server;
};