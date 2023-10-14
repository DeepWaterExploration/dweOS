#include <fcntl.h>
#include <linux/usb/video.h>
#include <linux/uvcvideo.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/ioctl.h>
#include <unistd.h>

int uvc_set_ctrl(
    int fd, uint32_t unit, uint32_t ctrl, uint8_t *data, uint8_t size) {
    // int fd = open(device_path, O_RDWR);

    struct uvc_xu_control_query xctrlq;
    xctrlq.unit = unit;
    xctrlq.selector = ctrl;
    /* UVC query type is a SET CURRENT request */
    xctrlq.query = UVC_SET_CUR;
    xctrlq.size = size;
    xctrlq.data = data;

    /* Interface with the hardware of the H.264 enabled camera */
    int ret = ioctl(fd, UVCIOC_CTRL_QUERY, &xctrlq);
    // close(fd);
    return ret;
}

int uvc_get_ctrl(
    int fd, uint32_t unit, uint32_t ctrl, uint8_t *data, uint8_t size) {
    // int fd = open(device_path, O_RDWR);

    struct uvc_xu_control_query xctrlq;
    xctrlq.unit = unit;
    xctrlq.selector = ctrl;
    /* UVC query type is a SET CURRENT request */
    xctrlq.query = UVC_GET_CUR;
    xctrlq.size = size;
    xctrlq.data = data;

    /* Interface with the hardware of the H.264 enabled camera */
    int ret = ioctl(fd, UVCIOC_CTRL_QUERY, &xctrlq);
    // close(fd);
    return ret;
}
