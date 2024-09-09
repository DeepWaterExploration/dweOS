from abc import ABC, abstractmethod
import logging

class PWMController(ABC):
    @abstractmethod
    def set_intensity(self, pin: int, intensity: float):
        logging.info(f'Setting light intensity: {pin} to {intensity}')

    @abstractmethod
    def is_pwm_pin(self, pin: int) -> bool:
        pass

    @abstractmethod
    def cleanup(self):
        pass
