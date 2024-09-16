from rpi_hardware_pwm import HardwarePWM
from .pwm_controller import PWMController
from typing import Dict
import logging

class RPiHardwarePWMController(PWMController):
    NAME = 'Hardware PWM Controller'

    def __init__(self, chip=0, pins=None) -> None:
        super().__init__()

        if pins is None:
            pins = {
                18: 0,
                19: 1
            }
        self.PWM_PINS = pins

        self.pwm_objects: Dict[int, HardwarePWM] = {}

        for pin in self.PWM_PINS.keys():
            self.pwm_objects[pin] = HardwarePWM(pwm_channel=self.PWM_PINS[pin], hz=7812.5, chip=chip)
            self.pwm_objects[pin].start(0)

    def is_pwm_pin(self, pin: int) -> bool:
        return pin in self.PWM_PINS.keys()
    
    def disable_pin(self, pin: int):
        # FIXME: Not implemented
        pass

    def set_intensity(self, pin: int, intensity: float):
        if not self.is_pwm_pin(pin):
            logging.warning(f'Attempted to use pin: {pin}, which is not supported by this device')
            return

        duty_cycle = max(0, min(100, intensity))
        self.pwm_objects[pin].change_duty_cycle(duty_cycle)

    def cleanup(self):
        for pwm in self.pwm_objects.values():
            pwm.stop()

    def get_pins(self):
        return self.PWM_PINS.keys()