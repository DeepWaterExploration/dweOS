from io import TextIOWrapper
from ctypes import *
import struct

from enumeration import *
from camera_helper_loader import *
import ehd_controls as xu


class DeviceManager:

    def __init__(self) -> None:
        pass


class Camera:

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


class Option:

    _camera: Camera
    _data: bytes

    _unit: xu.Unit
    _ctrl: xu.Selector
    _command: xu.Command
    _size: int

    def __init__(self, camera: Camera, unit: xu.Unit, ctrl: xu.Selector, command: xu.Command, size=11) -> None:
        self._camera = camera
        self._data = b'\x00' * size

        self._unit = unit
        self._ctrl = ctrl
        self._command = command
        self._size = size

    # pack data to internal buffer
    def pack(self, fmt: str, *arg: list[int]) -> None:
        data = struct.pack(fmt, *arg)
        # make sure the data is of the right length
        self._data = data + bytearray(self._size - len(data))

    # unpack data from internal buffer
    def unpack(self, fmt: str) -> list[int]:
        return struct.unpack_from(fmt, self._data)

    def set_ctrl(self):
        data = bytearray(self._size)
        data[0] = xu.EHD_DEVICE_TAG
        data[1] = self._ctrl.value

        # Switch command
        self._camera.uvc_set_ctrl(
            self._unit.value, self._command.value, bytes(data), self._size)

        self._camera.uvc_set_ctrl(
            self._unit.value, self._command.value, self._data, self._size)

    def get_ctrl(self):
        data = bytearray(self._size)
        data[0] = xu.EHD_DEVICE_TAG
        data[1] = self._ctrl.value
        self._data = bytes(self._size)
        # Switch command
        self._camera.uvc_set_ctrl(
            self._unit.value, self._command.value, bytes(data), self._size)

        self._camera.uvc_get_ctrl(
            self._unit.value, self._command.value, self._data, self._size)


class Device:

    def __init__(self) -> None:
        pass


if __name__ == '__main__':
    devices_info = list_devices()
    print(devices_info)

    cam = open('/dev/video2')
    fd = cam.fileno()

    cam = Camera('/dev/video2')
    opt = Option(cam, xu.Unit.USR_ID, xu.Selector.SYS_H264_CTRL,
                 xu.Command.H264_BITRATE_CTRL)
    opt.pack('<I', 15000000)
    opt.set_ctrl()

    opt.get_ctrl()
    print(opt.unpack('<I'))

    # get the bitrate
    # data = bytes([0x9A, 0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    # camera_helper.uvc_set_ctrl(fd, 0x04, 0x02, data, 11)
    # camera_helper.uvc_get_ctrl(fd, 0x04, 0x02, data, 11)
    # print((data[0] << 24) | (data[1] << 16) | (data[2] << 8) | (data[3]))
