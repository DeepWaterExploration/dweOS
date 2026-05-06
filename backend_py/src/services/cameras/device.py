"""
device.py

Base class for camera device management
Handles v4l2 device finding, uvc controls, stream configuration,
and device settings management
"""

import contextlib
import fcntl
import logging
import struct
import time
from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any

import event_emitter as events
from linuxpy.video import device
from pydantic.v1 import NoneBytes

from . import v4l2
from . import xu_controls as xu
from .camera_helper.camera_helper_loader import camera_helper
from .enumeration import DeviceInfo
from .pydantic_schemas import (
    ControlFlagsModel,
    ControlModel,
    ControlTypeEnum,
    DeviceType,
    FormatSizeModel,
    FrameDropStats,
    IntervalModel,
    MenuItemModel,
    StreamEncodeTypeEnum,
    StreamEndpointModel,
    StreamTypeEnum,
    V4LControlTypeEnum,
)
from .saved_pydantic_schemas import SavedDeviceModel
from .stream_runner import Stream, StreamRunner
from .stream_utils import fourcc2s, string_to_stream_encode_type

PID_VIDS = {
    "exploreHD": {"VID": 0xC45, "PID": 0x6366, "device_type": DeviceType.EXPLOREHD},
    "stellarHD: Leader": {
        "VID": 0xC45,
        "PID": 0x6367,
        "device_type": DeviceType.STELLARHD_LEADER,
    },
    "stellarHD: Follower": {
        "VID": 0xC45,
        "PID": 0x6368,
        "device_type": DeviceType.STELLARHD_FOLLOWER,
    },
    "exploreHD ": {"VID": 0x3961, "PID": 0x2100, "device_type": DeviceType.EXPLOREHD},
    "exploreHD Heavy": {
        "VID": 0x3961,
        "PID": 0x2200,
        "device_type": DeviceType.EXPLOREHD,
    },
    "exploreHD Heavy (AQ)": {
        "VID": 0x3961,
        "PID": 0x2210,
        "device_type": DeviceType.EXPLOREHD,
    },
    "stellarHD Elite (AQ-L)": {
        "VID": 0x3961,
        "PID": 0x1211,
        "device_type": DeviceType.STELLARHD_LEADER,
    },
    "stellarHD Elite (AQ-F)": {
        "VID": 0x3961,
        "PID": 0x1212,
        "device_type": DeviceType.STELLARHD_FOLLOWER,
    },
    "stellarHD Elite (L)": {
        "VID": 0x3961,
        "PID": 0x1201,
        "device_type": DeviceType.STELLARHD_LEADER,
    },
    "stellarHD Elite (F)": {
        "VID": 0x3961,
        "PID": 0x1202,
        "device_type": DeviceType.STELLARHD_FOLLOWER,
    },
    "stellarHD (AQ-L)": {
        "VID": 0x3961,
        "PID": 0x1111,
        "device_type": DeviceType.STELLARHD_LEADER,
    },
    "stellarHD (AQ-F)": {
        "VID": 0x3961,
        "PID": 0x1112,
        "device_type": DeviceType.STELLARHD_FOLLOWER,
    },
    "stellarHD (L)": {
        "VID": 0x3961,
        "PID": 0x1101,
        "device_type": DeviceType.STELLARHD_LEADER,
    },
    "stellarHD (F)": {
        "VID": 0x3961,
        "PID": 0x1102,
        "device_type": DeviceType.STELLARHD_FOLLOWER,
    },
    "explore3D (Left)": {
        "VID": 0x3961,
        "PID": 0x3112,
        "device_type": DeviceType.STELLARHD_FOLLOWER,
    },
    "explore3D (Right)": {
        "VID": 0x3961,
        "PID": 0x3111,
        "device_type": DeviceType.STELLARHD_LEADER,
    },
}


def lookup_pid_vid(vid: int, pid: int) -> tuple[str, DeviceType] | tuple[None, None]:
    for name in PID_VIDS:
        dev = PID_VIDS[name]
        if dev["VID"] == vid and dev["PID"] == pid:
            return (name, DeviceType(dev["device_type"]))
    return (None, None)


class Camera:
    """
    Camera base class
    """

    def __init__(self, path: str) -> None:
        self.path = path
        self._file_object = open(path)  # noqa: SIM115
        self._fd = self._file_object.fileno()  # get the file descriptor
        self._get_formats()

    def close(self) -> None:
        self._file_object.close()

    # uvc_set_ctrl function defined in uvc_functions.c
    def uvc_set_ctrl(self, unit: int, ctrl: int, data: bytes, size: int) -> int:
        return camera_helper.uvc_set_ctrl(self._fd, unit, ctrl, data, size)

    # uvc_get_ctrl function defined in uvc_functions.c
    def uvc_get_ctrl(self, unit: int, ctrl: int, data: bytes, size: int) -> int:
        return camera_helper.uvc_get_ctrl(self._fd, unit, ctrl, data, size)

    def has_format(self, pixformat: str) -> bool:
        return pixformat in self.formats

    def _get_formats(self) -> None:
        self.formats: dict[str, list[FormatSizeModel]] = {}
        for i in range(1000):
            v4l2_fmt = v4l2.v4l2_fmtdesc()
            v4l2_fmt.index = i
            v4l2_fmt.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
            try:
                fcntl.ioctl(self._fd, v4l2.VIDIOC_ENUM_FMT, v4l2_fmt)
            except OSError:
                break

            format_sizes = []
            for j in range(1000):
                frmsize = v4l2.v4l2_frmsizeenum()
                frmsize.index = j
                frmsize.pixel_format = v4l2_fmt.pixelformat
                try:
                    fcntl.ioctl(self._fd, v4l2.VIDIOC_ENUM_FRAMESIZES, frmsize)
                except OSError:
                    break
                if frmsize.type == v4l2.V4L2_FRMSIZE_TYPE_DISCRETE:
                    format_size = FormatSizeModel(
                        width=frmsize.discrete.width,
                        height=frmsize.discrete.height,
                        intervals=[],
                    )
                    for k in range(1000):
                        frmival = v4l2.v4l2_frmivalenum()
                        frmival.index = k
                        frmival.pixel_format = v4l2_fmt.pixelformat
                        frmival.width = frmsize.discrete.width
                        frmival.height = frmsize.discrete.height
                        try:
                            fcntl.ioctl(
                                self._fd, v4l2.VIDIOC_ENUM_FRAMEINTERVALS, frmival
                            )
                        except OSError:  # This is expected and/or possible
                            break
                        if frmival.type == v4l2.V4L2_FRMIVAL_TYPE_DISCRETE:
                            format_size.intervals.append(
                                IntervalModel(
                                    numerator=frmival.discrete.numerator,
                                    denominator=frmival.discrete.denominator,
                                )
                            )
                    format_sizes.append(format_size)
            self.formats[fourcc2s(v4l2_fmt.pixelformat)] = format_sizes


class BaseOption(ABC):
    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    def get_value(self) -> Any:
        pass

    @abstractmethod
    def set_value(self, value) -> NoneBytes:
        pass


# Note: SHD version is asymmetric from this, despite being functionally similar.
# One will need to be moved to match the other for maintainability
# I prefer SHD version, because logic in the option class is not ideal - Brandon
class Option(BaseOption):
    """
    EHD Option Class
    """

    def __init__(
        self,
        camera: Camera,
        fmt: str,
        unit: xu.Unit,
        ctrl: xu.Selector,
        command: xu.Command,
        name: str,
        conversion_func_set: Callable[[Any], list | Any] = lambda val: val,
        conversion_func_get: Callable[[list | Any], Any] = lambda val: val,
        size=11,
    ) -> None:
        super().__init__(name)

        self._camera = camera
        self._fmt = fmt
        self._conversion_func_set = conversion_func_set
        self._conversion_func_get = conversion_func_get

        self._unit = unit
        self._ctrl = ctrl
        self._command = command
        self._size = size
        self._data = b"\x00" * size

    # get the control value(s)
    def get_value_raw(self) -> tuple[Any, ...] | Any:
        self._get_ctrl()
        values = self._unpack(self._fmt)
        self._clear()
        # all cases will basically be this, but otherwise this will still work
        if len(values) == 1:
            return values[0]
        return values

    # set the control value
    def set_value_raw(self, *arg: list) -> None:
        self._pack(self._fmt, *arg)
        self._set_ctrl()
        self._clear()

    def set_value(self, value) -> None:
        converted = self._conversion_func_set(value)
        if isinstance(converted, list):
            self.set_value_raw(*converted)
        else:
            self.set_value_raw(converted)

    def get_value(self) -> list | Any:
        return self._conversion_func_get(self.get_value_raw())

    # pack data to internal buffer
    def _pack(self, fmt: str, *arg: list) -> None:
        data = struct.pack(fmt, *arg)
        # make sure the data is of the right length
        self._data = data + bytearray(self._size - len(data))

    # unpack data from internal buffer
    def _unpack(self, fmt: str) -> tuple[Any, ...]:
        return struct.unpack_from(fmt, self._data)

    def _set_ctrl(self) -> None:
        data = bytearray(self._size)
        data[0] = xu.DWE_DEVICE_TAG
        data[1] = self._command.value

        # Switch command
        self._camera.uvc_set_ctrl(
            self._unit.value, self._ctrl.value, bytes(data), self._size
        )

        self._camera.uvc_set_ctrl(
            self._unit.value, self._ctrl.value, self._data, self._size
        )

    def _get_ctrl(self) -> None:
        data = bytearray(self._size)
        data[0] = xu.DWE_DEVICE_TAG
        data[1] = self._command.value
        self._data = bytes(self._size)
        # Switch command
        self._camera.uvc_set_ctrl(
            self._unit.value, self._ctrl.value, bytes(data), self._size
        )

        self._camera.uvc_get_ctrl(
            self._unit.value, self._ctrl.value, self._data, self._size
        )

    def _clear(self) -> None:
        self._data = b"\x00" * self._size


class Device(events.EventEmitter):
    def __init__(self, device_info: DeviceInfo) -> None:
        super().__init__()

        self.cameras: list[Camera] = []
        for device_path in device_info.device_paths:
            self.cameras.append(Camera(device_path))

        self.logger = logging.getLogger("dwe_os_2.cameras.Device")
        self.logger.setLevel(logging.DEBUG)

        self.device_info = device_info
        self.vid = device_info.vid
        self.pid = device_info.pid
        (self.name, self.device_type) = lookup_pid_vid(self.vid, self.pid)
        if self.name is not None:
            self.manufacturer = "DeepWater Exploration Inc."
        else:
            # Device is not DWE
            return
        self.bus_info = device_info.bus_info
        self.nickname = ""
        self.stream = Stream()

        self.frame_stats = FrameDropStats(num_drops=0)

        # each device has a streamrunner, but not all of them are used if
        # they are a follower (shd)
        self.stream_runner = StreamRunner(self.stream)
        self.stream_runner.on("frame_drop", self._update_drop_stats)

        for camera in self.cameras:
            for encoding in camera.formats:
                encode_type = string_to_stream_encode_type(encoding)
                if encode_type != StreamEncodeTypeEnum.NONE:
                    self.stream.encode_type = encode_type
                    # The highest resolution is the default
                    # Most users will use this, however it is available to be changed
                    # in the frontend
                    self.stream.width = camera.formats[encoding][0].width
                    self.stream.height = camera.formats[encoding][0].height
                    self.stream.interval.denominator = (
                        camera.formats[encoding][0].intervals[0].denominator
                    )
                    self.stream.interval.numerator = (
                        camera.formats[encoding][0].intervals[0].numerator
                    )
                    break

        self.v4l2_device = device.Device(self.cameras[0].path)  # for control purposes
        self.v4l2_device.open()

        # This must be configured by the implementing class
        self._options: dict[str, BaseOption] = self._get_options()

        # list the controls and store them
        self.controls = []

        self._id_counter = 1

        self._get_controls()

    def _update_drop_stats(self) -> None:
        self.frame_stats.num_drops += 1
        self.emit("frame_stats")

    def _on_stream_error(self, err: str) -> None:
        self.logger.error(err)
        # TODO

    def _get_options(self) -> dict[str, BaseOption]:
        return {}

    def _get_controls(self) -> None:
        # fd = self.cameras[0]._fd
        self.controls: list[ControlModel] = []

        if not self.v4l2_device.controls:
            # TODO: If this happens, should delete the device, instead of just
            # potentially dying (will never happen anyway)
            self.logger.error(
                "v4l2_device.controls == None. Unable to get controls. "
                "This might be fatal."
            )
            return

        for ctrl in self.v4l2_device.controls.values():
            internal_enum = V4LControlTypeEnum(ctrl.type)
            control_type = ControlTypeEnum(internal_enum.name)

            max_value = 0
            min_value = 0
            step = 0

            # FIXME: Should not surpress, should instead log this and use it

            with contextlib.suppress(BaseException):
                max_value = ctrl.maximum

            with contextlib.suppress(BaseException):
                min_value = ctrl.minimum

            with contextlib.suppress(BaseException):
                step = ctrl.step

            default_value = ctrl._info.default_value

            menu: list[MenuItemModel] = []
            match control_type:
                case ControlTypeEnum.MENU:
                    for i in ctrl.data:
                        menu_item = ctrl.data[i]
                        menu.append(MenuItemModel(index=i, name=menu_item))

            flags = ControlFlagsModel(
                default_value=default_value,
                max_value=max_value,
                min_value=min_value,
                step=step,
                control_type=control_type,
                menu=menu,
            )
            control = ControlModel(
                control_id=ctrl.id, name=ctrl.name, value=ctrl.value, flags=flags
            )

            self.controls.append(control)

    def find_camera_with_format(self, fmt: str) -> Camera | None:
        for cam in self.cameras:
            if cam.has_format(fmt):
                return cam
        return None

    def configure_stream(
        self,
        encode_type: StreamEncodeTypeEnum,
        width: int,
        height: int,
        interval: IntervalModel,
        stream_type: StreamTypeEnum,
        stream_endpoints: list[StreamEndpointModel] | None = None,
    ) -> None:
        if stream_endpoints is None:
            stream_endpoints = []

        self.logger.info(self._fmt_log("Configuring stream"))

        camera: Camera | None = None
        match encode_type:
            case StreamEncodeTypeEnum.H264:
                camera = self.find_camera_with_format("H264")
            case StreamEncodeTypeEnum.MJPG:
                camera = self.find_camera_with_format("MJPG")
            case StreamEncodeTypeEnum.SOFTWARE_H264:
                camera = self.find_camera_with_format("MJPG")
            case _:
                pass

        if not camera:
            self.logger.warning(
                "Attempting to select incompatible encoding type. "
                "This is undefined behavior."
            )
            return

        self.stream.device_path = camera.path
        self.stream.width = width
        self.stream.height = height
        self.stream.interval = interval
        self.stream.endpoints = stream_endpoints
        self.stream.encode_type = encode_type
        self.stream.stream_type = stream_type

        # Update the pwm frequency with the new fps
        self.emit("pwm_frequency", self.stream.interval.denominator)

    def add_control_from_option(
        self,
        option_name: str,
        default_value: Any,
        control_type: ControlTypeEnum,
        max_value: float = 0,
        min_value: float = 0,
        step: float = 0,
    ) -> None:
        try:
            option = self._options[option_name]
            value = int(option.get_value())
            self.controls.insert(
                0,
                ControlModel(
                    control_id=-self._id_counter,
                    name=option.name,
                    value=value,
                    flags=ControlFlagsModel(
                        default_value=default_value,
                        max_value=max_value,
                        min_value=min_value,
                        step=step,
                        control_type=control_type,
                    ),
                ),
            )
            self._id_counter += 1
        except AttributeError:
            import traceback

            traceback.print_exc()
            self.logger.error(
                f"Unknown attribute: {self.__class__.__name__}._options[{option_name}]"
            )
            self.logger.error("Failed to add option to controls list.")

    def start_stream(self) -> None:
        self.stream.enabled = True
        self.stream_runner.start()

        self.frame_stats = FrameDropStats(num_drops=0)
        self.emit("frame_stats", self.frame_stats)

    def stop_stream(self) -> None:
        self.stream.enabled = False
        self.stream_runner.stop()

    def close(self) -> None:
        """
        Cleanup resources of the device
        """
        self.stream_runner.stop()
        for camera in self.cameras:
            camera.close()
        self.v4l2_device.close()

    def load_settings(self, saved_device: SavedDeviceModel) -> None:
        self.logger.info(self._fmt_log("Loading device settings"))

        for control in saved_device.controls:
            # CHECK: There used to be a try catch here..
            self.set_pu(control.control_id, control.value)

        self.configure_stream(
            saved_device.stream.encode_type,
            saved_device.stream.width,
            saved_device.stream.height,
            saved_device.stream.interval,
            saved_device.stream.stream_type,
            saved_device.stream.endpoints,
        )
        self.stream.enabled = saved_device.stream.enabled
        self.nickname = saved_device.nickname
        if self.stream.enabled:
            self.start_stream()

    def unconfigure_stream(self) -> None:
        self.stream_runner.stop()
        self.logger.info(self._fmt_log("Stream stopped"))

    def get_pu(self, control_id: int) -> int | None:
        if not self.v4l2_device.controls:
            self.logger.error("v4l2_device.controls == None. Unable to get pu")
            return None
        control = self.v4l2_device.controls[control_id]
        return control.value

    def set_pu(self, control_id: int, value: int | float) -> bool | None:
        if not self.v4l2_device.controls:
            self.logger.critical("v4l2_device.controls is None; unable to run set_pu")
            return

        if control_id < 0:
            # DWE control
            for control in self.controls:
                if control.control_id == control_id:
                    control.value = value
                    for option_name in self._options:
                        if self._options[option_name].name == control.name:
                            self.set_option(option_name, value)
                            return
            return  # in case the id does not exist in controls

        control = self.v4l2_device.controls[control_id]

        try:
            control.value = value
        except (AttributeError, PermissionError) as e:
            self.logger.debug(f"Error setting control value: {e}")
            return False
        for ctrl in self.controls:
            if ctrl.control_id == control_id:
                ctrl.value = value
                break

        return True

    # get an option
    def get_option(self, opt: str) -> Any:
        if opt in self._options:
            return self._options[opt].get_value()
        return None

    # set an option
    def set_option(self, opt: str, value: Any) -> None:
        # self.logger.debug(self._fmt_log(f"Setting option - {opt} to {value}"))
        if opt in self._options:
            self._options[opt].set_value(value)

    def _fmt_log(self, message: str) -> str:
        return f"{self.bus_info} - {message}"
