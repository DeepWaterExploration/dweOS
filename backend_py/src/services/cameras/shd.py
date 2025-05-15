from .saved_pydantic_schemas import SavedDeviceModel
from .enumeration import DeviceInfo
from .device import Device, BaseOption, ControlTypeEnum, StreamEncodeTypeEnum
from typing import Dict

from ..pwm.serial_pwm_controller import SerialPWMController
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

    def __init__(self, device_info: DeviceInfo, pwm_controller: SerialPWMController, is_leader=True) -> None:
        super().__init__(device_info, pwm_controller)
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

        self.bitrate_option = StellarOption(
            "Software H.264 Bitrate", 5)  # 5 mpbs

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
        # This is a hacky workaround to allow frame sync between two followers
        if not leader.is_leader:
            self.logger.warning(
                self._fmt_log(
                    "Forcing follower to be a leader. This may lead to undefined behavior if external sync is not present."
                )
            )
            # Promote the follower to leader role
            leader.is_leader = True

        if leader.follower:
            self.logger.warning(
                self._fmt_log(
                    "Attempted to add follower to SHD with existing follower. Overwriting existing follower."
                )
            )

        if self.leader_device:
            self.logger.info(
                self._fmt_log(
                    "Setting new leader for device with existing leader. Removing previous leader."
                )
            )
            self.remove_leader()

        self.leader_device = leader
        self.leader = leader.bus_info
        self.stream_runner.stop()

        if len(leader.stream_runner.streams) < 2:
            leader.stream_runner.streams.append(self.stream)
        else:
            leader.stream_runner.streams[1] = self.stream

        leader.stream.configured = True
        leader.follower = self.bus_info

        if leader.stream.enabled:
            leader.start_stream()

    def load_settings(self, saved_device: SavedDeviceModel):
        # self.is_leader = saved_device.is_leader
        return super().load_settings(saved_device)

    def remove_leader(self):
        if not self.leader_device:
            self.logger.warning(
                "Attempting to remove leader from a device with no leader. This is undefined behavior and will not be permitted."
            )
            return
        try:
            self.leader_device.stream_runner.streams.remove(self.stream)
        except ValueError:
            self.logger.warning(
                "Tried to remove stream from leader without a stream")

        self.logger.info(f'Removing leader from {self.bus_info}')

        self.leader_device.is_leader = False

        # restart the leader device stream to take this device out of it
        if self.leader_device.stream_runner.started:
            self.leader_device.start_stream()
        # TODO: FIX in UI end..?
        self.stream.enabled = self.leader_device.stream.enabled
        self.leader_device.follower = None
        self.leader_device = None
        self.leader = None
        # start the stream if enabled
        if self.stream.enabled:
            self.stream_runner.start()

    def start_stream(self):
        self.stream.software_h264_bitrate = int(
            self.bitrate_option.get_value() * 1000
        )

        if not self.is_leader:
            if self.leader:
                self.leader_device.start_stream()
                return

          # mbps to kbit/sec
        super().start_stream()

    def unconfigure_stream(self):
        # remove leader when unconfiguring
        if self.leader_device:
            self.remove_leader()
        return super().unconfigure_stream()
