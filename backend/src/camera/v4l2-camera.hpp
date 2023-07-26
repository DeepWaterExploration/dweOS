#ifndef CAMERA_HPP
#define CAMERA_HPP

#include <cwalk.h>
#include <fcntl.h>
#include <linux/media.h>
#include <linux/types.h>
#include <linux/videodev2.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <unistd.h>

#include <filesystem>
#include <fstream>
#include <iostream>
#include <vector>

#include "../gstreamer/gst-pipeline.hpp"
#include "list_devices.hpp"
#include "v4l2-types.hpp"

/**
 * @brief Linux camera utility namespace
 *
 */
namespace v4l2 {

/**
 * @brief Convert a pixel format to a string
 *
 * @param fourcc V4L2 pixel format containing 4 bytes
 * @return std::string Converted format string
 */
std::string fourcc2s(uint32_t fourcc);

/**
 * @brief Convert a string to a pixel format
 *
 * @param s string containing 4 characters
 * @return uint32_t Converted V4L2 pixel format
 */
uint32_t s2fourcc(std::string s);

class Camera {
    public:
    Camera(std::string path) : _path(path) {}

    ~Camera() { close(_fd); }

    inline std::string get_path() { return _path; }

    inline int get_file_descriptor() { return _fd; }

    inline std::vector<Format> get_formats() { return _formats; }

    int uvc_set_ctrl(uint32_t unit, uint32_t ctrl, uint8_t *data, uint8_t size);

    int uvc_get_ctrl(uint32_t unit, uint32_t ctrl, uint8_t *data, uint8_t size);

    ErrorType camera_open();

    bool has_format(uint32_t pixel_format);

    Format get_format(uint32_t pixel_format);

    private:
    RealFormat _format;
    std::string _path;
    int _fd;
    std::vector<Format> _formats;
    std::vector<Control> _controls;
};

class Device {
    public:
    Device(v4l2::devices::DEVICE_INFO info);

    ~Device();

    inline std::string get_device_file_path() { return _device_path; }

    inline std::vector<Camera *> get_cameras() { return _cameras; }

    std::string get_device_attr(std::string attr);

    Camera *find_camera_with_format(uint32_t pixel_format);

    void query_uvc_controls();

    int set_pu(uint32_t id, int32_t value);

    int get_pu(uint32_t id, int32_t &value);

    std::vector<Control> get_uvc_controls();

    inline v4l2::devices::DEVICE_INFO get_info() { return _info; }

    inline std::string get_usb_info() { return _usbInfo; }

    void configure_stream(uint32_t pixel_format, uint32_t width,
        uint32_t height, Interval interval, gst::StreamType streamType,
        std::vector<gst::StreamEndpoint> endpoints={});
    void start_stream();
    void stop_stream();
    void add_stream_endpoint(const std::string &host, uint32_t port);
    void remove_stream_endpoint(int index);
    bool is_stream_configured();

    inline gst::Pipeline *get_pipeline() { return _pipeline; }

    private:
    std::string _device_path;
    std::vector<Camera *> _cameras;
    std::map<std::string, std::string> _cached_attrs;
    v4l2::devices::DEVICE_INFO _info;
    std::vector<Control> _controls;
    gst::Pipeline *_pipeline;
    std::string _usbInfo;
};

}  // namespace v4l2

#endif
