#ifndef SETTINGS_MANAGER_HPP
#define SETTINGS_MANAGER_HPP

#include <pugixml.hpp>
#include <string>
#include <vector>

#include "ehd/ehd-device.hpp"

namespace settings {

struct SerializedEndpoint {
    std::string host;
    uint32_t port;
};

struct SerializedStream {
    std::string encodeType;
    uint32_t streamType;
    uint32_t width, height;
    uint32_t numerator, denominator;
    std::vector<SerializedEndpoint> endpoints;
};

struct SerializedControl {
    uint32_t id;
    int32_t value;
};

struct SerializedDevice {
    std::string usbInfo;
    std::string nickname;
    uint32_t bitrate;
    libehd::H264Mode mode;
    uint32_t gop;
    SerializedStream* stream;
    std::vector<SerializedControl> controls;
};

/**
 * @brief Settings manager
 *
 */
class SettingsManager {
    public:
    SettingsManager();

    /**
     * @brief Get list of serialized devices
     *
     * @return std::vector<SerializedDevice> devices
     */
    inline std::vector<SerializedDevice*> get_devices() { return _devices; }

    /**
     * @brief Find a serialized device with a specified ID
     *
     */
    SerializedDevice* find_device_with_id(std::string usbInfo);

    private:
    /* Devices */
    std::vector<SerializedDevice*> _devices;

    /* XML */
    pugi::xml_document _doc;
};

}  // namespace settings

#endif
