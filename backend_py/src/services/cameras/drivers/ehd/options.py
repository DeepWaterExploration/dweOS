from typing import Any

from backend_py.src.models import ControlFlagsModel, ControlTypeEnum, H264Mode

from ..options import OptionDescriptor, XUOption
from ..video4linux import Camera
from ..xu import Command, Selector, Unit


class EHDBitrateOption(XUOption):
    """
    Option for setting the bitrate on exploreHD cameras.
    The bitrate is in megabits per second (Mbps)
    """

    def __init__(self, camera: Camera) -> None:
        option_descriptor = OptionDescriptor(
            unit=Unit.USR_ID,
            ctrl=Selector.USR_H264_CTRL,
            command=Command.H264_BITRATE_CTRL,
            name="Bitrate",
        )
        super().__init__(
            camera,
            ">I",
            option_descriptor,
            ControlFlagsModel(
                default_value=10,
                min_value=0.1,
                max_value=15,
                step=0.1,
                control_type=ControlTypeEnum.INTEGER,
            ),
        )

    def set_value(self, value: float) -> None:
        # convert to bps from mpbs (round for float imprecision)
        bitrate_bps = int(round(value * 1000000))
        super()._set_value_raw(bitrate_bps)

    def get_value(self) -> float:
        bitrate_bps = super()._get_value_raw()
        # convert to mpbs from bps
        return bitrate_bps / 1000000.0


class EHDGOPOption(XUOption):
    """Option for setting the Group of Pictures (GOP) on exploreHD cameras"""

    def __init__(self, camera) -> None:
        option_descriptor = OptionDescriptor(
            unit=Unit.USR_ID,
            ctrl=Selector.USR_H264_CTRL,
            command=Command.GOP_CTRL,
            name="Group of Pictures",
        )
        super().__init__(
            camera,
            "H",
            option_descriptor,
            control_flags=ControlFlagsModel(
                default_value=29,
                min_value=0,
                max_value=29,
                step=1,
                control_type=ControlTypeEnum.INTEGER,
            ),
        )

    def set_value(self, value: Any) -> None:
        if not isinstance(value, int):
            raise TypeError(f"EHDGOPOption requires an int, got {type(value).__name__}")

        super()._set_value_raw(value)

    def get_value(self) -> int:
        return super()._get_value_raw()


class EHDH264ModeOption(XUOption):
    """Option for setting the H264 mode (CBR or VBR) on exploreHD cameras"""

    def __init__(self, camera) -> None:
        option_descriptor = OptionDescriptor(
            unit=Unit.USR_ID,
            ctrl=Selector.USR_H264_CTRL,
            command=Command.H264_MODE_CTRL,
            name="Variable Bitrate",
        )
        # CHECK: Are we really sending boolean values or just 0 and 1?
        # Hopefully this does not affect serialization for settings saving/loading
        super().__init__(
            camera,
            "B",
            option_descriptor,
            ControlFlagsModel(
                default_value=True,
                control_type=ControlTypeEnum.BOOLEAN,
            ),
        )

    def set_value(self, value: Any) -> None:
        if not isinstance(value, bool):
            raise TypeError(
                f"EHDH264ModeOption requires a bool, got {type(value).__name__}"
            )

        super()._set_value_raw(
            H264Mode.MODE_VARIABLE_BITRATE.value
            if value
            else H264Mode.MODE_CONSTANT_BITRATE.value
        )

    def get_value(self) -> bool:
        mode_value = super()._get_value_raw()
        return H264Mode(mode_value) == H264Mode.MODE_VARIABLE_BITRATE
