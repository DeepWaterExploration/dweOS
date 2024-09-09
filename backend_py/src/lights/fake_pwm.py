from .pwm_controller import PWMController
from typing import Dict
import logging

class FakePWMController(PWMController):
    def __init__(self) -> None:
        super().__init__()

    def is_pwm_pin(self, pin: int) -> bool:
        return super().is_pwm_pin(pin)
    
    def set_intensity(self, pin: int, intensity: float):
        # logging.log(f'{}')
        pass

    def cleanup(self):
        pass
