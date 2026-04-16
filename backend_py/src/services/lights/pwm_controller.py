"""
pwm_controller.py

Abstract class definition / interface all PWM drivers must follow
Maintains consistency with PWM functionality
"""

import logging
from abc import ABC, abstractmethod


class PWMController(ABC):
    NAME = "Abstract Controller"

    def __init__(self) -> None:
        self.logger = logging.getLogger("dwe_os_2.PWMController")

    @abstractmethod
    def set_intensity(self, pin: int, intensity: float) -> None:
        self.logger.info(f"Setting light intensity: {pin} to {intensity}")

    @abstractmethod
    def disable_pin(self, pin: int) -> None:
        pass

    @abstractmethod
    def is_pwm_pin(self, pin: int) -> bool:
        pass

    @abstractmethod
    def cleanup(self) -> None:
        pass

    @abstractmethod
    def get_pins(self) -> list[int]:
        return []
