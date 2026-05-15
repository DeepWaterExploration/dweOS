"""
device.py

Base class for camera device management
Handles v4l2 device finding, uvc controls, stream configuration,
and device settings management
"""

import contextlib
import logging
import threading
from typing import Any

import event_emitter as events
from linuxpy.video import device

from backend_py.src.models import (
    ControlFlagsModel,
    ControlModel,
    ControlTypeEnum,
    FrameDropStats,
    IntervalModel,
    MenuItemModel,
    SavedDeviceModel,
    StreamEncodeTypeEnum,
    StreamEndpointModel,
    StreamTypeEnum,
    V4LControlTypeEnum,
)

from ..stream_runner import Stream, StreamRunner
from ..stream_utils import string_to_stream_encode_type
from .options import BaseOption
from .registry import DeviceMetadata
from .video4linux import Camera
from .video4linux.enumeration import DeviceInfo


class Device(events.EventEmitter):
    def __init__(
        self, device_info: DeviceInfo, device_metadata: DeviceMetadata
    ) -> None:
        super().__init__()

        self.cameras: list[Camera] = []
        for device_path in device_info.device_paths:
            self.cameras.append(Camera(device_path))

        self.logger = logging.getLogger("dwe_os_2.cameras.Device")
        self.logger.setLevel(logging.DEBUG)

        # If this device has been constructed, we can assume the DeviceManager did
        # its job of only creating it if it's compatible.
        self.device_info = device_info
        self.vid = device_info.vid
        self.pid = device_info.pid
        self.bus_info = device_info.bus_info
        self.nickname = ""
        self.stream = Stream()

        # Grab the device metadata
        self.manufacturer = device_metadata.manufacturer
        self.name = device_metadata.name
        self.device_type = device_metadata.device_type

        # frame stats is touched by both the main thread and the capture thread
        self._frame_stats_lock = threading.Lock()
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
        self._options: dict[str, BaseOption] = {}

        # list the controls and store them
        self.controls = []

        self._id_counter = 1

        self._get_controls()

    def _update_drop_stats(self) -> None:
        with self._frame_stats_lock:
            self.frame_stats.num_drops += 1
        self.emit("frame_stats")

    def _on_stream_error(self, err: str) -> None:
        self.logger.error(err)
        # TODO

    def _get_options(self) -> dict[str, BaseOption]:
        return {}

    def _get_controls(self) -> None:
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

            # FIXME: Should not surpress, should instead log this and use it

            with contextlib.suppress(BaseException):
                max_value = ctrl.maximum

            with contextlib.suppress(BaseException):
                min_value = ctrl.minimum

            with contextlib.suppress(BaseException):
                step = ctrl.step

            # Can we access the default_value without using the private variable?
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
            # I know this looks scuffed, but we can't use the stream encode type,
            # because it does not directly map to the format
            # A utility function is not really useful
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
        # TODO: This should be on a command bus or something, not emitted from
        # the device like this
        self.emit("pwm_frequency", self.stream.interval.denominator)

    def add_control_from_option(self, option_name: str) -> None:
        try:
            option = self._options[option_name]
            value = option.get_value()
            self.controls.insert(
                0,
                ControlModel(
                    control_id=-self._id_counter,
                    name=option.name,
                    value=value,
                    flags=option.control_flags,
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

        with self._frame_stats_lock:
            self.frame_stats = FrameDropStats(num_drops=0)

        # FIXME: What is a better way to do this? An event bus could work,
        # especially since we are propagating this 3 levels up
        # For example: self.event_bus.emit("stream_started", self)
        self.emit("frame_stats")

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
            # This should never happen, because if the controls were not accessible,
            #  the device would not have been initialized properly,
            #  but we check just in case
            self.logger.error("v4l2_device.controls == None. Unable to get pu")
            return None
        control = self.v4l2_device.controls[control_id]
        return control.value

    def set_pu(self, control_id: int, value: int | float | bool) -> bool | None:
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
                            try:
                                self.set_option(option_name, value)
                                # self.logger.info(
                                #     f"Setting {control.name} to {control.value}"
                                # )
                            except TypeError as e:
                                # TODO: return this to caller (API)
                                self.logger.info(
                                    "Encountered error setting control: "
                                    f"{control.name} - {e}"
                                )
                                return False
                            return True
            return False  # in case the id does not exist in controls

        control = self.v4l2_device.controls[control_id]

        try:
            control.value = value
        except (AttributeError, PermissionError) as e:
            # Usually happens when the parameter can no longer be written to (disabled)
            self.logger.debug(f"Error setting control value ({control.name}): {e}")
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
