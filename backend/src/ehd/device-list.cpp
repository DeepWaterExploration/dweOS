#include "device-list.hpp"

typedef void *(*THREADFUNCPTR)(void *);

DeviceList::DeviceList(BroadcastServer &broadcast_server)
    : _broadcast_server(broadcast_server) {}

libehd::Device *DeviceList::get_ehd(std::string usbInfo) {
    for (libehd::Device *device : ehd_devices) {
        v4l2::Device *v4l2_device = device->get_v4l2_device();
        if (usbInfo == v4l2_device->get_usb_info()) {
            return device;
        }
    }
    return nullptr;
}

json DeviceList::serialize_pipeline(gst::Pipeline *pipeline) {
    gst::StreamInformation streamInfo = pipeline->getStreamInfo();
    json pipeline_object = json::object();

    if (!pipeline->getIsConfigured()) {
        return pipeline_object;
    }

    pipeline_object["device_path"] = streamInfo.device_path;

    pipeline_object["endpoints"] = json::array();
    for (gst::StreamEndpoint endpoint : streamInfo.endpoints) {
        json endpoint_object = json::object();
        endpoint_object["host"] = endpoint.host;
        endpoint_object["port"] = endpoint.port;
        pipeline_object["endpoints"].push_back(endpoint_object);
    }

    switch (streamInfo.encode_type) {
        case gst::ENCODE_TYPE_H264:
            pipeline_object["encode_type"] = "H264";
            break;
        case gst::ENCODE_TYPE_MJPG:
            pipeline_object["encode_type"] = "MJPG";
            break;
        case gst::ENCODE_TYPE_NONE:
            pipeline_object["encode_type"] = "NONE";
            break;
    }

    switch (streamInfo.stream_type) {
        /* Only option currently */
        case gst::STREAM_TYPE_UDP:
            pipeline_object["stream_type"] = "UDP";
            break;
        case gst::STREAM_TYPE_NONE:
            pipeline_object["stream_type"] = "NONE";
            break;
    }

    pipeline_object["format"] = json::object();
    pipeline_object["format"]["width"] = streamInfo.width;
    pipeline_object["format"]["height"] = streamInfo.height;
    pipeline_object["format"]["interval"] = json::object();
    pipeline_object["format"]["interval"]["numerator"] =
        streamInfo.interval.numerator;
    pipeline_object["format"]["interval"]["denominator"] =
        streamInfo.interval.denominator;

    return pipeline_object;
}

json DeviceList::serialize_ehd(libehd::Device *ehd) {
    v4l2::Device *v4l2_device = ehd->get_v4l2_device();
    json device_object = json::object();
    device_object["info"] = json::object();
    device_object["info"]["path"] = v4l2_device->get_device_file_path();
    device_object["info"]["name"] = v4l2_device->get_info().device_name;
    device_object["info"]["vid"] = v4l2_device->get_device_attr("idVendor");
    device_object["info"]["pid"] = v4l2_device->get_device_attr("idProduct");
    device_object["info"]["manufacturer"] = "DeepWater Exploration Inc.";
    device_object["info"]["model"] = "DWE-EHDUSBR2";

    std::string usbInfo = v4l2_device->get_usb_info();
    device_object["info"]["usbInfo"] = usbInfo;

    device_object["options"] = {
        {"bitrate", ehd->get_bitrate()},
        {"mode",
            (ehd->get_h264_mode() == libehd::MODE_CONSTANT_BITRATE ? "CBR"
                                                                   : "VBR")},
        {"h264", ehd->get_gop() != 0 ? true : false},
    };

    device_object["cameras"] = json::array();

    device_object["controls"] = json::array();
    device_object["stream"] = serialize_pipeline(v4l2_device->get_pipeline());

    v4l2_device->query_uvc_controls();
    for (v4l2::Control control : v4l2_device->get_uvc_controls()) {
        json control_object = json::object();
        control_object["id"] = control.id;
        control_object["name"] = control.name;
        int32_t value;
        v4l2_device->get_pu(control.id, value);
        control_object["value"] = value;

        json flags = json::object();
        flags["disabled"] = (int)control.flags.disabled;
        flags["grabbed"] = (int)control.flags.grabbed;
        flags["read_only"] = (int)control.flags.read_only;
        flags["update"] = (int)control.flags.update;
        flags["slider"] = (int)control.flags.slider;
        flags["write_only"] = (int)control.flags.write_only;
        flags["volatility"] = (int)control.flags.volatility;
        flags["type"] = control.type;
        flags["max"] = control.max;
        flags["min"] = control.min;
        flags["step"] = control.step;
        flags["default_value"] = control.default_value;

        if (control.menuItems.size() > 0) flags["menu"] = json::array();
        for (v4l2::MenuItem menuItem : control.menuItems) {
            json menu_object = json::object();
            switch (control.type) {
                case v4l2_ctrl_type::V4L2_CTRL_TYPE_MENU:
                    flags["menu"].push_back(menuItem.name);
                    break;
                case v4l2_ctrl_type::V4L2_CTRL_TYPE_INTEGER_MENU:
                    flags["menu"].push_back(menuItem.value);
                    break;
            }
        }

        control_object["flags"] = flags;
        device_object["controls"].push_back(control_object);
    }

    for (v4l2::Camera *camera : v4l2_device->get_cameras()) {
        json camera_object = json::object();
        camera_object["device_path"] = camera->get_path();
        camera_object["formats"] = json::array();

        // serialize formats into json data
        std::vector<v4l2::Format> formats = camera->get_formats();
        for (v4l2::Format format : formats) {
            json format_object = json::object();
            format_object["format"] = v4l2::fourcc2s(format.pixelformat);
            format_object["sizes"] = json::array();
            for (v4l2::FormatSize size : format.sizes) {
                json format_size = json::object();
                format_size["width"] = size.width;
                format_size["height"] = size.height;
                format_size["intervals"] = json::array();
                for (v4l2::Interval interval : size.intervals) {
                    json interval_object = json::object();
                    interval_object["numerator"] = interval.numerator;
                    interval_object["denominator"] = interval.denominator;
                    format_size["intervals"].push_back(interval_object);
                }
                format_object["sizes"].push_back(format_size);
            }
            camera_object["formats"].push_back(format_object);
        }

        device_object["cameras"].push_back(camera_object);
    }
    return device_object;
}

libehd::Device *DeviceList::find_device_with_path(std::string path) {
    for (auto dev : ehd_devices) {
        if (dev->get_v4l2_device()->get_device_file_path() == path) {
            return dev;
        }
    }
    return nullptr;
}

void DeviceList::enumerate() {
    _devices_array = json::array();
    _devices.clear();
    v4l2::devices::list(_devices);

    v4l2_devices.clear();
    ehd_devices.clear();

    for (const auto &device_info : _devices) {
        v4l2::Device *v4l2_device = new v4l2::Device(device_info);

        /* Check if device is an exploreHD */
        if (v4l2_device->get_device_attr("idVendor") == "0c45" &&
            v4l2_device->get_device_attr("idProduct") == "6366") {
            libehd::Device *ehd = libehd::Device::construct_device(v4l2_device);
            json device_object = serialize_ehd(ehd);
            _devices_array.push_back(device_object);
            ehd_devices.push_back(ehd);
        } else {
            delete v4l2_device;
        }
    }
}

void DeviceList::start_monitoring() {
    pthread_create(&_monitor_thread, NULL,
        (THREADFUNCPTR)&DeviceList::_monitor_devices, this);
}

json DeviceList::serialize() {
    json devices_array = json::array();
    for (libehd::Device *ehd : ehd_devices) {
        devices_array.push_back(serialize_ehd(ehd));
    }
    return devices_array;
}

void DeviceList::_monitor_devices() {
    while (1) {
        std::vector<v4l2::devices::DEVICE_INFO> devices;
        std::vector<v4l2::devices::DEVICE_INFO> removed_devices;
        std::vector<v4l2::devices::DEVICE_INFO> added_devices;
        v4l2::devices::list(devices);

        json added_device_objects = json::array();
        json removed_device_objects = json::array();

        for (auto a : devices) {
            bool foundDevice = false;
            for (auto b : _devices) {
                if (a.bus_info == b.bus_info) {
                    foundDevice = true;
                }
            }
            if (!foundDevice) {
                added_devices.push_back(a);
            }
        }

        /* Ensure the devices have time to initialize */
        usleep(50000);

        for (auto a : _devices) {
            bool foundDevice = false;
            for (auto b : devices) {
                if (a.bus_info == b.bus_info) {
                    foundDevice = true;
                }
            }
            if (!foundDevice) {
                removed_devices.push_back(a);
            }
        }

        for (const auto &device_info : added_devices) {
            v4l2::Device *v4l2_device = new v4l2::Device(device_info);

            /* Check if device is an exploreHD */
            if (v4l2_device->get_device_attr("idVendor") == "0c45" &&
                v4l2_device->get_device_attr("idProduct") == "6366") {
                libehd::Device *ehd =
                    libehd::Device::construct_device(v4l2_device);
                json device_object = serialize_ehd(ehd);
                added_device_objects.push_back(device_object);
                _devices_array.push_back(device_object);
                ehd_devices.push_back(ehd);
            } else {
                delete v4l2_device;
            }
        }

        for (const auto &device_info : removed_devices) {
            auto itr = ehd_devices.begin();
            while (itr != ehd_devices.end()) {
                std::string bus_info =
                    (*itr)->get_v4l2_device()->get_info().bus_info;
                if (device_info.bus_info == bus_info) {
                    json device_object = serialize_ehd(*itr);
                    removed_device_objects.push_back(device_object);
                    std::cout << "Device removed from port: "
                              << (*itr)->get_v4l2_device()->get_usb_info()
                              << "\n";
                    ehd_devices.erase(itr);
                } else {
                    itr++;
                }
            }
        }

        if (added_device_objects.size() > 0) {
            _broadcast_server.emit("added_devices", added_device_objects);
        }

        if (removed_device_objects.size() > 0) {
            _broadcast_server.emit("removed_devices", removed_device_objects);
        }

        _devices = devices;
    }
}
