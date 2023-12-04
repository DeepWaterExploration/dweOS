#include <fcntl.h>
#include <linux/usb/video.h>
#include <linux/uvcvideo.h>
#include <linux/videodev2.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <sys/ioctl.h>
#include <unistd.h>

int uvc_set_ctrl(
    int fd, uint32_t unit, uint32_t ctrl, uint8_t *data, uint8_t size)
{
    struct uvc_xu_control_query xctrlq;
    xctrlq.unit = unit;
    xctrlq.selector = ctrl;
    /* UVC query type is a SET CURRENT request */
    xctrlq.query = UVC_SET_CUR;
    xctrlq.size = size;
    xctrlq.data = data;

    /* Interface with the hardware of the H.264 enabled camera */
    int ret = ioctl(fd, UVCIOC_CTRL_QUERY, &xctrlq);
    return ret;
}

int uvc_get_ctrl(
    int fd, uint32_t unit, uint32_t ctrl, uint8_t *data, uint8_t size)
{
    struct uvc_xu_control_query xctrlq;
    xctrlq.unit = unit;
    xctrlq.selector = ctrl;
    /* UVC query type is a SET CURRENT request */
    xctrlq.query = UVC_GET_CUR;
    xctrlq.size = size;
    xctrlq.data = data;

    /* Interface with the hardware of the H.264 enabled camera */
    int ret = ioctl(fd, UVCIOC_CTRL_QUERY, &xctrlq);
    return ret;
}

int query_menu_name(int fd, int control_id, int mindex, char *name)
{
    struct v4l2_querymenu qmenu;
    qmenu.id = control_id;
    qmenu.index = mindex;
    int ret = ioctl(fd, VIDIOC_QUERYMENU, &qmenu);
    strcpy(name, qmenu.name);
    printf("%s\n", qmenu.name);
    return ret;
}
