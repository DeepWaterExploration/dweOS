from rpi_hardware_pwm import HardwarePWM, HardwarePWMException
from .pwm_controller import PWMController
from typing import Dict
import logging

class RPiHardwarePWMController(PWMController):
    NAME = 'Hardware PWM Controller'

    def __init__(self, chip=0, pins=None) -> None:
        super().__init__()

        self.pwm_supported = True

        if pins is None:
            pins = {
                18: 0,
                19: 1
            }
        self.PWM_PINS = pins

        self.pwm_objects: Dict[int, HardwarePWM] = {}

        for pin in self.PWM_PINS.keys():
            try:
                self.pwm_objects[pin] = HardwarePWM(pwm_channel=self.PWM_PINS[pin], hz=7812.5, chip=chip)
            except HardwarePWMException:
                logging.warning('Hardware PWM is not enabled. Need to add \'dtoverlay=pwm-2chan\' to /boot/config.txt and reboot.')
                self.pwm_supported = False
                break
            self.pwm_objects[pin].start(0)

        # Make sure the objects are not initialized
        if not self.pwm_supported:
            self.pwm_objects = {}

    def is_pwm_pin(self, pin: int) -> bool:
        '''
        Return true if the pin is supported but will always return false if pwm is not supported entirely
        '''
        return pin in self.PWM_PINS.keys() if self.pwm_supported else False
    
    def disable_pin(self, pin: int):
        # FIXME: Not implemented
        # Planned to be implemented soon
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
        return self.PWM_PINS.keys() if self.pwm_supported else []