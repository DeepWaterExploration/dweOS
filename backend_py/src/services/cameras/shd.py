from .saved_pydantic_schemas import SavedDeviceModel
from .enumeration import DeviceInfo
from .device import Device, BaseOption, ControlTypeEnum, StreamEncodeTypeEnum
from typing import Dict, List

from event_emitter import EventEmitter


class StellarOption(BaseOption, EventEmitter):
    def __init__(self, name: str, value):
        BaseOption.__init__(self, name)
        EventEmitter.__init__(self)
        self.value = value

    def set_value(self, value):
        self.value = value
        self.emit("value_changed")

    def get_value(self):
        return self.value


class SHDDevice(Device):
    """
    Class for stellarHD devices
    """

    def __init__(self, device_info: DeviceInfo) -> None:
        super().__init__(device_info)

        # Copy MJPEG over to Software H264, since they are the same thing
        mjpg_camera = self.find_camera_with_format("MJPG")
        mjpg_camera.formats["SOFTWARE_H264"] = mjpg_camera.formats["MJPG"]

        # List of followers
        self.followers: List[str] = []
        # Is true if it is managed, false otherwise
        self.is_managed = False

        self.add_control_from_option(
            "bitrate", 5, ControlTypeEnum.INTEGER, 10, 0.1, 0.1
        )

    def add_follower(self, device: 'SHDDevice'):
        if device.bus_info in self.followers:
            self.logger.info(
                'Trying to add follower to device that already has this device as a follower. Ignoring request.')
            return
        self.logger.info('Adding follower')
        self.followers.append(device.bus_info)
        # Make the follower managed
        device.set_is_managed(True)
        # Append the new device stream
        self.stream_runner.streams.append(device.stream)

        if self.stream.enabled:
            self.start_stream()

    def remove_follower(self, device: 'SHDDevice'):
        if not device.bus_info in self.followers:
            self.logger.info(
                "Cannot remove follower from device that does not contain it.")
            return
        # Reconstruct the list without the follower
        self.followers = [
            dev for dev in self.followers if dev != device.bus_info]
        self.stream_runner.streams.remove(device.stream)
        device.set_is_managed(False)

        self.logger.info('Removing follower')

        if self.stream.enabled:
            self.start_stream()

    def set_is_managed(self, is_managed: bool):
        self.is_managed = is_managed

        # Configure stream if needbe
        if not is_managed:
            if self.stream.enabled:
                self.start_stream()

    def _get_options(self) -> Dict[str, StellarOption]:
        options = {}

        self.bitrate_option = StellarOption(
            "Software H.264 Bitrate", 5)  # 5 mpbs

        def update_bitrate():
            if self.stream.enabled and self.stream.encode_type == StreamEncodeTypeEnum.SOFTWARE_H264:
                self.start_stream()

        # Only restart if it's being used
        self.bitrate_option.on(
            "value_changed",
            update_bitrate,
        )

        options["bitrate"] = self.bitrate_option

        return options

    def load_settings(self, saved_device: SavedDeviceModel):
        return super().load_settings(saved_device)

    def start_stream(self):
        if self.is_managed:
            self.logger.warning(
                f"{self.bus_info if not self.nickname else self.nickname}: Cannot start stream that is managed.")
            return

        # mbps to kbit/sec
        self.stream.software_h264_bitrate = int(
            self.bitrate_option.get_value() * 1000
        )

        super().start_stream()

    def unconfigure_stream(self):
        # remove leader when unconfiguring
        if self.leader_device:
            self.remove_leader()
        return super().unconfigure_stream()
