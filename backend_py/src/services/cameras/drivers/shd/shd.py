"""
shd.py

Adds additional features to stellarHD devices
"""

from backend_py.src.models import DeviceType

from ..device import Device, DeviceMetadata
from ..video4linux import DeviceInfo
from .asic_interface import ASICInterface
from .options import (
    AutoExposureOption,
    BaseOption,
    GainOption,
    HardwareBitrateOption,
    ShutterSpeedOption,
    StrobeWidthOption,
)


class SHDDevice(Device):
    """
    Class for stellarHD devices
    """

    def __init__(
        self, device_info: DeviceInfo, device_metadata: DeviceMetadata
    ) -> None:
        super().__init__(device_info, device_metadata)

        # Copy MJPEG over to Software H264, since they are the same thing
        mjpg_camera = self.find_camera_with_format("MJPG")
        if not mjpg_camera:
            raise RuntimeError(
                "Failed to initialize stellarHD: MJPG camera format not found."
            )
        mjpg_camera.formats["SOFTWARE_H264"] = mjpg_camera.formats["MJPG"]

        # List of followers
        self.followers: list[str] = []

        # List of follower devices
        self.follower_devices: dict[str, SHDDevice] = {}

        # Is true if it is managed, false otherwise
        self.is_managed = False

        # Should directly correspond with self.is_managed
        self.leader_device: SHDDevice | None = None

        # ASIC Interface for low level register read/writes
        self.asic_interface = ASICInterface(self.cameras[0])

        # options
        options: dict[str, BaseOption] = {
            "auto_exposure": AutoExposureOption(self.asic_interface),
            "shutter": ShutterSpeedOption(self.asic_interface),
            "iso": GainOption(self.asic_interface),
            "strobe_width": StrobeWidthOption(self.asic_interface),
            "hw_bitrate": HardwareBitrateOption(self.asic_interface),
        }

        self.add_controls_from_options(options)

    @property
    def can_lead(self) -> bool:
        return True

    @property
    def can_follow(self) -> bool:
        return self.device_type == DeviceType.STELLARHD_FOLLOWER

    def on_external_stream_started(self) -> None:
        # Override method
        # We reapply assuming the stream has already been started
        self.reapply_sensor_config()

        # We then want to apply the config from the camera
        mjpeg_camera = self.find_camera_with_format("MJPG")
        if mjpeg_camera:
            current_format = mjpeg_camera.get_current_format()
            self.logger.info(f"Current format: {current_format}")

            # Updates required so the UI knows the current format
            self.stream.width = current_format.width
            self.stream.height = current_format.height
            self.stream.interval = current_format.interval

            for follower in self.follower_devices.values():
                follower.stream.width = current_format.width
                follower.stream.height = current_format.height
                follower.stream.interval = current_format.interval

                # Bad performance due to the lack of dict
                for control in self.controls:
                    # from_save so light stays off
                    follower.set_pu(control.control_id, control.value, from_save=True)

            self.emit("updated")  # Trigger UI update

    def on_external_managed(self) -> None:
        # Remove all the followers
        # The manager will handle adding them
        for follower in list(self.follower_devices.keys()):
            self.remove_follower(self.follower_devices[follower])

        # Remove self as follower
        if self.is_managed and self.leader_device:
            self.leader_device.remove_follower(self)
            # We could save (see notes)

        super().on_external_managed()

    def add_follower(self, device: "SHDDevice", external=False) -> bool:
        # If an external program is controlling it, it's ok
        if not external and device.is_externally_managed:
            self.logger.info("Cannot add a follower to an externally managed device")
            return False

        # This is unrelated to the externally managed changes and should propagate
        # to main
        if device.is_managed:
            self.logger.info("Cannot add a follower to an already managed device")
            return False

        # CHANGED: only check if it's in follower devices not the follower list
        if device.bus_info in self.follower_devices:
            self.logger.info(
                "Trying to add follower to device that already has this device as a "
                "follower. Ignoring request."
            )
            return False

        if device.bus_info == self.bus_info:
            self.logger.info(
                "Trying to add follower of same bus id as self. This is not allowed."
            )
            return False

        self.logger.info("Adding follower")

        # For saving purposes
        if device.bus_info not in self.followers:
            self.followers.append(device.bus_info)

        # This is the real addition
        self.follower_devices[device.bus_info] = device

        # Make the follower managed
        device.set_leader(self)

        # Stop the follower's stream
        if device.stream.enabled:
            device.stop_stream()

        device.stream.endpoints = []

        if self.stream.enabled:
            self.start_stream()

        if external:
            self.emit("updated")

        return True

    def remove_follower(self, device: "SHDDevice") -> bool:
        if self.is_externally_managed:
            self.logger.info(
                "Cannot remove a follower from an externally managed device"
            )
            return False

        if device.bus_info not in self.followers:
            self.logger.info(
                "Cannot remove follower from device that does not contain it."
            )
            return False
        # Reconstruct the list without the follower
        # if persist:
        #     self.followers = [dev for dev in self.followers if dev != device.bus_info]
        self.followers = [dev for dev in self.followers if dev != device.bus_info]
        self.follower_devices.pop(device.bus_info)

        device.remove_leader()

        self.logger.info("Removing follower")

        if self.stream.enabled:
            self.start_stream()

        return True

    def remove_manual(self, follower_bus_info: str) -> None:
        """
        This should be called in the case the follower no longer exists
        """
        if follower_bus_info in self.followers:
            self.followers.remove(follower_bus_info)

    def set_leader(self, leader: "SHDDevice") -> None:
        self.is_managed = True
        self.leader_device = leader

    def remove_leader(self) -> None:
        self.is_managed = False
        self.leader_device = None

    def start_stream(self) -> None:
        if self.is_managed:
            self.logger.warning(
                f"{self.bus_info}: Cannot start stream that is managed."
            )
            return

        self.stream_runner.streams = [self.stream]

        for follower_device in self.follower_devices.values():
            # A not so hacky fix (very clever :]) to ensure the stream's device_path is
            # set
            follower_device.configure_stream(
                self.stream.encode_type,
                self.stream.width,
                self.stream.height,
                self.stream.interval,
                self.stream.stream_type,
                [],
            )

            # Append the new device stream
            self.stream_runner.streams.append(follower_device.stream)

        # mbps to kbit/sec
        # self.stream.software_h264_bitrate =
        # int(self.bitrate_option.get_value() * 1000)

        super().start_stream()

        self.reapply_sensor_config()
        for follower in self.follower_devices.values():
            follower.reapply_sensor_config()

    def remove_device(self) -> None:
        # Unplugging a device makes it too complicated to handle its follower stream,
        # so we just remove the follower and revert it to a normal stream
        for follower in self.follower_devices.values():
            follower.remove_leader()

        # If it's a follower device, we need to remove ourselves from the leader
        if self.is_managed and self.leader_device:
            self.leader_device.remove_follower(self)

    def reapply_sensor_config(self) -> None:
        self.logger.info("Reapplying options after starting stream.")

        # This is bad
        self.set_pu(-4, 0)

        for option_name in self._options:
            option = self._options[option_name]
            option.set_value(option.get_value())
