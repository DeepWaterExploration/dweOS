from ctypes import *
import struct
from dataclasses import dataclass
from typing import Dict, Callable, Any

import event_emitter as events

from linuxpy.video import device
from enum import Enum

from . import v4l2
from . import ehd_controls as xu

from .stream_utils import fourcc2s
from .enumeration import *
from .camera_helper_loader import *
from .camera_types import *
from .stream import *
from .saved_types import *
from .stream_utils import string_to_stream_encode_type

import logging

PID_VIDS = {
    'exploreHD': {
        'VID': 0xc45,
        'PID': 0x6366,
        'device_type': DeviceType.EXPLOREHD
    },
    'stellarHD: Leader': {
        'VID': 0xc45,
        'PID': 0x6367,
        'device_type': DeviceType.STELLARHD_LEADER
    },
    'stellarHD: Follower': {
        'VID': 0xc45,
        'PID': 0x6368,
        'device_type': DeviceType.STELLARHD_FOLLOWER
    }
}

def lookup_pid_vid(vid: int, pid: int) -> Tuple[str, DeviceType]:
    for name in PID_VIDS:
        dev = PID_VIDS[name]
        if dev['VID'] == vid and dev['PID'] == pid:
            return (name, dev['device_type'])
    return None

class Camera:
    '''
    Camera base class
    '''

    def __init__(self, path: str) -> None:
        self.path = path
        self._file_object = open(path)
        self._fd = self._file_object.fileno()  # get the file descriptor
        self._get_formats()

    # uvc_set_ctrl function defined in uvc_functions.c
    def uvc_set_ctrl(self, unit: xu.Unit, ctrl: xu.Selector, data: bytes, size: int) -> int:
        return camera_helper.uvc_set_ctrl(self._fd, unit, ctrl, data, size)

    # uvc_get_ctrl function defined in uvc_functions.c
    def uvc_get_ctrl(self, unit: xu.Unit, ctrl: xu.Selector, data: bytes, size: int) -> int:
        return camera_helper.uvc_get_ctrl(self._fd, unit, ctrl, data, size)

    def has_format(self, pixformat: str) -> bool:
        return pixformat in self.formats.keys()

    def _get_formats(self):
        self.formats: Dict[str,List[FormatSize]] = {}
        for i in range(1000):
            v4l2_fmt = v4l2.v4l2_fmtdesc()
            v4l2_fmt.index = i
            v4l2_fmt.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
            try:
                fcntl.ioctl(self._fd, v4l2.VIDIOC_ENUM_FMT, v4l2_fmt)
            except:
                break

            format_sizes = []
            for j in range(1000):
                frmsize = v4l2.v4l2_frmsizeenum()
                frmsize.index = j
                frmsize.pixel_format = v4l2_fmt.pixelformat
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
                        frmival.pixel_format = v4l2_fmt.pixelformat
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
                    format_sizes.append(format_size)
            self.formats[fourcc2s(v4l2_fmt.pixelformat)] = format_sizes


class Option:
    '''
    EHD Option Class
    '''

    def __init__(self, camera: Camera, fmt: str, unit: xu.Unit, ctrl: xu.Selector, command: xu.Command,
                 name: str,
                 conversion_func_set: Callable[[Any],list|Any] = lambda val : val,
                 conversion_func_get: Callable[[list|Any],Any] = lambda val : val,
                 size=11) -> None:
        self._camera = camera
        self._fmt = fmt
        self._conversion_func_set = conversion_func_set
        self._conversion_func_get = conversion_func_get

        self._unit = unit
        self._ctrl = ctrl
        self._command = command
        self._size = size
        self._data = b'\x00' * size

        self.name = name;

    # get the control value(s)
    def get_value_raw(self):
        self._get_ctrl()
        values = self._unpack(self._fmt)
        self._clear()
        # all cases will basically be this, but otherwise this will still work
        if len(values) == 1:
            return values[0]
        return values

    # set the control value
    def set_value_raw(self, *arg: list):
        self._pack(self._fmt, *arg)
        self._set_ctrl()
        self._clear()

    def set_value(self, value):
        converted = self._conversion_func_set(value)
        if type(converted) == list:
            self.set_value_raw(*converted)
        else:
            self.set_value_raw(converted)

    def get_value(self):
        return self._conversion_func_get(self.get_value_raw())

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


class Device(events.EventEmitter):

    def __init__(self, device_info: DeviceInfo) -> None:
        super().__init__()
        self.cameras: List[Camera] = []
        for device_path in device_info.device_paths:
            self.cameras.append(Camera(device_path))

        self.device_info = device_info
        self.vid = device_info.vid
        self.pid = device_info.pid
        (self.name, self.device_type) = lookup_pid_vid(self.vid, self.pid)
        if self.name is not None:
            self.manufacturer = 'DeepWater Exploration Inc.'
        else:
            logging.error('VID/PID not found. Code should not reach here, but will still work.')
            return
        self.bus_info = device_info.bus_info
        self.nickname = ''
        self.stream = Stream()

        # each device has a streamrunner, but not all of them are used if they are a follower (shd)
        self.stream_runner = StreamRunner(self.stream)

        for camera in self.cameras:
            for encoding in camera.formats:
                encode_type = string_to_stream_encode_type(encoding)
                if encode_type:
                    self.stream.encode_type = encode_type
                    # The highest resolution is the default
                    # Most users will use this, however it is available to be changed in the frontend
                    self.stream.width = camera.formats[encoding][0].width
                    self.stream.height = camera.formats[encoding][0].height
                    self.stream.interval.denominator = camera.formats[encoding][0].intervals[0].denominator
                    self.stream.interval.numerator = camera.formats[encoding][0].intervals[0].numerator
                    break


        self.v4l2_device = device.Device(self.cameras[0].path) # for control purposes
        self.v4l2_device.open()

        # This must be configured by the implementing class
        self._options: Dict[str, Option] = self._get_options()

        # Options dict
        # self.options = {}

        # list the controls and store them
        self.controls = []

        self._id_counter = 1

        self._get_controls()

    def _get_options(self) -> Dict[str, Option]:
        return {}

    def _get_controls(self):
        fd = self.cameras[0]._fd
        self.controls: List[Control] = []

        for ctrl in self.v4l2_device.controls.values():
            control = Control(ctrl.id, ctrl.name, ctrl.value)

            control.flags.control_type = ControlTypeEnum(ctrl.type)
            try:
                control.flags.max_value = ctrl.maximum
            except:
                control.flags.max_value = 0
            try:
                control.flags.min_value = ctrl.minimum
            except:
                control.flags.min_value = 0
            try:
                control.flags.step = ctrl.step
            except:
                control.flags.step = 0
            control.flags.default_value = ctrl._info.default_value
            control.value = self.get_pu(ctrl.id)

            match control.flags.control_type:
                case ControlTypeEnum.MENU:
                    for i in ctrl.data:
                        menu_item = ctrl.data[i]
                        control.flags.menu.append(
                            MenuItem(i, menu_item))

            self.controls.append(control)

    def find_camera_with_format(self, fmt: str) -> Camera | None:
        for cam in self.cameras:
            if cam.has_format(fmt):
                return cam
        return None

    def configure_stream(self, encode_type: StreamEncodeTypeEnum, width: int, height: int, interval: Interval, stream_type: StreamTypeEnum, stream_endpoints: List[StreamEndpoint] = []):
        logging.info(self._fmt_log('Configuring stream'))

        camera: Camera = None
        match encode_type:
            case StreamEncodeTypeEnum.H264:
                camera = self.find_camera_with_format('H264')
            case StreamEncodeTypeEnum.MJPG:
                camera = self.find_camera_with_format('MJPG')
            case _:
                pass

        if not camera:
            logging.warn('Attempting to select incompatible encoding type. This is undefined behavior.')
            return


        self.stream.device_path = camera.path
        self.stream.width = width
        self.stream.height = height
        self.stream.interval = interval
        self.stream.endpoints = stream_endpoints
        self.stream.encode_type = encode_type
        self.stream.stream_type = stream_type
        self.stream.configured = True

    def add_control_from_option(self, option_name: str, default_value: Any, control_type: ControlTypeEnum, max_value: float = 0, min_value: float = 0, step: float = 0):
        try:
            option = self._options[option_name]
            value = int(option.get_value())
            self.controls.insert(0, Control(
                -self._id_counter, option.name, value, ControlFlags(
                    default_value, max_value, min_value, step, control_type
                )
            ))
            self._id_counter += 1
        except AttributeError:
            logging.error(f'Unknown attribute: {self.__class__.__name__}._options[{option_name}]')
            logging.error('Failed to add option to controls list.')

    def start_stream(self):
        self.stream_runner.start()

    def load_settings(self, saved_device: SavedDevice):
        logging.info(self._fmt_log('Loading device settings'))

        for control in saved_device.controls:
            try:
                self.set_pu(control.control_id, control.value)
            except:
                continue

        self.configure_stream(saved_device.stream.encode_type,
                              saved_device.stream.width,
                              saved_device.stream.height,
                              saved_device.stream.interval,
                              saved_device.stream.stream_type,
                              saved_device.stream.endpoints)
        self.stream.configured = saved_device.stream.configured
        self.nickname = saved_device.nickname
        if self.stream.configured:
            self.start_stream()

    def unconfigure_stream(self):
        # for stream in self.stream_runner.streams:
        #     stream.configured = False
        self.stream.configured = False
        self.stream_runner.stop()

        logging.info(self._fmt_log(f'Stream stopped'))

    def get_pu(self, control_id: int):
        control = self.v4l2_device.controls[control_id]
        return control.value

    def set_pu(self, control_id: int, value: int):
        if control_id < 0:
            # DWE control
            for control in self.controls:
                if control.control_id == control_id:
                    control.value = value
                    for option_name in self._options:
                        if self._options[option_name].name == control.name:
                            self.set_option(option_name, value)
                            return

        control = self.v4l2_device.controls[control_id]
        logging.info(self._fmt_log(f'Setting UVC control - {control.name} to {value}'))
        try:
            control.value = value
        except AttributeError:
            pass
        for ctrl in self.controls:
            if ctrl.control_id == control_id:
                ctrl.value = value

    # get an option
    def get_option(self, opt: str) -> Any:
        if opt in self._options:
            return self._options[opt].get_value()
        return None

    # set an option
    def set_option(self, opt: str, value: Any):
        logging.info(self._fmt_log(f'Setting option - {opt} to {value}'))
        if opt in self._options:
            return self._options[opt].set_value(value)
        return None
    
    def _emit_device_changed(self):
        self.emit('device_changed', self.bus_info)

    def _fmt_log(self, message: str) -> str:
        return f'{self.bus_info} - {message}'
