import logging

from .saved_pydantic_schemas import SavedDeviceModel
from .enumeration import DeviceInfo
from .device import Device, BaseOption, ControlTypeEnum, StreamEncodeTypeEnum
from typing import Dict

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

    def __init__(self, device_info: DeviceInfo, is_leader=True) -> None:
        super().__init__(device_info)
        self.is_leader = is_leader
        self.leader: str = None
        self.leader_device: "SHDDevice" = None

        # Copy MJPEG over to Software H264, since they are the same thing
        mjpg_camera = self.find_camera_with_format("MJPG")
        mjpg_camera.formats["SOFTWARE_H264"] = mjpg_camera.formats["MJPG"]

        # For backend internal use only
        self.follower: str = None

        self.add_control_from_option(
            "bitrate", 5, ControlTypeEnum.INTEGER, 10, 0.1, 0.1
        )

    def _get_options(self) -> Dict[str, StellarOption]:
        options = {}

        self.bitrate_option = StellarOption("Software H.264 Bitrate", 5)  # 5 mpbs

        # Only restart if it's being used
        self.bitrate_option.on(
            "value_changed",
            lambda: (
                self.start_stream()
                if self.stream.encode_type == StreamEncodeTypeEnum.SOFTWARE_H264
                else None
            ),
        )

        options["bitrate"] = self.bitrate_option

        return options

    def set_leader(self, leader: "SHDDevice"):
        # We love forward references
        if not leader.is_leader:
            logging.warning(
                "Attempting to add follower SHD as a leader. This is undefined behavior and will not be permitted."
            )
            return
        if leader.follower:
            logging.warning(
                "Attempted to add follower to SHD with follower. This is undefined behavior and will not be permitted."
            )
            return
        if self.leader_device:
            logging.info(
                self._fmt_log(
                    "Setting leader of device with leader. Removing previous leader."
                )
            )
            self.remove_leader()
        self.leader_device = leader
        self.leader = leader.bus_info
        # remember to stop the stream because it is no longer managed by this device
        self.stream_runner.stop()
        if len(leader.stream_runner.streams) < 2:
            leader.stream_runner.streams.append(self.stream)
        else:
            leader.stream_runner.streams[1] = self.stream

        # restart leader's stream to now include this device
        leader.stream.configured = True
        leader.follower = self.bus_info
        leader.start_stream()

    def load_settings(self, saved_device: SavedDeviceModel):
        return super().load_settings(saved_device)

    def remove_leader(self):
        if not self.leader_device:
            logging.warning(
                "Attempting to remove leader from a device with no leader. This is undefined behavior and will not be permitted."
            )
            return
        try:
            self.leader_device.stream_runner.streams.remove(self.stream)
        except ValueError:
            logging.warning("Tried to remove stream from leader without a stream")
        # restart the leader device stream to take this device out of it
        if self.leader_device.stream_runner.started:
            self.leader_device.start_stream()
        self.leader_device.follower = None
        self.leader_device = None
        self.leader = None
        # start the stream if configured
        if self.stream.configured:
            self.stream_runner.start()

    def start_stream(self):
        if not self.is_leader:
            if self.leader:
                logging.info(
                    "Starting stream as a follower. This will start the leader's stream"
                )
                self.leader_device.start_stream()
                return

        self.stream.software_h264_bitrate = int(
            self.bitrate_option.get_value() * 1000
        )  # mbps to kbit/sec
        super().start_stream()

    def unconfigure_stream(self):
        # remove leader when unconfiguring
        if self.leader_device:
            self.remove_leader()
        return super().unconfigure_stream()
