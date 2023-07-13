#include "httplib.h"
#include "camera/v4l2-camera.hpp"
#include "ehd/ehd-device.hpp"
#include "gstreamer/gst-pipeline.hpp"
#include "nlohmann/json.hpp"
#include "ehd/device-list.hpp"
#include "net/broadcast-server.hpp"
#include <csignal>

using json = nlohmann::json;

httplib::Server svr;
BroadcastServer broadcast_server;

std::string getUSBInfo(const httplib::Params &params, httplib::Response &res) {
    std::string usbInfo = "";
    /* manually find because params.find is unreliable */
    for (auto itr = params.begin(); itr != params.end(); itr++) {
        if (itr->first == "usbInfo") {
            usbInfo = itr->second;
        }
    }

    /* if index was not found */
    if (usbInfo == "") {
        res.status = 400; /* Status 400: Bad Request */
    }

    return usbInfo;
}

void signalHandler(int signum) {
    broadcast_server.stop();
    exit(signum);
}

int main(int argc, char** argv) {
    /* Initialize gstreamer */
    gst_init(&argc, &argv);

    signal(SIGINT, signalHandler);

    DeviceList devices(broadcast_server);
    devices.enumerate();

    broadcast_server.start(9000);

    std::cout << "Running API backend.\n";

    /* monitor */
    devices.start_monitoring();

    /* API */

    svr.Options("/(.*)",
        [&](const httplib::Request &, httplib::Response &res) {
        res.set_header("Access-Control-Allow-Methods", " POST, GET, OPTIONS");
        res.set_header("Content-Type", "text/html; charset=utf-8");
        res.set_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Connection", "close");
    });

    svr.Get("/devices", [&devices](const httplib::Request &, httplib::Response &res) {
        /* re-enumerate */
        json devices_array = devices.serialize();
        res.set_content(devices_array.dump(), "application/json");
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    svr.Get("/device", [&devices](const httplib::Request &req, httplib::Response &res) {
        std::string usbInfo = getUSBInfo(req.params, res);
        libehd::Device *ehd = devices.get_ehd(usbInfo);
        /* index is invalid */
        if (!ehd) {
            res.status = 400; /* Status 400: Bad Request */
            return;
        }
        json resbody = devices.serialize_ehd(ehd);
        res.set_content(resbody.dump(), "application/json");
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    svr.Post("/configure_stream", [&devices](const httplib::Request &req, httplib::Response &res) {
        json requestBody = json::parse(req.body);
        std::string usbInfo = requestBody["usbInfo"];
        libehd::Device *ehd = devices.get_ehd(usbInfo);
        json format = requestBody["format"];
        /* index is invalid */
        if (!ehd) {
            res.status = 400; /* Status 400: Bad Request */
            return;
        }
        v4l2::Device *device = ehd->get_v4l2_device();

        uint32_t pixel_format;
        if (format["format"] == "MJPG") {
            pixel_format = V4L2_PIX_FMT_MJPEG;
        } else if (format["format"] == "H264") {
            pixel_format = V4L2_PIX_FMT_H264;
        } else {
            res.status = 400; /* Status 400: Bad Request */
            return;
        }

        int width = format["width"];
        int height = format["height"];
        json interval_object = format["interval"];
        int numerator = interval_object["numerator"];
        int denominator = interval_object["denominator"];

        device->configure_stream(pixel_format, width, height, v4l2::Interval(numerator, denominator), gst::STREAM_TYPE_UDP);
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    svr.Post("/add_stream_endpoint", [&devices](const httplib::Request &req, httplib::Response &res) {
        json requestBody = json::parse(req.body);
        std::string usbInfo = requestBody["usbInfo"];
        libehd::Device *ehd = devices.get_ehd(usbInfo);

        json endpoint = requestBody["endpoint"];
        std::string host = endpoint["host"];
        int port = endpoint["port"];
        /* index is invalid */
        if (!ehd) {
            res.status = 400; /* Status 400: Bad Request */
            return;
        }

        v4l2::Device *device = ehd->get_v4l2_device();
        device->add_stream_endpoint(host, port);
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    svr.Post("/start_stream", [&devices](const httplib::Request &req, httplib::Response &res) {
        json requestBody = json::parse(req.body);
        std::string usbInfo = requestBody["usbInfo"];
        libehd::Device *ehd = devices.get_ehd(usbInfo);
        /* index is invalid */
        if (!ehd) {
            res.status = 400; /* Status 400: Bad Request */
            return;
        }

        v4l2::Device *device = ehd->get_v4l2_device();
        if (device->is_stream_configured()) {
            std::cout << "Starting stream for device at port: " << usbInfo << "\n";
            device->start_stream();
        }
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    svr.Post("/stop_stream", [&devices](const httplib::Request &req, httplib::Response &res) {
        json requestBody = json::parse(req.body);
        std::string usbInfo = requestBody["usbInfo"];
        libehd::Device *ehd = devices.get_ehd(usbInfo);
        /* index is invalid */
        if (!ehd) {
            res.status = 400; /* Status 400: Bad Request */
            return;
        }

        v4l2::Device *device = ehd->get_v4l2_device();
        if (device->is_stream_configured()) {
            std::cout << "Stopping stream for device at port: " << usbInfo << "\n";
            device->stop_stream();
        }
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    svr.Post("/devices/set_uvc_control", [&devices](const httplib::Request &req, httplib::Response &res) {
        json requestBody = json::parse(req.body);
        std::string usbInfo = requestBody["usbInfo"];
        libehd::Device *ehd = devices.get_ehd(usbInfo);
        /* index is invalid */
        if (!ehd) {
            res.status = 400; /* Status 400: Bad Request */
            return;
        }

        json control = requestBody["control"];
        int id = control["id"];
        int value = control["value"];
        std::cout << "ID: " << id << ", value: " << value << "\n";
        v4l2::Device *device = ehd->get_v4l2_device();
        device->set_pu(id, value);
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    svr.Post("/devices/set_option", [&devices](const httplib::Request &req, httplib::Response &res) {
        json requestBody = json::parse(req.body);
        std::string usbInfo = requestBody["usbInfo"];
        libehd::Device *ehd = devices.get_ehd(usbInfo);
        /* index is invalid */
        if (!ehd) {
            res.status = 400; /* Status 400: Bad Request */
            return;
        }

        std::string option = requestBody["option"];
        /* TODO: error checking for value */
        if (option == "bitrate") {
            ehd->set_bitrate(requestBody["value"]);
        } else if (option == "gop") {
            ehd->set_gop(requestBody["value"]);
        } else if (option == "mode") {
            std::string mode_str = requestBody["value"];
            libehd::H264Mode mode;
            if (mode_str == "CBR") mode = libehd::MODE_CONSTANT_BITRATE;
            else if (mode_str == "VBR") mode = libehd::MODE_VARIABLE_BITRATE;
            else {
                res.status = 400; /* Status 400: Bad Request */
                return;
            }
            ehd->set_h264_mode(mode);
        }
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    /* Leave the pipeline threads running */
    svr.listen("localhost", 8080);
}
