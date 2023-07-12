#ifndef TYPES_HPP
#define TYPES_HPP

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>

#include <iostream>
#include <filesystem>
#include <fstream>
#include <vector>

#include <linux/types.h>
#include <linux/videodev2.h>
#include <linux/media.h>
#include <sys/ioctl.h>
#include <cwalk.h>

/**
 * @brief Linux camera utility namespace
 * 
 */
namespace v4l2 {
    enum ErrorType {
        V4L2_SUCCESS, V4L2_OPEN_FAILURE, V4L2_INCOMPATIBLE
    };

    struct Interval {
        uint32_t numerator, denominator;

        Interval(uint32_t numerator, uint32_t denominator) : numerator(numerator), denominator(denominator) { }

        Interval() {}
    };

    struct FormatSize {
        uint32_t width, height;
        std::vector<Interval> intervals;
    };

    struct Format {
        uint32_t pixelformat;
        std::vector<FormatSize> sizes;
    };

    struct RealFormat {
        uint32_t pixelformat;
        uint32_t width;
        uint32_t height;
        uint32_t buffer_size;
    };

    struct StreamFormat {
        uint32_t pixelformat;
        uint32_t width, height;
        Interval interval;
    };

    struct MenuItem {
        uint32_t index;
        int64_t value; // integer menu
        std::string name; // normal menu
    };

    struct Control {
        uint32_t id;
        std::string name;
        struct {
            unsigned disabled: 1;
            unsigned grabbed: 1;
            unsigned read_only: 1;
            unsigned update: 1;
            unsigned slider: 1;
            unsigned write_only: 1;
            unsigned volatility: 1;
        } flags;
        v4l2_ctrl_type type;
        int32_t max, min, step, default_value;
        std::vector<MenuItem> menuItems;
    };

    struct USBInfo {
        int usbController, portIndex, deviceIndex;
    };
}

#endif
