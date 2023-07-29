#include "settings-manager.hpp"

using namespace settings;

SettingsManager::SettingsManager() {
    /* Load the XML settings file */
    pugi::xml_parse_result result = _doc.load_file("device_settings.xml");
    if (!result) {
        init_settings_file();
        return;
    }

    /* Settings node */
    pugi::xml_node settings_node = _doc.child("Settings");
    std::cout << "Settings file version: "
              << settings_node.attribute("version").value() << std::endl;
    _devices_node = settings_node.child("Devices");
    for (pugi::xml_node device : _devices_node.children("Device")) {
        _devices.push_back(construct_device(device));
    }
}

void SettingsManager::init_settings_file() {
    pugi::xml_node settings_node = _doc.append_child("Settings");
    settings_node.append_attribute("version").set_value(
        1.0);  // TEMP: set actual version numbers
    _devices_node = settings_node.append_child("Devices");
    _doc.save_file("device_settings.xml");
}

void SettingsManager::save_device(libehd::Device* ehd) {
    v4l2::Device* device = ehd->get_v4l2_device();

    pugi::xml_node device_node;
    for (auto device_node_iter : _devices_node.children("Device")) {
        if (device->get_usb_info() ==
            device_node_iter.attribute("usbInfo").value()) {
            device_node = device_node_iter;
            break;
        }
    }

    if (!device_node) {
        device_node = _devices_node.append_child("Device");
    } else {
        device_node.remove_children();
        device_node.remove_attributes();
    }

    /* Device*/
    device_node.append_attribute("usbInfo").set_value(
        device->get_usb_info().c_str());
    device_node.append_attribute("nickname")
        .set_value(ehd->get_nickname().c_str());

    /* Options */
    pugi::xml_node options_node = device_node.append_child("Options");
    options_node.append_attribute("bitrate").set_value(ehd->get_bitrate());
    options_node.append_attribute("mode").set_value(ehd->get_h264_mode());
    options_node.append_attribute("gop").set_value(ehd->get_gop());

    /* Controls */
    pugi::xml_node controls_node = device_node.append_child("Controls");
    controls_node.remove_children();
    for (auto control : device->get_uvc_controls()) {
        pugi::xml_node control_node = controls_node.append_child("Control");
        int32_t value;
        device->get_pu(control.id, value);
        control_node.append_attribute("id").set_value(control.id);
        control_node.append_attribute("value").set_value(value);
    }

    /* Stream */
    if (device->is_stream_configured()) {
        pugi::xml_node stream_node = device_node.append_child("Stream");
        gst::StreamInformation stream_info =
            device->get_pipeline()->getStreamInfo();
        stream_node.append_attribute("encodeType")
            .set_value(
                stream_info.encode_type == gst::ENCODE_TYPE_H264
                    ? "H264"
                    : "MJPG");  // TODO: change to integer for consistency
        stream_node.append_attribute("streamType")
            .set_value(stream_info.stream_type);
        stream_node.append_attribute("width").set_value(stream_info.width);
        stream_node.append_attribute("height").set_value(stream_info.height);
        stream_node.append_attribute("numerator")
            .set_value(stream_info.interval.numerator);
        stream_node.append_attribute("denominator")
            .set_value(stream_info.interval.denominator);

        pugi::xml_node endpoints_node = stream_node.append_child("Endpoints");
        endpoints_node.remove_children();
        for (gst::StreamEndpoint endpoint : stream_info.endpoints) {
            pugi::xml_node endpoint_node =
                endpoints_node.append_child("Endpoint");
            endpoint_node.append_attribute("host").set_value(
                endpoint.host.c_str());
            endpoint_node.append_attribute("port").set_value(endpoint.port);
        }
    }

    if (!find_device_with_id(device->get_usb_info())) {
        _devices.push_back(construct_device(device_node));
    }

    SerializedDevice* serialized_device =
        find_device_with_id(device->get_usb_info());
    if (serialized_device) {
        free(serialized_device);
        serialized_device = construct_device(device_node);
    }
    _doc.save_file("device_settings.xml");
}

SerializedDevice* SettingsManager::find_device_with_id(std::string usbInfo) {
    for (SerializedDevice* device : _devices) {
        if (device->usbInfo == usbInfo) return device;
    }
    return nullptr;
}

SerializedDevice* SettingsManager::construct_device(
    pugi::xml_node device_node) {
    /* Initial device setup */
    pugi::xml_node options_node = device_node.child("Options");
    SerializedDevice* serialized_device = new SerializedDevice{
        .usbInfo = device_node.attribute("usbInfo").value(),
        .nickname = device_node.attribute("nickname").value(),
        .bitrate = options_node.attribute("bitrate").as_uint(),
        .mode = (libehd::H264Mode)options_node.attribute("mode").as_uint(),
        .gop = options_node.attribute("gop").as_uint(),
    };

    /* UVC Controls */
    for (pugi::xml_node control :
        device_node.child("Controls").children("Control")) {
        SerializedControl serialized_control = {
            .id = control.attribute("id").as_uint(),
            .value = control.attribute("value").as_int()};
        serialized_device->controls.push_back(serialized_control);
    }

    /* Stream */
    pugi::xml_node stream_node = device_node.child("Stream");
    SerializedStream* serialized_stream = nullptr;
    // Is there a stream?
    if (stream_node) {
        serialized_stream = new SerializedStream{
            .encodeType = stream_node.attribute("encodeType").as_string(),
            .streamType = stream_node.attribute("streamType").as_uint(),
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
            serialized_stream->endpoints.push_back(serialized_endpoint);
        }
    }
    serialized_device->stream = serialized_stream;
    return serialized_device;
}
