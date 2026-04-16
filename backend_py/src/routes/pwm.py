"""
pwm.py

API endpoints for pwm config
"""

from fastapi import APIRouter, Request

from ..services.cameras import SerialPWMController

pwm_router = APIRouter(tags=["pwm"])


@pwm_router.get("/frequency")
def get_frequency(request: Request) -> float:
    serial: SerialPWMController = request.app.state.serial

    # FIXME: all serial related items should be exclusively accessible via a wrapper
    return serial.frequency


@pwm_router.post("/frequency")
def set_frequency(request: Request, frequency: float) -> None:
    serial: SerialPWMController = request.app.state.serial

    serial.apply(frequency, 30)


@pwm_router.post("/apply_from_fps")
def apply_from_fps(request: Request, fps: int) -> None:
    serial: SerialPWMController = request.app.state.serial

    serial.apply_from_fps(fps)
