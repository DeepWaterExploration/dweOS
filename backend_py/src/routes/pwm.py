"""
pwm.py

API endpoints for pwm config
"""

from fastapi import APIRouter, Depends, Request
from typing import Dict
from ..services import DeviceManager, SavedPreferencesModel

pwm_router = APIRouter(tags=['pwm'])


@pwm_router.get('/pwm/frequency')
def get_frequency(request: Request) -> float:
    device_manager: DeviceManager = request.app.state.device_manager

    return device_manager.serial.frequency


@pwm_router.post('/pwm/frequency')
def set_frequency(request: Request, frequency: float):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.serial.apply(frequency, 30)


@pwm_router.post('/pwm/apply_from_fps')
def apply_from_fps(request: Request, fps: int):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.serial.apply_from_fps(fps)
