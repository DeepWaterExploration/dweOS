"""
shd.py

Adds additional features to stellarHD devices
"""

from ..device import Device, DeviceMetadata
from ..video4linux import DeviceInfo
from .asic_interface import ASICInterface
from .options import (
    AutoExposureOption,
    GainOption,
    ShutterSpeedOption,
    StrobeWidthOption,
    HardwareBitrateOption,
)


class SHDDevice(Device):
    """
    Class for stellarHD devices
    """

    def __init__(
        self, device_info: DeviceInfo, device_metadata: DeviceMetadata
    ) -> None:
        # Specifies if SHD device is Stellar Pro
        # For now, we can just assume this is true.
        # Warn user to not use settings on incompatible devices?
        self.is_pro = True

        super().__init__(device_info, device_metadata)

        # Copy MJPEG over to Software H264, since they are the same thing
        mjpg_camera = self.find_camera_with_format("MJPG")
        if not mjpg_camera:
            raise RuntimeError(
                "Failed to initialize stellarHD: MJPG camera format not found."
            )
        mjpg_camera.formats["SOFTWARE_H264"] = mjpg_camera.formats["MJPG"]

        # List of followers
        # Zero inherent truth to the existence of these devices
        self.followers: list[str] = []

        # These exist
        self.follower_devices: list[SHDDevice] = []

        # Is true if it is managed, false otherwise
        self.is_managed = False

        # ASIC Interface for low level register read/writes
        self.asic_interface = ASICInterface(self.cameras[0])

        # options

        self._options = {
            "auto_exposure": AutoExposureOption(self.asic_interface),
            "shutter": ShutterSpeedOption(self.asic_interface),
            "iso": GainOption(self.asic_interface),
            "strobe_width": StrobeWidthOption(self.asic_interface),
            "hw_bitrate": HardwareBitrateOption(self.asic_interface),
        }

        self.add_control_from_option("auto_exposure")
        self.add_control_from_option("shutter")
        self.add_control_from_option("iso")
        self.add_control_from_option("strobe_width")
        self.add_control_from_option("hw_bitrate")

    def add_follower(self, device: "SHDDevice") -> None:
        if device.bus_info in self.followers:
            self.logger.info(
                "Trying to add follower to device that already has this device as a "
                "follower. Ignoring request."
            )
            return

        if device.bus_info == self.bus_info:
            self.logger.info(
                "Trying to add follower of same bus id as self. This is not allowed."
            )
            return

        self.logger.info("Adding follower")

        # For saving purposes
        self.followers.append(device.bus_info)

        # This is the real addition
        self.follower_devices.append(device)

        # Make the follower managed
        device.set_is_managed(True)

        if self.stream.enabled:
            self.start_stream()

    def remove_follower(self, device: "SHDDevice") -> None:
        if device.bus_info not in self.followers:
            self.logger.info(
                "Cannot remove follower from device that does not contain it."
            )
            return
        # Reconstruct the list without the follower
        self.followers = [dev for dev in self.followers if dev != device.bus_info]
        self.follower_devices = [
            dev for dev in self.follower_devices if dev.bus_info != device.bus_info
        ]

        device.set_is_managed(False)

        self.logger.info("Removing follower")

        if self.stream.enabled:
            self.start_stream()

    def remove_manual(self, follower_bus_info: str) -> None:
        """
        This should be called in the case the follower no longer exists
        """
        self.followers.remove(follower_bus_info)

    def set_is_managed(self, is_managed: bool) -> None:
        self.is_managed = is_managed

        # Configure stream if needbe
        if not is_managed and self.stream.enabled:
            self.start_stream()

    def start_stream(self) -> None:
        if self.is_managed:
            self.logger.warning(
                f"{self.bus_info}: Cannot start stream that is managed."
            )
            return

        self.stream_runner.streams = [self.stream]

        for follower_device in self.follower_devices:
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
        for follower in self.follower_devices:
            follower.reapply_sensor_config()

    def reapply_sensor_config(self) -> None:
        self.logger.info("Reapplying options after starting stream.")

        # Reapply options after starting stream
        for _option_name, option in self._options.items():
            option.set_value(option.get_value())
