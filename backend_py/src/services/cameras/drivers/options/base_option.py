from abc import ABC, abstractmethod
from typing import Any

from backend_py.src.models import ControlFlagsModel


class BaseOption(ABC):
    """
    Base class for camera options.
    Each option corresponds to a control that can be get or set on the camera.
    """

    def __init__(
        self, name: str, control_flags: ControlFlagsModel, load_from_save=True
    ) -> None:
        self.name = name
        self.control_flags = control_flags
        self.load_from_save = load_from_save

    @abstractmethod
    def get_value(self) -> Any:
        """
        Get the current value of the option from the camera.
        """

    @abstractmethod
    def set_value(self, value) -> None:
        """
        Set the value of the option on the camera.
        """
