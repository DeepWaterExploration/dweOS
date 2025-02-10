from fastapi import APIRouter, Depends, Request
from typing import List
from ..services import LightManager, Light, DisableLightInfo, SetLightInfo

lights_router = APIRouter(tags=['lights'])

@lights_router.get('/lights/')
def get_lights(request: Request) -> List[Light]:
    light_manager: LightManager = request.app.state.light_manager

    return light_manager.get_lights()

@lights_router.post('/lights/set_intensity')
def set_intensity(request: Request, set_light_info: SetLightInfo):
    light_manager: LightManager = request.app.state.light_manager

    light_manager.set_intensity(set_light_info.index, set_light_info.intensity)
    return {}

@lights_router.route('/lights/disable_pin', methods=['POST'])
def disable_light(request: Request, disable_light_info: DisableLightInfo):
    light_manager: LightManager = request.app.state.light_manager
    light_manager.disable_light(disable_light_info.controller_index, disable_light_info.pin)
    return {}
