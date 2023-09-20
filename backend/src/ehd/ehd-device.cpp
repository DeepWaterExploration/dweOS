#include "ehd-device.hpp"

using namespace libehd;

/* libehd::Driver */

Device *Device::construct_device(v4l2::Device *device) {
    if (device->get_device_attr("idVendor") == "0c45" &&
        device->get_device_attr("idProduct") == "6366") {
        return new Device(device);
    }
    return NULL;
}

v4l2::Device *Device::get_v4l2_device() { return _device; }

Device::Device(v4l2::Device *device) : _device(device) {
    v4l2::Camera *h264Camera =
        device->find_camera_with_format(V4L2_PIX_FMT_H264);
    _options.insert(std::make_pair(
        "bitrate", new xu::Option(h264Camera, xu::USR_ID, xu::USR_H264_CTRL,
                       xu::H264_BITRATE_CTRL)));
    _options.insert(
        std::make_pair("gop", new xu::Option(h264Camera, xu::USR_ID,
                                  xu::USR_H264_CTRL, xu::GOP_CTRL)));
    _options.insert(
        std::make_pair("mode", new xu::Option(h264Camera, xu::USR_ID,
                                   xu::USR_H264_CTRL, xu::H264_MODE_CTRL)));
    /* Additional options can be inserted here */

    /* Initialize raw values */
    _device_option_values.bitrate = _get_bitrate_raw();
    _device_option_values.gop = _get_gop_raw();
    _device_option_values.mode = _get_h264_mode_raw();
}

Device::~Device() {
    // Clean up the options
    for (auto it = _options.begin(); it != _options.end(); it++) {
        delete it->second;
    }
    _options.clear();
    delete _device;
}

/* Set camera options */

void Device::set_bitrate(uint32_t bitrate) {
    _device_option_values.bitrate = bitrate;
    xu::Option *opt = _options.at("bitrate");
    opt->pack(bitrate, BIG_ENDIAN);
    opt->set();
    opt->clear();
}

void Device::set_gop(uint16_t gop) {
    _device_option_values.gop = gop;
    xu::Option *opt = _options.at("gop");
    opt->pack<uint16_t>(gop);
    opt->set();
    opt->clear();
}

void Device::set_h264_mode(H264Mode mode) {
    _device_option_values.mode = mode;
    xu::Option *opt = _options.at("mode");
    opt->pack(static_cast<uint8_t>(mode));
    opt->set();
    opt->clear();
}

/* Get the raw camera values (different from the externally set values) */

uint32_t Device::_get_bitrate_raw() {
    xu::Option *opt = _options.at("bitrate");
    opt->get();
    uint32_t bitrate;
    opt->unpack(bitrate, BIG_ENDIAN);
    opt->clear();
    return bitrate;
}

uint16_t Device::_get_gop_raw() {
    xu::Option *opt = _options.at("gop");
    opt->get();
    uint16_t gop;
    opt->unpack(gop);
    opt->clear();
    return gop;
}

H264Mode Device::_get_h264_mode_raw() {
    xu::Option *opt = _options.at("mode");
    opt->get();
    uint8_t mode;
    opt->unpack(mode);
    opt->clear();
    return static_cast<H264Mode>(mode);
}
