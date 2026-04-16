from .cameras import camera_router
from .lights import lights_router
from .logs import logs_router
from .network import network_router
from .preferences import preferences_router
from .pwm import pwm_router
from .recordings import recordings_router
from .system import system_router

__all__ = [
    "camera_router",
    "lights_router",
    "logs_router",
    "preferences_router",
    "system_router",
    "recordings_router",
    "pwm_router",
    "network_router",
]
