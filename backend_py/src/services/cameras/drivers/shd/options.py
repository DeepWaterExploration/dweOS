"""
options.py
"""

import logging
from abc import abstractmethod
from collections.abc import Callable

from backend_py.src.models import ControlFlagsModel, ControlTypeEnum, MenuItemModel

from ..asic_interface import ASICInterface
from ..options import BaseOption
from ..xu import StellarRegisterMap, StellarSensorMap


class ASICOption(BaseOption):
    """ """

    def __init__(
        self,
        name: str,
        control_flags: ControlFlagsModel,
        interface: ASICInterface,
        callback: Callable[[int | float | bool], None] | None = None,
    ) -> None:
        super().__init__(name, control_flags)

        self._cached = control_flags.default_value
        self._interface = interface
        self._callback = callback

        self.logger = logging.getLogger(
            f"dwe_os_2.cameras.{interface.camera.path}.ASICOption.{name}"
        )

    @abstractmethod
    def _write(self, value: int | float | bool) -> None:
        pass

    @abstractmethod
    def _read(self) -> int | float | bool | None:
        # TODO: add checks for value type
        pass

    def set_value(self, value: int | float | bool) -> None:
        value = int(value)
        self._cached = value
        self._write(value)
        if self._callback:
            self._callback(value)

    def get_value(self) -> int | float | bool:
        return self._cached


class AutoExposureOption(ASICOption):
    def __init__(self, asic_interface: ASICInterface, **kwargs) -> None:
        super().__init__(
            "Auto Exposure (ASIC)",
            ControlFlagsModel(
                default_value=True,
                max_value=1,
                min_value=0,
                step=1,
                control_type=ControlTypeEnum.BOOLEAN,
            ),
            asic_interface,
            **kwargs,
        )

    def _write(self, value: int | float | bool) -> None:
        self._interface.asic_write(self.name, StellarRegisterMap.REG_AE, int(value))

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
        **kwargs,
    ) -> None:
        super().__init__(name, control_flags, asic_interface, **kwargs)

        self.high_register = high_register
        self.low_register = low_register

    def _write(self, value: int | float | bool) -> None:
        # TODO: Require int
        self._interface.asic_write_high_low(
            self.name, self.high_register, self.low_register, int(value)
        )

    def _read(self) -> int | None:
        return self._interface.asic_read_high_low(self.high_register, self.low_register)


class HardwareBitrateOption(ASICHighLowOption):
    PRESET_MAP = {0: 5000, 1: 9000, 2: 13000, 3: 20000, 4: 60000}

    def __init__(self, asic_interface: ASICInterface, **kwargs) -> None:
        super().__init__(
            "JPEG Image Quality",
            ControlFlagsModel(
                default_value=4,  # default to highest
                menu=[
                    MenuItemModel(index=0, name="Lowest"),
                    MenuItemModel(index=1, name="Low"),
                    MenuItemModel(index=2, name="Medium"),
                    MenuItemModel(index=3, name="High"),
                    MenuItemModel(index=4, name="Highest"),
                ],
                min_value=0,
                max_value=4,
                step=1,
                control_type=ControlTypeEnum.MENU,
            ),
            asic_interface,
            StellarRegisterMap.REG_HW_BITRATE_HIGH,
            StellarRegisterMap.REG_HW_BITRATE_LOW,
            **kwargs,
        )

    def _write(self, value: int | float | bool) -> None:
        # value must be an integer
        if type(value) is not int:
            self.logger.error(
                "write() called for bitrate ASIC control with type(value) != int"
            )
            return

        try:
            preset_value = self.PRESET_MAP[value]
        except KeyError:
            preset_value = 0
            self.logger.error(
                "write() called for bitrate ASIC control with invalid value"
            )

        super()._write(preset_value or 0)

        # Trigger the bitrate value (must be a diff key)
        self._interface.asic_write(
            self.name + "trig", StellarRegisterMap.REG_HW_BITRATE_TRIG, 1
        )


class SensorHighLowOption(ASICOption):
    def __init__(
        self,
        name: str,
        control_flags: ControlFlagsModel,
        asic_interface: ASICInterface,
        high_register: int,
        low_register: int,
        # FIXME: check write delay
        write_delay_s: float = 0.6,
        **kwargs,
    ) -> None:
        super().__init__(name, control_flags, asic_interface, **kwargs)

        self.high_register = high_register
        self.low_register = low_register
        self.write_delay_s = write_delay_s

    def _write(self, value: int | float | bool) -> None:
        self._interface.sensor_write_high_low(
            self.name,
            self.high_register,
            self.low_register,
            int(value),
            self.write_delay_s,
        )

    def _read(self) -> int | float | bool | None:
        return self._interface.sensor_read_high_low(
            self.high_register, self.low_register
        )


class ShutterSpeedOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface, **kwargs) -> None:
        super().__init__(
            "Exposure Time",
            ControlFlagsModel(
                default_value=100,
                max_value=8000,
                min_value=1,
                step=1,
                control_type=ControlTypeEnum.INTEGER,
            ),
            asic_interface,
            StellarSensorMap.SHUTTER_HIGH,
            StellarSensorMap.SHUTTER_LOW,
            write_delay_s=0.6,
            **kwargs,
        )


class VtsOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface, **kwargs) -> None:
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
            **kwargs,
        )


class FakeOption(BaseOption):
    def __init__(self, name: str) -> None:
        super().__init__(
            name,
            ControlFlagsModel(default_value=0, control_type=ControlTypeEnum.INTEGER),
        )

    def _write(self, value: int | float | bool) -> None:
        pass

    def _read(self) -> int | float | bool | None:
        pass

    def set_value(self, value: int | float | bool) -> None:
        pass

    def get_value(self) -> int | float | bool:
        return 0


class HtsOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface, **kwargs) -> None:
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
            **kwargs,
        )


class GainOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface, **kwargs) -> None:
        super().__init__(
            "ISO",
            ControlFlagsModel(
                default_value=0,
                max_value=4095,
                min_value=0,
                step=1,
                control_type=ControlTypeEnum.INTEGER,
            ),
            asic_interface,
            StellarSensorMap.ISO_HIGH,
            StellarSensorMap.ISO_LOW,
            **kwargs,
        )


class StrobeWidthOption(SensorHighLowOption):
    def __init__(self, asic_interface: ASICInterface, **kwargs) -> None:
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
            **kwargs,
        )
        # Strobe width should not be set on start
        self.load_from_save = False
