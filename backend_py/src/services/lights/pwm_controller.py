from abc import ABC, abstractmethod
import logging


class PWMController(ABC):
    NAME = "Abstract Controller"

    def __init__(self):
        self.logger = logging.getLogger("dwe_os_2.PWMController")

    @abstractmethod
    def set_intensity(self, pin: int, intensity: float):
        self.logger.info(f"Setting light intensity: {pin} to {intensity}")

    @abstractmethod
    def disable_pin(self, pin: int):
        pass

    @abstractmethod
    def is_pwm_pin(self, pin: int) -> bool:
        pass

    @abstractmethod
    def cleanup(self):
        pass

    @abstractmethod
    def get_pins(self):
        return []
