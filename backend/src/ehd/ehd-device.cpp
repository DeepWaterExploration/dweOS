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
}

Device::~Device() { delete _device; }

uint32_t Device::get_bitrate() {
    xu::Option *opt = _options.at("bitrate");
    opt->get();
    uint32_t bitrate;
    opt->unpack(bitrate, BIG_ENDIAN);
    opt->clear();
    return bitrate;
}

void Device::set_bitrate(uint32_t bitrate) {
    xu::Option *opt = _options.at("bitrate");
    opt->pack(bitrate, BIG_ENDIAN);
    opt->set();
    opt->clear();
}

uint16_t Device::get_gop() {
    xu::Option *opt = _options.at("gop");
    opt->get();
    uint16_t gop;
    opt->unpack(gop);
    opt->clear();
    return gop;
}

void Device::set_gop(uint16_t gop) {
    xu::Option *opt = _options.at("gop");
    opt->pack<uint16_t>(gop);
    opt->set();
    opt->clear();
}

H264Mode Device::get_h264_mode() {
    xu::Option *opt = _options.at("mode");
    opt->get();
    uint8_t mode;
    opt->unpack(mode);
    opt->clear();
    return static_cast<H264Mode>(mode);
}

void Device::set_h264_mode(H264Mode mode) {
    xu::Option *opt = _options.at("mode");
    opt->pack(static_cast<uint8_t>(mode));
    opt->set();
    opt->clear();
}
