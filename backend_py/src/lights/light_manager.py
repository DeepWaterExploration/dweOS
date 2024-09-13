from typing import List, Dict
from .pwm_controller import PWMController
from .light import Light
from .schemas import LightSchema
from .light_types import LightType
import logging

class LightManager:

    def __init__(self, pwm_controllers: List[PWMController]) -> None:
        self.pwm_controllers = pwm_controllers
        self.lights: List[Light] = []

    def set_light(self, index: int, light: Light):
        logging.info(f'Setting light {index}: {light.pin}, {light.intensity}')
        if light.controller_index >= len(self.pwm_controllers):
            logging.error('Invalid index given for pwm controller')
            return
        
        pwm_controller = self.pwm_controllers[light.controller_index]
        pwm_controller.set_intensity(light.pin, light.intensity)

        if index >= len(self.lights):
            self.lights.append(light)
        else:
            self.lights[index] = light

    def remove_light(self, index: int):
        logging.info(f'Removing light {index}')
        if len(self.lights) >= index:
            light = self.lights[index]
            if light.controller_index >= len(self.pwm_controllers):
                logging.error('Invalid index given for pwm controller')
                return
            pwm_controller = self.pwm_controllers[light.controller_index]
            pwm_controller.set_intensity(light.pin, 0)
            del self.lights[index]

    def get_lights(self):
        return LightSchema(many=True).dump(self.lights)
    
    def get_pwm_controllers(self):
        controllers = []
        for pwm_controller in self.pwm_controllers:
            controllers.append(pwm_controller.NAME)
        return controllers
    
    def get_pins(self, controller_index: int):
        # Make sure the index is not out of range
        if controller_index >= len(self.pwm_controllers):
            logging.warning(f'Attempted to get the pins of controller index: {controller_index}, which does not exist.')
            return []
        return self.pwm_controllers[controller_index].get_pins()

    def cleanup(self):
        for pwm_controller in self.pwm_controllers:
            pwm_controller.cleanup()
