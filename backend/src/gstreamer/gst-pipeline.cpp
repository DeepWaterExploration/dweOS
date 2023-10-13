#include "gst-pipeline.hpp"

using namespace gst;

typedef void *(*THREADFUNCPTR)(void *);

/* gst::RawPipeline definitions */

RawPipeline::~RawPipeline() {
    if (_isRunning) stop();
    delete _pipeline;
    delete _msg;
}

void RawPipeline::start() {
    if (_isRunning) {
        stop();
    }
    _isRunning = true;
    std::cout << _pipeline_str << "\n";
    pthread_create(&_thread, NULL, (THREADFUNCPTR)&RawPipeline::_run, this);
}

void RawPipeline::stop() {
    if (!_isRunning) return;
    _isRunning = false;
    gst_element_set_state(
        _pipeline, GST_STATE_NULL);  // stop the pipeline thread
    pthread_kill(_thread, 0);        // stop the other pipeline thread
}

void RawPipeline::restart() {
    stop();
    start();
}

void RawPipeline::_run(void *) {
    _pipeline = gst_parse_launch(_pipeline_str.c_str(), NULL);

    gst_element_set_state(_pipeline, GST_STATE_PLAYING);

    _bus = gst_element_get_bus(_pipeline);
    _msg = gst_bus_timed_pop_filtered(_bus, GST_CLOCK_TIME_NONE,
        (GstMessageType)(GST_MESSAGE_ERROR | GST_MESSAGE_EOS));

    GstStateChangeReturn ret = gst_element_set_state(_pipeline, GST_STATE_NULL);
    if (ret == GST_STATE_CHANGE_FAILURE) {
        g_printerr("Unable to set the pipeline to the playing state.\n");
        gst_object_unref(_pipeline);
        pthread_exit(NULL);
    }

    if (_msg != NULL) {
        GError *err;
        gchar *debug_info;

        switch (GST_MESSAGE_TYPE(_msg)) {
            case GST_MESSAGE_ERROR:
                gst_message_parse_error(_msg, &err, &debug_info);
                g_printerr("Error received from element %s: %s\n",
                    GST_OBJECT_NAME(_msg->src), err->message);
                g_printerr("Debugging information: %s\n",
                    debug_info ? debug_info : "none");
                g_clear_error(&err);
                g_free(debug_info);
                break;
            case GST_MESSAGE_EOS:
                g_print("End-Of-Stream reached.\n");
                break;
            default:
                /* We should not reach here because we only asked for ERRORs and
                 * EOS */
                g_printerr("Unexpected message received.\n");
                break;
        }
        gst_message_unref(_msg);
    }

    gst_object_unref(_pipeline);
    gst_object_unref(_bus);
    gst_message_unref(_msg);

    pthread_exit(NULL);
}

/* gst::Pipeline definitions */

std::string Pipeline::_getDevicePath() { return _streamInfo.device_path; }

std::string Pipeline::_getFormat() {
    std::string format;
    switch (_streamInfo.encode_type) {
        case ENCODE_TYPE_H264:
            format = "video/x-h264";
            break;
        case ENCODE_TYPE_MJPG:
            format = "image/jpeg";
            break;
        default:
            break;
    }
    return format;
}

std::string Pipeline::_buildSource() {
    return fmt::format("v4l2src device={}", _getDevicePath());
}

std::string Pipeline::_constructCaps() {
    std::string format = _getFormat();
    return fmt::format("{},width={},height={},framerate={}/{}", format,
        _streamInfo.width, _streamInfo.height, _streamInfo.interval.denominator,
        _streamInfo.interval.numerator);
}

std::string Pipeline::_buildPayload() {
    std::string payload;
    switch (_streamInfo.encode_type) {
        case ENCODE_TYPE_H264:
            payload =
                "h264parse ! queue ! rtph264pay name=pay0 config-interval=10 "
                "pt=96";
            break;
        case ENCODE_TYPE_MJPG:
            payload = "rtpjpegpay";
            break;
        default:
            break;
    }
    return payload;
}

std::string Pipeline::_buildSink() {
    std::string sink;
    switch (_streamInfo.stream_type) {
        case STREAM_TYPE_UDP:
            if (_streamInfo.endpoints.size() == 0) {
                sink = "fakesink";
                break;
            }
            sink = "multiudpsink clients=";
            for (auto iter = _streamInfo.endpoints.begin();
                 iter != _streamInfo.endpoints.end(); iter++) {
                StreamEndpoint endpoint = *iter;
                if (iter != _streamInfo.endpoints.begin()) sink += ",";
                sink += fmt::format("{}:{}", endpoint.host, endpoint.port);
            }
            break;
        default:
            break;
    }
    return sink;
}
