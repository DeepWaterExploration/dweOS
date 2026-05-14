"""
options.py
"""

from abc import abstractmethod

from backend_py.src.models import ControlFlagsModel, ControlTypeEnum

from ..options import BaseOption
from ..xu import StellarRegisterMap, StellarSensorMap
from .asic_interface import ASICInterface


class ASICOption(BaseOption):
    """ """

    def __init__(
        self, name: str, control_flags: ControlFlagsModel, interface: ASICInterface
    ) -> None:
        super().__init__(name, control_flags)

        self._cached = control_flags.default_value
        self._interface = interface

    @abstractmethod
    def _write(self, value: int | float | bool) -> None:
        # TODO: add checks for value type
        pass

    @abstractmethod
    def _read(self) -> int | float | bool | None:
        # TODO: add checks for value type
        pass

    def set_value(self, value: int | float | bool) -> None:
        value = int(value)
        self._cached = value
        self._write(value)

    def get_value(self) -> int | float | bool:
        return self._cached


class AutoExposureOption(ASICOption):
    def __init__(self, asic_interface: ASICInterface) -> None:
        super().__init__(
            "Auto Exposure (ASIC)",
            ControlFlagsModel(
                default_value=1,
                max_value=1,
                min_value=0,
                step=1,
                control_type=ControlTypeEnum.BOOLEAN,
            ),
            asic_interface,
        )

    def _write(self, value: int | float | bool) -> None:
        self._interface.asic_write(StellarRegisterMap.REG_AE, int(value))

    def _read(self) -> bool | None:
        ae, ret = self._interface.asic_read(StellarRegisterMap.REG_AE)

        return bool(ae) if ret == 0 else None


class ASICHighLowOption(ASICOption):
    def __init__(
        self,
        name: str,
        control_flags: ControlFlagsModel,
        asic_interface: ASICInterface,
        high_register: int,
        low_register: int,
    ) -> None:
        super().__init__(
            name,
            control_flags,
            asic_interface,
        )

        self.high_register = high_register
        self.low_register = low_register

    def _write(self, value: int | float | bool) -> None:
        # TODO: Require int
        self._interface.asic_write_high_low(
            self.high_register, self.low_register, int(value)
        )

    def _read(self) -> int | None:
        return self._interface.asic_read_high_low(self.high_register, self.low_register)


class HardwareBitrateOption(ASICHighLowOption):
    def __init__(
        self,
        asic_interface: ASICInterface,
    ) -> None:
        super().__init__(
            "Hardware Bitrate",
            ControlFlagsModel(
                default_value=13000,
                max_value=13000,
                min_value=100,
                step=1,
                control_type=ControlTypeEnum.INTEGER,
            ),
            asic_interface,
            StellarRegisterMap.REG_HW_BITRATE_HIGH,
            StellarRegisterMap.REG_HW_BITRATE_LOW,
        )

    def _write(self, value: int | float | bool) -> None:
        super()._write(value)

        # Trigger the bitrate value
        self._interface.asic_write(StellarRegisterMap.REG_HW_BITRATE_TRIG, 1)


class SensorHighLowOption(ASICOption):
    def __init__(
        self,
        name: str,
        control_flags: ControlFlagsModel,
        asic_interface: ASICInterface,
        high_register: int,
        low_register: int,
    ) -> None:
        super().__init__(
            name,
            control_flags,
            asic_interface,
        )

        self.high_register = high_register
        self.low_register = low_register

    def _write(self, value: int | float | bool) -> None:
        self._interface.sensor_write_high_low(
            self.high_register, self.low_register, int(value)
        )

    def _read(self) -> int | float | bool | None:
        return self._interface.sensor_read_high_low(
            self.high_register, self.low_register
        )


class ShutterSpeedOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface) -> None:
        super().__init__(
            "Shutter Speed",
            ControlFlagsModel(
                default_value=100,
                max_value=8000,
                min_value=10,
                step=1,
                control_type=ControlTypeEnum.INTEGER,
            ),
            asic_interface,
            StellarSensorMap.SHUTTER_HIGH,
            StellarSensorMap.SHUTTER_LOW,
        )


class VtsOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface) -> None:
        super().__init__(
            "VTS",
            ControlFlagsModel(
                default_value=0,
                max_value=65535,
                min_value=0,
                step=1,
                control_type=ControlTypeEnum.INTEGER,
            ),
            asic_interface,
            StellarSensorMap.VTS_HIGH,
            StellarSensorMap.VTS_LOW,
        )


class HtsOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface) -> None:
        super().__init__(
            "HTS",
            ControlFlagsModel(
                default_value=0,
                max_value=65535,
                min_value=0,
                step=1,
                control_type=ControlTypeEnum.INTEGER,
            ),
            asic_interface,
            StellarSensorMap.HTS_HIGH,
            StellarSensorMap.HTS_LOW,
        )


class GainOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface) -> None:
        super().__init__(
            "ISO",
            ControlFlagsModel(
                default_value=400,
                max_value=4095,
                min_value=0,
                step=1,
                control_type=ControlTypeEnum.INTEGER,
            ),
            asic_interface,
            StellarSensorMap.SHUTTER_HIGH,
            StellarSensorMap.SHUTTER_LOW,
        )


class StrobeWidthOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface) -> None:
        super().__init__(
            "Strobe Width",
            ControlFlagsModel(
                default_value=0,
                max_value=4095,
                min_value=0,
                step=1,
                control_type=ControlTypeEnum.INTEGER,
            ),
            asic_interface,
            StellarSensorMap.STROBE_WIDTH_HIGH,
            StellarSensorMap.STROBE_WIDTH_LOW,
        )
