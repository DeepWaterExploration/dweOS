#include "settings-manager.hpp"

using namespace settings;

SettingsManager::SettingsManager() {
    /* Load the XML settings file */
    pugi::xml_parse_result result = _doc.load_file("test.xml");
    if (!result) {
        throw std::runtime_error("Unable to load settings from XML.");
    }

    /* Settings node */
    pugi::xml_node settings = _doc.child("Settings");
    std::cout << "Settings file version: "
              << settings.attribute("version").value() << std::endl;
    for (pugi::xml_node device : settings.child("Devices").children("Device")) {
        /* Initial device setup */
        pugi::xml_node options_node = device.child("Options");
        SerializedDevice serialized_device = {
            .usbInfo = options_node.attribute("usbInfo").value(),
            .bitrate = options_node.attribute("bitrate").as_uint(),
            .mode = options_node.attribute("mode").as_string(),
            .h264 = options_node.attribute("usbInfo").as_bool()};

        /* UVC Controls */
        for (pugi::xml_node control :
            device.child("Controls").children("Control")) {
            SerializedControl serialized_control = {
                .id = control.attribute("id").as_uint(),
                .value = control.attribute("value").as_int()};
            serialized_device.controls.push_back(serialized_control);
        }

        /* Stream */
        pugi::xml_node stream_node = device.child("Stream");
        // Is there a stream?
        if (stream_node) {
            SerializedStream serialized_stream = {
                .encodeType = stream_node.attribute("encodeType").as_string(),
                .streamType = stream_node.attribute("streamType").as_string(),
                .width = stream_node.attribute("width").as_uint(),
                .height = stream_node.attribute("height").as_uint(),
                .numerator = stream_node.attribute("numerator").as_uint(),
                .denominator = stream_node.attribute("denominator").as_uint(),
            };
            /* Stream endpoints */
            for (pugi::xml_node endpoint_node :
                stream_node.child("Endpoints").children("Endpoint")) {
                SerializedEndpoint serialized_endpoint = {
                    .host = endpoint_node.attribute("host").as_string(),
                    .port = endpoint_node.attribute("port").as_uint(),
                };
                serialized_stream.endpoints.push_back(serialized_endpoint);
            }
            serialized_device.stream = serialized_stream;
        }

        _devices.push_back(serialized_device);
    }
}
