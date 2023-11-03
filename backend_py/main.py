from io import TextIOWrapper
from ctypes import *
import struct
from dataclasses import dataclass

from enumeration import *
from enum import Enum
from camera_helper_loader import *
import ehd_controls as xu

from memory_profiler import profile
import time


class DeviceManager:

    def __init__(self) -> None:
        pass


@dataclass
class Interval:
    numerator: int
    denominator: int


@dataclass
class FormatSize:
    width: int
    height: int
    intervals: list[Interval]


@dataclass
class Format:
    pixel_format: int
    sizes: list[FormatSize]


class Camera:
    '''
    Camera base class
    '''

    _path: str  # /dev/video#
    _file_object: TextIOWrapper  # file object
    _fd: int  # fd created by uvc_functions

    def __init__(self, path) -> None:
        self._path = path
        self._file_object = open(path)
        self._fd = self._file_object.fileno()  # get the file descriptor

    # uvc_set_ctrl function defined in uvc_functions.c
    def uvc_set_ctrl(self, unit: xu.Unit, ctrl: xu.Selector, data: bytes, size: int) -> int:
        return camera_helper.uvc_set_ctrl(self._fd, unit, ctrl, data, size)

    # uvc_get_ctrl function defined in uvc_functions.c
    def uvc_get_ctrl(self, unit: xu.Unit, ctrl: xu.Selector, data: bytes, size: int) -> int:
        return camera_helper.uvc_get_ctrl(self._fd, unit, ctrl, data, size)

    def _get_formats(self):
        formats = []
        for i in range(1000):
            v4l2_fmt = v4l2.v4l2_fmtdesc()
            v4l2_fmt.index = i
            v4l2_fmt.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
            try:
                fcntl.ioctl(self._fd, v4l2.VIDIOC_ENUM_FMT, v4l2_fmt)
            except:
                break

            fmt = Format(v4l2_fmt.pixelformat, [])
            for j in range(1000):
                frmsize = v4l2.v4l2_frmsizeenum()
                frmsize.index = j
                frmsize.pixel_format = fmt.pixel_format
                try:
                    fcntl.ioctl(self._fd, v4l2.VIDIOC_ENUM_FRAMESIZES, frmsize)
                except:
                    break
                if frmsize.type == v4l2.V4L2_FRMSIZE_TYPE_DISCRETE:
                    format_size = FormatSize(
                        frmsize.discrete.width, frmsize.discrete.height, [])
                    for k in range(1000):
                        frmival = v4l2.v4l2_frmivalenum()
                        frmival.index = k
                        frmival.pixel_format = fmt.pixel_format
                        frmival.width = frmsize.discrete.width
                        frmival.height = frmsize.discrete.height
                        try:
                            fcntl.ioctl(
                                self._fd, v4l2.VIDIOC_ENUM_FRAMEINTERVALS, frmival)
                        except:
                            break
                        if frmival.type == v4l2.V4L2_FRMIVAL_TYPE_DISCRETE:
                            format_size.intervals.append(
                                Interval(frmival.discrete.numerator, frmival.discrete.denominator))
                    fmt.sizes.append(format_size)
            formats.append(fmt)
        return formats


class Option:
    '''
    EHD Option Class
    '''

    _camera: Camera
    _data: bytes

    _unit: xu.Unit
    _ctrl: xu.Selector
    _command: xu.Command
    _size: int
    _fmt: str

    def __init__(self, camera: Camera, fmt: str, unit: xu.Unit, ctrl: xu.Selector, command: xu.Command, size=11) -> None:
        self._camera = camera
        self._fmt = fmt

        self._unit = unit
        self._ctrl = ctrl
        self._command = command
        self._size = size
        self._data = b'\x00' * size

    # get the control value(s)
    def get_value(self):
        self._get_ctrl()
        values = self._unpack(self._fmt)
        self._clear()
        # all cases will basically be this, but otherwise this will still work
        if len(values) == 1:
            return values[0]
        return values

    # set the control value
    def set_value(self, *arg: list):
        self._pack(self._fmt, *arg)
        self._set_ctrl()
        self._clear()

    # pack data to internal buffer
    def _pack(self, fmt: str, *arg: list) -> None:
        data = struct.pack(fmt, *arg)
        # make sure the data is of the right length
        self._data = data + bytearray(self._size - len(data))

    # unpack data from internal buffer
    def _unpack(self, fmt: str) -> list:
        return struct.unpack_from(fmt, self._data)

    def _set_ctrl(self):
        data = bytearray(self._size)
        data[0] = xu.EHD_DEVICE_TAG
        data[1] = self._command.value

        # Switch command
        self._camera.uvc_set_ctrl(
            self._unit.value, self._ctrl.value, bytes(data), self._size)

        self._camera.uvc_set_ctrl(
            self._unit.value, self._ctrl.value, self._data, self._size)

    def _get_ctrl(self):
        data = bytearray(self._size)
        data[0] = xu.EHD_DEVICE_TAG
        data[1] = self._command.value
        self._data = bytes(self._size)
        # Switch command
        self._camera.uvc_set_ctrl(
            self._unit.value, self._ctrl.value, bytes(data), self._size)

        self._camera.uvc_get_ctrl(
            self._unit.value, self._ctrl.value, self._data, self._size)

    def _clear(self):
        self._data = b'\x00' * self._size


def is_ehd(device_info: DeviceInfo):
    return (
        device_info.vid == 0xc45 and
        device_info.pid == 0x6366 and
        len(device_info.device_paths) == 4
    )


class EHDDevice:

    device_info: DeviceInfo

    _cameras: list[Camera] = []
    _device_path: str
    _device_attrs: dict[str, str] = {}
    _options: dict[str, Option] = {}

    class H264Mode(Enum):
        '''
        H.264 Mode Enum
        '''
        MODE_CONSTANT_BITRATE = 1
        MODE_VARIABLE_BITRATE = 2

    def __init__(self, device_info: DeviceInfo) -> None:
        # make sure this is an exploreHD
        assert (is_ehd(device_info))

        self.device_info = device_info

        for device_path in device_info.device_paths:
            self._cameras.append(Camera(device_path))

        # UVC xu bitrate control
        self._options['bitrate'] = Option(
            self._cameras[2], '>I', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.H264_BITRATE_CTRL)

        # UVC xu gop control
        self._options['gop'] = Option(
            self._cameras[2], 'H', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.GOP_CTRL)

        # UVC xu H264 mode control
        self._options['mode'] = Option(
            self._cameras[2], 'B', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.H264_MODE_CTRL)

    def get_bitrate(self):
        return self._get_option('bitrate')

    def set_bitrate(self, bitrate: int):
        self._set_option('bitrate', bitrate)

    def get_gop(self):
        return self._get_option('gop')

    def set_gop(self, gop: int):
        self._set_option('gop', gop)

    def get_mode(self):
        return self._get_option('mode')

    def set_mode(self, mode: H264Mode):
        self._set_option('mode', mode.value)

    # get an option
    def _get_option(self, opt: str):
        if opt in self._options:
            return self._options[opt].get_value()
        return None

    # set an option
    def _set_option(self, opt: str, *arg: list):
        if opt in self._options:
            return self._options[opt].set_value(*arg)
        return None

    # get a device attribute
    def _get_device_attr(self, attr: str) -> str:
        attr_path = self._device_path + '/' + attr
        file_object = open(attr_path)
        return file_object.read().strip()


# find the difference between lists
def list_diff(listA, listB):
    diff = []
    for element in listA:
        if element not in listB:
            diff.append(element)
    return diff


# monitor devices for changes
def monitor():
    devices: list[EHDDevice] = []
    old_device_list = []
    while True:
        devices_info = list_devices()

        # find the new devices
        new_devices = list_diff(devices_info, old_device_list)

        # find the removed devices
        removed_devices = list_diff(old_device_list, devices_info)

        # add the new devices
        for device_info in new_devices:
            if not is_ehd(device_info):
                continue
            # if the device is not ready (essentially meaning the linux filesystem has not been populated yet),
            # this will error, resulting in the loop continuing
            # yes, this is a bit hacky, but there is no real cleaner way of doing this
            device = None
            try:
                device = EHDDevice(device_info)
                print(device.get_bitrate())
            except:
                continue
            if device:
                print(f'Device Added: {device_info.bus_info}')
                devices.append(EHDDevice(device_info))
                old_device_list.append(device_info)

        # remove the old devices
        for device_info in removed_devices:
            for device in devices:
                if device.device_info == device_info:
                    devices.remove(device)
                    old_device_list.remove(device_info)
                    print(f'Device Removed: {device_info.bus_info}')

        time.sleep(0.1)


def main():
    monitor()


if __name__ == '__main__':
    main()
