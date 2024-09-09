from typing import List, Dict
from .pwm_controller import PWMController
from .light import Light
from .schemas import LightSchema
import logging

class LightManager:

    def __init__(self, pwm_controller: PWMController) -> None:
        self.pwm_controller: PWMController = pwm_controller
        self.lights: List[Light] = []

    def set_light(self, index: int, light: Light):
        logging.info(f'Setting light {index}: {light.pin}, {light.intensity}')
        self.pwm_controller.set_intensity(light.pin, light.intensity)
        if index >= len(self.lights):
            self.lights.append(light)
        else:
            self.lights[index] = light

    def remove_light(self, index: int):
        logging.info(f'Removing light {index}')
        if len(self.lights) >= index:
            self.pwm_controller.set_intensity(index, 0)
            del self.lights[index]

    def get_lights(self):
        return LightSchema(many=True).dump(self.lights)
