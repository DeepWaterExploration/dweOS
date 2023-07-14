#ifndef EHD_CONTROLS_HPP
#define EHD_CONTROLS_HPP

namespace libehd {

namespace xu {

// XU Control Tag
constexpr int EHD_DEVICE_TAG = 0x9A;

// XU Control Units
enum Unit { SYS_ID = 0x02, USR_ID = 0x04 };

// System & User XU Control Selectors
enum Selector {
    SYS_ASIC_RW = 0x01,
    SYS_FLASH_CTRL = 0x03,
    SYS_FRAME_INFO = 0x06,
    SYS_H264_CTRL = 0x07,
    SYS_MJPG_CTRL = 0x08,
    SYS_OSD_CTRL = 0x09,
    SYS_MOTION_DETECTION = 0x0A,
    SYS_IMG_SETTING = 0x0B,
    USR_FRAME_INFO = 0x01,
    USR_H264_CTRL = 0x02,
    USR_MJPG_CTRL = 0x03,
    USR_OSD_CTRL = 0x04,
    USR_MOTION_DETECTION = 0x05,
    USR_IMG_SETTING = 0x06,
    USR_MULTI_STREAM_CTRL = 0x07,
    USR_GPIO_CTRL = 0x08,
    USR_DYNAMIC_FPS_CTRL = 0x09
};

// XU Commands
enum Command {
    H264_BITRATE_CTRL = 0x02,
    GOP_CTRL = 0x03,
    H264_MODE_CTRL = 0x06
};

}  // namespace xu

}  // namespace libehd

#endif
