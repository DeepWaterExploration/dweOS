"""
server.py

Handles server logic and initializes all the managers (settings, devices, lights, etc)
Starts device monitoring, wifi scan, and starts ttyd (teletypewriter daemon) to run in
the background
"""

import asyncio
import logging
import logging.handlers

import socketio
from fastapi import FastAPI

from .logging import LogHandler
from .routes import (
    camera_router,
    logs_router,
    network_router,
    preferences_router,
    pwm_router,
    recordings_router,
    system_router,
)
from .schemas import FeatureSupport
from .services.cameras import DeviceManager, SerialPWMController, SettingsManager
from .services.network import NetworkWrapper
from .services.preferences import PreferencesManager
from .services.recordings import RecordingsService
from .services.system import SystemManager
from .services.ttyd import TTYDManager


class Server:
    """
    Server singleton
    """

    def __init__(
        self,
        feature_support: FeatureSupport,
        sio: socketio.AsyncServer,
        app: FastAPI,
        settings_path: str = "/",
        log_level=logging.INFO,
        is_dev_mode=False,
    ) -> None:
        # initialize the app
        self.app = app

        # initialize features
        self.feature_support = feature_support

        # Create the managers
        self.sio = sio

        # Create the logging handler
        self.root_logger = logging.getLogger("dwe_os_2")
        self.stream_handler = logging.StreamHandler()
        self.root_logger.addHandler(self.stream_handler)
        self.log_handler = LogHandler(self.sio)
        self.log_formatter = logging.Formatter(
            "%(asctime)s - %(levelname)s - [%(name)s] - %(filename)s:%(lineno)d - "
            "%(funcName)s() - %(message)s"
        )
        self.stream_handler.setFormatter(self.log_formatter)
        self.file_handler = logging.handlers.RotatingFileHandler(
            "dwe_os_2.log",
            maxBytes=1 * 1024 * 1024,
            backupCount=1000,  # 1 Gig of logs
            encoding="utf-8",
        )
        self.file_handler.setFormatter(self.log_formatter)
        self.root_logger.addHandler(self.file_handler)
        self.root_logger.addHandler(self.log_handler)
        self.root_logger.setLevel(log_level)

        # Settings
        self.settings_manager = SettingsManager(settings_path)
        self.preferences_manager = PreferencesManager(settings_path)

        # Serial
        self.serial = SerialPWMController(
            frequency_offset=self.preferences_manager.get_preferences().frequency_offset
        )

        # Device Manager
        self.device_manager = DeviceManager(
            settings_manager=self.settings_manager, sio=self.sio, serial=self.serial
        )

        self.server_logger = logging.getLogger("dwe_os_2.Server")

        self.network_wrapper = NetworkWrapper(sio)

        self.network_wrapper.on(
            "refresh_ui",
            lambda: asyncio.create_task(self.sio.emit("refresh_wired_config")),
        )

        self.system_manager = SystemManager()

        self.recordings_service = RecordingsService()

        # TTYD
        if self.feature_support.ttyd:
            self.ttyd_manager = TTYDManager(is_dev_mode)

        # TODO: https://fastapi.tiangolo.com/tutorial/dependencies/

        # FAST API
        self.app.state.device_manager = self.device_manager
        self.app.state.log_handler = self.log_handler
        self.app.state.settings_manager = self.settings_manager
        self.app.state.preferences_manager = self.preferences_manager
        self.app.state.system_manager = self.system_manager
        self.app.state.ttyd_manager = (
            self.ttyd_manager if self.feature_support.ttyd else None
        )
        self.app.state.network_manager = self.network_wrapper
        self.app.state.recordings_service = self.recordings_service
        self.app.state.serial = self.serial

        self.app.include_router(camera_router, prefix="/api/devices")
        self.app.include_router(preferences_router, prefix="/api/preferences")
        self.app.include_router(system_router, prefix="/api/system")
        self.app.include_router(logs_router, prefix="/api/logs")
        self.app.include_router(recordings_router, prefix="/api/recordings")
        self.app.include_router(network_router, prefix="/api/network")

        if feature_support.serial:
            self.app.include_router(pwm_router, prefix="/api/pwm")
            self.preferences_manager.on(
                "preferences_updated",
                lambda preferences: self.serial.set_frequency_offset(
                    preferences.frequency_offset
                ),
            )

        self.app.add_api_route(
            "/api/features",
            lambda: self.feature_support.model_dump(),
            methods=["GET"],
            summary="Get supported features",
            tags=["features"],
            response_model=FeatureSupport,
        )

        # Error handling
        # TODO

    async def emit_logs(self) -> None:
        while True:
            logs = self.log_handler.pop_logs()
            for log in logs:
                await self.sio.emit("log", log.model_dump())
            await asyncio.sleep(0.1)

    async def serve(self) -> None:
        # loop over and emit the logs to the client
        asyncio.create_task(self.emit_logs())

        if self.feature_support.serial:
            self.serial.start()

        self.device_manager.start_monitoring()

        await self.network_wrapper.initialize()

        if self.feature_support.ttyd:
            self.ttyd_manager.start()
        else:
            self.server_logger.info("Running without TTYD")

    def shutdown(self) -> None:
        self.server_logger.info("Shutting down")

        self.device_manager.stop_monitoring()
        self.settings_manager.cleanup()

        if self.feature_support.ttyd:
            self.ttyd_manager.kill()
