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
    std::string encodeType, streamType;
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
    uint32_t bitrate;
    std::string mode;
    bool h264;
    SerializedStream stream;
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
    inline std::vector<SerializedDevice> get_devices() { return _devices; }

    private:
    /* Devices */
    std::vector<SerializedDevice> _devices;

    /* XML */
    pugi::xml_document _doc;
};

}  // namespace settings

#endif
