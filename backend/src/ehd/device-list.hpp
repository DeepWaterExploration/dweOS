#include "nlohmann/json.hpp"
#include "camera/v4l2-camera.hpp"
#include "ehd/ehd-device.hpp"
using json = nlohmann::json;

class DeviceList {
public:
    DeviceList() { }

    libehd::Device *get_ehd(int index);

    json serialize_pipeline(gst::Pipeline *pipeline);

    json serialize_ehd(libehd::Device *ehd);

    void enumerate();

    json serialize();

public:
    std::vector<v4l2::Device*> v4l2_devices;
    std::vector<libehd::Device*> ehd_devices;

    json _devices_array;
};