#ifndef EHD_DRIVER_HPP
#define EHD_DRIVER_HPP

#include "ehd-option.hpp"

namespace libehd {

/**
 * @brief exploreHD H.264 mode
 *
 */
enum H264Mode { MODE_CONSTANT_BITRATE = 1, MODE_VARIABLE_BITRATE = 2 };

/**
 * @brief exploreHD UVC device
 *
 */
class Device {
    public:
    /**
     * @brief Construct the device
     *
     * @param device v4l2 device
     * @return Device*
     */
    static Device *construct_device(v4l2::Device *device);

    v4l2::Device *get_v4l2_device();

    inline void set_nickname(const std::string &nickname) {
        _nickname = nickname;
    }

    inline std::string get_nickname() { return _nickname; }

    /**
     * @brief Get the bitrate of the camera
     *
     * @return uint32_t bitrate of the camera (in kb/s)
     */
    uint32_t get_bitrate();

    /**
     * @brief Set the bitrate of the camera
     *
     * @param bitrate bitrate of the camera (in kb/s)
     */
    void set_bitrate(uint32_t bitrate);

    /**
     * @brief Get the camera GOP (Group of Pictures) - A GOP of zero corresponds
     * with no H.264 compression
     *
     * @return uint16_t camera GOP value
     */
    uint16_t get_gop();

    /**
     * @brief Set the camera GOP (Group of Pictures) - A GOP of zero corresponds
     * with no H.264 compression
     *
     * @param gop camera GOP value
     */
    void set_gop(uint16_t gop);

    /**
     * @brief Get the H.264 mode of the camera - (MODE_CONSTANT_BITRATE,
     * MODE_VARIABLE_BITRATE)
     *
     * @return uvc_ehd_h264_mode current H.264 mode
     */
    H264Mode get_h264_mode();

    /**
     * @brief Set the H.264 mode of the camera
     *
     * @param mode H.264 mode (constant bitrate is not recommended for low GOP
     * values, variable bitrate is not recommended for high GOP values)
     */
    void set_h264_mode(H264Mode mode);

    /**
     * @brief Destroy a uvc ehd device object
     */
    ~Device();

    private:
    /**
     * @brief Construct a new uvc ehd device object
     *
     * @param camera camera handle
     */
    Device(v4l2::Device *device);

    v4l2::Device *_device;
    std::string _nickname;
    std::string _bus_info;
    std::vector<std::string> _device_paths;
    std::map<std::string, xu::Option *> _options;
};

}  // namespace libehd

#endif
