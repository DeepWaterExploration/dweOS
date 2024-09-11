from .pwm_controller import PWMController
from typing import Dict
import logging

class FakePWMController(PWMController):
    NAME = 'Fake PWM Controller'

    def __init__(self) -> None:
        super().__init__()

    def is_pwm_pin(self, pin: int) -> bool:
        return True
    
    def set_intensity(self, pin: int, intensity: float):
        # logging.log(f'{}')
        pass

    def cleanup(self):
        pass

    def get_pins(self):
        return [1, 2, 3, 4]
