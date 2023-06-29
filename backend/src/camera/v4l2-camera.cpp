#include <linux/uvcvideo.h>
#include <linux/usb/video.h>
#include "v4l2-camera.hpp"

using namespace v4l2;

std::string v4l2::fourcc2s(uint32_t fourcc) {
    std::string str;
    str += fourcc & 0x7f;
    str += (fourcc >> 8) & 0x7f;
    str += (fourcc >> 16) & 0x7f;
    str += (fourcc >> 24) & 0x7f;
    if (fourcc & (1 << 31)) {
        str += '-';
        str += 'B';
        str += 'E';
    }
    return str;
}

/* v4l2::Camera definitions */

int Camera::uvc_set_ctrl(uint32_t unit, uint32_t ctrl, uint8_t *data, uint8_t size) {
    struct uvc_xu_control_query xctrlq;
    xctrlq.unit = unit;
    xctrlq.selector = ctrl;
    /* UVC query type is a SET CURRENT request */
    xctrlq.query = UVC_SET_CUR;
    xctrlq.size = size;
    xctrlq.data = data;

    /* Interface with the hardware of the H.264 enabled camera */
    return ioctl(_fd, UVCIOC_CTRL_QUERY, &xctrlq);
}

int Camera::uvc_get_ctrl(uint32_t unit, uint32_t ctrl, uint8_t *data, uint8_t size) {
    struct uvc_xu_control_query xctrlq;
    xctrlq.unit = unit;
    xctrlq.selector = ctrl;
    /* UVC query type is a GET CURRENT request */
    xctrlq.query = UVC_GET_CUR;
    xctrlq.size = size;
    xctrlq.data = data;
    /* Interface with the hardware of the H.264 enabled camera */
    return ioctl(_fd, UVCIOC_CTRL_QUERY, &xctrlq);
}

int Device::set_pu(uint32_t id, int32_t value) {
    int fd = _cameras.at(0)->get_file_descriptor();
    struct v4l2_control control = {id, value};
    return ioctl(fd, VIDIOC_S_CTRL, &control);
}

int Device::get_pu(uint32_t id, int32_t &value)
{
    int fd = _cameras.at(0)->get_file_descriptor();
    v4l2_control control = {id, 0};
    int res = ioctl(fd, VIDIOC_G_CTRL, &control);
    value = control.value;
    return res;
}

void Device::query_uvc_controls() {
    int fd = _cameras.at(0)->get_file_descriptor(); // TODO: error checking
    _controls.clear();
    for (uint32_t cid = V4L2_CID_USER_BASE; cid < V4L2_CID_LASTP1; cid++) {
        Control control;
        v4l2_queryctrl qctrl;
        qctrl.id = cid;
        if (ioctl(fd, VIDIOC_QUERYCTRL, &qctrl) == -1) continue;
        control.id = cid;
        control.name = (char*)qctrl.name;
        // std::cout << "  UVC Control: " << cid << " (" << control.name << ")" << "\n";
        
        control.flags.disabled = (qctrl.flags & V4L2_CTRL_FLAG_DISABLED);
        control.flags.grabbed = (qctrl.flags & V4L2_CTRL_FLAG_GRABBED);
        control.flags.read_only = (qctrl.flags & V4L2_CTRL_FLAG_READ_ONLY);
        control.flags.update = (qctrl.flags & V4L2_CTRL_FLAG_UPDATE);
        control.flags.slider = (qctrl.flags & V4L2_CTRL_FLAG_SLIDER);
        control.flags.write_only = (qctrl.flags & V4L2_CTRL_FLAG_WRITE_ONLY);
        control.flags.volatility = (qctrl.flags & V4L2_CTRL_FLAG_VOLATILE);
        
        control.type = (v4l2_ctrl_type)qctrl.type;
        control.max = qctrl.maximum;
        control.min = qctrl.minimum;
        control.step = qctrl.step;
        control.default_value = qctrl.default_value;

        switch (qctrl.type) {
            case v4l2_ctrl_type::V4L2_CTRL_TYPE_MENU:
                for (uint32_t mindex = 0; mindex < qctrl.maximum + 1; mindex++) {
                    v4l2_querymenu qmenu;
                    qmenu.id = control.id;
                    qmenu.index = mindex;
                    if (ioctl(fd, VIDIOC_QUERYMENU, &qmenu) == 0) {
                        MenuItem menuItem;
                        menuItem.index = mindex;
                        menuItem.name = (char*)qmenu.name;
                        control.menuItems.push_back(menuItem);
                    }
                }
                break;
            case v4l2_ctrl_type::V4L2_CTRL_TYPE_INTEGER_MENU:
                for (uint32_t mindex = 0; mindex < qctrl.maximum + 1; mindex++) {
                    v4l2_querymenu qmenu;
                    qmenu.id = control.id;
                    qmenu.index = mindex;
                    if (ioctl(fd, VIDIOC_QUERYMENU, &qmenu) == 0) {
                        MenuItem menuItem;
                        menuItem.index = mindex;
                        menuItem.value = qmenu.value;
                        control.menuItems.push_back(menuItem);
                    }
                }
                break;
        }
        _controls.push_back(control);
    }
}

std::vector<Control> Device::get_uvc_controls() {
    return _controls;
}

ErrorType Camera::camera_open() {
    _fd = open(_path.c_str(), O_RDWR, 0);
    if (_fd == -1) {
        return V4L2_OPEN_FAILURE;
    }
    for (uint32_t i = 0; ; i++) {
        v4l2_fmtdesc fmt = {0};
        fmt.index = i;
        fmt.type = V4L2_BUF_TYPE_VIDEO_CAPTURE;
        if (ioctl(_fd, VIDIOC_ENUM_FMT, &fmt) == -1) break;
        Format format;
        format.pixelformat = fmt.pixelformat;
        for (uint32_t j = 0; ; j++) {
            v4l2_frmsizeenum frmsize = {0};
            frmsize.index = j;
            frmsize.pixel_format = fmt.pixelformat;
            if (ioctl(_fd, VIDIOC_ENUM_FRAMESIZES, &frmsize) == -1) break;
            if (frmsize.type == V4L2_FRMSIZE_TYPE_DISCRETE) {
                FormatSize format_size;
                format_size.width = frmsize.discrete.width;
                format_size.height = frmsize.discrete.height;
                for (uint32_t k = 0; ; k++) {
                    v4l2_frmivalenum frmival = {0};
                    frmival.index = k;
                    frmival.pixel_format = fmt.pixelformat;
                    frmival.width = frmsize.discrete.width;
                    frmival.height = frmsize.discrete.height;
                    if (ioctl(_fd, VIDIOC_ENUM_FRAMEINTERVALS, &frmival) == -1)
                        break;
                    if (frmival.type = V4L2_FRMIVAL_TYPE_DISCRETE) {
                        format_size.intervals.push_back({
                            frmival.discrete.numerator, frmival.discrete.denominator
                        });
                    }
                }
                format.sizes.push_back(format_size);
            }
        }
        _formats.push_back(format);
    }
    if (_formats.size() == 0) return V4L2_INCOMPATIBLE;

    // configure_pipeline();

    return V4L2_SUCCESS;
}

bool Camera::has_format(uint32_t pixel_format) {
    for (Format format : _formats) {
        if (pixel_format == format.pixelformat) {
            return true;
        }
    }
    return false;
}

Format Camera::get_format(uint32_t pixel_format) {
    for (Format format : _formats) {
        if (pixel_format == format.pixelformat) {
            return format;
        }
    }
    throw std::runtime_error("Format not found!");
}

/* v4l2::Device definitions */

Device::Device(v4l2::devices::DEVICE_INFO info) : _info(info) {
    _pipeline = new gst::Pipeline();
    for (std::string path : info.device_paths) {
        Camera *camera = new Camera(path);
        if (camera->camera_open() == V4L2_INCOMPATIBLE) {
            delete camera;
        } else {
            _cameras.push_back(camera);
        }
    }

    if (info.device_paths.size() > 0) {
        std::string cam_name = std::filesystem::path(_info.device_paths.at(0)).filename();
        char result[FILENAME_MAX];
        cwk_path_join("/sys/class/video4linux/", cam_name.c_str(), result, sizeof(result));
        std::string link = std::filesystem::read_symlink(result);
        cwk_path_get_absolute("/sys/class/video4linux/", link.c_str(), result, sizeof(result));
        cwk_path_join(result, "../../../", result, sizeof(result));
        _device_path = std::string(result);
    }

    query_uvc_controls();
}

Device::~Device() {
    if (_pipeline)
        delete _pipeline;
}

std::string Device::get_device_attr(std::string attr) {
    if (_cached_attrs.count(attr) > 0) {
        return _cached_attrs.at(attr);
    }
    std::filesystem::path attr_path = _device_path;
    attr_path += attr;
    std::ifstream in(_device_path + "/" + attr);
    if (in.good()) {
        std::string contents((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
        contents.erase(std::remove(contents.begin(), contents.end(), '\n'), contents.cend());
        _cached_attrs.insert(std::make_pair(attr, contents));
        return contents;
    }
    throw std::invalid_argument("Invalid attribute name '" + attr + "'");
}

Camera *Device::find_camera_with_format(uint32_t pixel_format) {
    for (Camera *camera : _cameras) {
        if (camera->has_format(pixel_format)) return camera;
    }
    return NULL;
}

void Device::configure_stream(uint32_t pixel_format, uint32_t width, uint32_t height, Interval interval, gst::StreamType streamType=gst::STREAM_TYPE_UDP) {
    /* Make sure if a pipeline has already been configured, it is not running */
    if (_pipeline->getIsConfigured()) {
        _pipeline->stop();
        delete _pipeline;
        _pipeline = new gst::Pipeline();
    }
    
    gst::StreamInformation streamInfo;
    Camera *camera = find_camera_with_format(pixel_format);
    if (!camera)
        throw std::runtime_error("Specified camera does not have the pixel format given.");
    streamInfo.device_path = camera->get_path();

    gst::EncodeType encodeType;
    switch (pixel_format) {
        case V4L2_PIX_FMT_H264:
            encodeType = gst::ENCODE_TYPE_H264;
            break;
        case V4L2_PIX_FMT_MJPEG:
            encodeType = gst::ENCODE_TYPE_MJPG;
            break;
        default:
            encodeType = gst::ENCODE_TYPE_NONE;
            throw std::runtime_error("Pixel format not recognized at this time.");
            break;
    }
    
    streamInfo.encode_type = encodeType;
    streamInfo.width = width;
    streamInfo.height = height;
    streamInfo.stream_type = streamType;
    streamInfo.interval = interval;

    _pipeline->setStreamInformation(streamInfo);
}

void Device::start_stream() {
    _pipeline->start();
}

void Device::stop_stream() {
    _pipeline->stop();
}

void Device::add_stream_endpoint(const std::string &host, uint32_t port) {
    gst::StreamEndpoint endpoint;
    endpoint.host = host;
    endpoint.port = port;
    _pipeline->addEndpoint(endpoint);
}

bool Device::is_stream_configured() {
    return _pipeline->getIsConfigured();
}
