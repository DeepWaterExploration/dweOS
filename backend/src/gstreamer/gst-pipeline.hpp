#ifndef GST_PIPELINE_H
#define GST_PIPELINE_H

#include <fmt/core.h>
#include <gst/gst.h>
#include <pthread.h>

#include <functional>
#include <iostream>
#include <string>
#include <vector>

#include "camera/v4l2-types.hpp"

namespace gst {

/**
 * @brief GStreamer pipeline structure
 *
 */
class RawPipeline {
    public:
    /**
     * @brief Construct a new Raw Pipeline object
     *
     */
    RawPipeline() {}

    /**
     * @brief Delete a Raw Pipeline object
     *
     */
    ~RawPipeline();

    /**
     * @brief Construct a new Raw Pipeline object
     *
     * @param pipeline_str pipeline string
     */
    RawPipeline(const std::string &pipeline_str)
        : _pipeline_str(pipeline_str) {}

    /**
     * @brief Set the Pipeline String
     *
     * @param pipeline_str pipeline string
     */
    inline void setPipelineString(const std::string &pipeline_str) {
        _pipeline_str = pipeline_str;
    }

    /**
     * @brief Start the stream
     *
     */
    void start();

    /**
     * @brief Stop the stream
     *
     */
    void stop();

    /**
     * @brief Restart the stream
     *
     */
    void restart();

    private:
    std::string _pipeline_str;
    GstElement *_pipeline;
    GstBus *_bus;
    GstMessage *_msg;
    pthread_t _thread;
    bool _isRunning = false;

    private:
    void _run(void *);
};

struct StreamEndpoint {
    std::string host;
    uint32_t port;
};

enum EncodeType { ENCODE_TYPE_NONE, ENCODE_TYPE_H264, ENCODE_TYPE_MJPG };

enum StreamType { STREAM_TYPE_NONE, STREAM_TYPE_UDP };

struct StreamInformation {
    std::vector<StreamEndpoint> endpoints;
    std::string device_path;
    EncodeType encode_type;
    StreamType stream_type;
    uint32_t width, height;
    v4l2::Interval interval;
};

class Pipeline : public RawPipeline {
    public:
    Pipeline() {}

    Pipeline(const StreamInformation &streamInfo)
        : RawPipeline(), _streamInfo(streamInfo) {
        _isConfigured = true;
        setPipelineString(_constructPipeline());
    }

    void setStreamInformation(StreamInformation streamInfo) {
        _streamInfo = streamInfo;
        _isConfigured = true;
        setPipelineString(_constructPipeline());
    }

    StreamInformation getStreamInfo() { return _streamInfo; }

    bool getIsConfigured() { return _isConfigured; }

    inline void addEndpoint(const StreamEndpoint &endpoint) {
        _streamInfo.endpoints.push_back(endpoint);
        setPipelineString(_constructPipeline());
    }

    inline void removeEndpoint(int index) {
        _streamInfo.endpoints.erase(
            std::next(_streamInfo.endpoints.begin(), index));
    }

    private:
    StreamInformation _streamInfo;

    bool _isConfigured = false;

    std::string _getDevicePath();
    std::string _getFormat();
    std::string _buildSource();
    std::string _constructCaps();
    std::string _buildPayload();
    std::string _buildSink();

    inline std::string _constructPipeline() {
        std::string source = _buildSource();
        std::string caps = _constructCaps();
        std::string payload = _buildPayload();
        std::string sink = _buildSink();

        return fmt::format("{} ! {} ! {} ! {}", source, caps, payload, sink);
    }
};

}  // namespace gst

#endif
