"""
xu_option.py

Class for setting exploreHD extension unit options.
"""

import struct
from abc import abstractmethod
from dataclasses import dataclass
from typing import Any

from backend_py.src.models import ControlFlagsModel

from ..video4linux import Camera
from ..xu import DWE_DEVICE_TAG, Command, Selector, Unit
from .base_option import BaseOption


@dataclass
class OptionDescriptor:
    """
    Class to hold information about an extension unit option
    """

    unit: Unit
    ctrl: Selector
    command: Command
    name: str


class XUOption(BaseOption):
    """
    EHD Option Class
    """

    def __init__(
        self,
        camera: Camera,
        fmt: str,
        option_descriptor: OptionDescriptor,
        control_flags: ControlFlagsModel,
        size=11,
    ) -> None:
        super().__init__(option_descriptor.name, control_flags)

        self._camera = camera
        self._fmt = fmt

        self._option_descriptor = option_descriptor

        self._size = size
        self._data = b"\x00" * size

    # get the control value(s)
    def _get_value_raw(self) -> int:
        self._get_ctrl()
        values = self._unpack(self._fmt)
        self._clear()

        if len(values) == 1:
            return int(values[0])

        raise NotImplementedError(
            "Expected only one value from unpacking, got multiple"
        )

    # set the control value
    def _set_value_raw(self, value: int) -> None:
        self._pack(self._fmt, value)
        self._set_ctrl()
        self._clear()

    @abstractmethod
    def set_value(self, value: int | float | bool) -> None:
        pass

    @abstractmethod
    def get_value(self) -> int | float | bool:
        pass

    # pack data to internal buffer
    def _pack(self, fmt: str, *arg: int) -> None:
        data = struct.pack(fmt, *arg)
        # make sure the data is of the right length
        self._data = data + bytearray(self._size - len(data))

    # unpack data from internal buffer
    def _unpack(self, fmt: str) -> tuple[Any, ...]:
        return struct.unpack_from(fmt, self._data)

    def _set_ctrl(self) -> None:
        data = bytearray(self._size)
        data[0] = DWE_DEVICE_TAG
        data[1] = self._option_descriptor.command.value

        # Switch command
        self._camera.uvc_set_ctrl(
            self._option_descriptor.unit.value,
            self._option_descriptor.ctrl.value,
            bytes(data),
            self._size,
        )

        self._camera.uvc_set_ctrl(
            self._option_descriptor.unit.value,
            self._option_descriptor.ctrl.value,
            self._data,
            self._size,
        )

    def _get_ctrl(self) -> None:
        data = bytearray(self._size)
        data[0] = DWE_DEVICE_TAG
        data[1] = self._option_descriptor.command.value
        self._data = bytes(self._size)
        # Switch command
        self._camera.uvc_set_ctrl(
            self._option_descriptor.unit.value,
            self._option_descriptor.ctrl.value,
            bytes(data),
            self._size,
        )

        # Grab the data
        self._camera.uvc_get_ctrl(
            self._option_descriptor.unit.value,
            self._option_descriptor.ctrl.value,
            self._data,
            self._size,
        )

    def _clear(self) -> None:
        self._data = b"\x00" * self._size
