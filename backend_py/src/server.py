from ctypes import *

from .services import *
from .routes import *
from .logging import LogHandler
from .schemas import FeatureSupport

from fastapi import FastAPI
import socketio

import logging


class Server:
    """
    Server singleton
    """

    def __init__(
        self,
        feature_support: FeatureSupport,
        sio: socketio.Server,
        app: FastAPI,
        settings_path: str = "/",
    ) -> None:
        # initialize the app
        self.app = app

        # initialize features
        self.feature_support = feature_support

        # Create the managers
        self.sio = sio

        self.log_handler = LogHandler(self.sio)

        # Settings
        self.settings_manager = SettingsManager(settings_path)
        self.preferences_manager = PreferencesManager(settings_path)

        # Device Manager
        self.device_manager = DeviceManager(
            settings_manager=self.settings_manager, sio=self.sio
        )

        # Lights
        self.light_manager = LightManager(create_pwm_controllers())

        # Wifi support
        if self.feature_support.wifi:
            try:
                self.wifi_manager = AsyncNetworkManager()
                self.app.include_router(wifi_router)
                self.app.include_router(wired_router)
                self.wifi_manager.on(
                    "ip_changed",
                    lambda: asyncio.create_task(self.sio.emit("ip_changed")),
                )
                self.wifi_manager.on(
                    "aps_changed",
                    lambda: asyncio.create_task(self.sio.emit("aps_changed")),
                )
                self.wifi_manager.on(
                    "connections_changed",
                    lambda: asyncio.create_task(self.sio.emit("connections_changed")),
                )
                self.wifi_manager.on(
                    "connection_changed",
                    lambda: asyncio.create_task(self.sio.emit("connection_changed")),
                )
                self.wifi_manager.on(
                    "disconnected",
                    lambda: asyncio.create_task(self.sio.emit("wifi_disconnected")),
                )

            except WiFiException as e:
                logging.warning(
                    f"Error occurred while initializing WiFi: {e} so WiFi will not be supported"
                )
                self.feature_support.wifi = False

        self.system_manager = SystemManager()

        # TTYD
        if self.feature_support.ttyd:
            self.ttyd_manager = TTYDManager()

        # FAST API
        self.app.state.device_manager = self.device_manager
        self.app.state.log_handler = self.log_handler
        self.app.state.light_manager = self.light_manager
        self.app.state.settings_manager = self.settings_manager
        self.app.state.preferences_manager = self.preferences_manager
        self.app.state.system_manager = self.system_manager
        self.app.state.ttyd_manager = (
            self.ttyd_manager if self.feature_support.ttyd else None
        )
        self.app.state.wifi_manager = (
            self.wifi_manager if self.feature_support.wifi else None
        )

        self.app.include_router(camera_router)
        self.app.include_router(preferences_router)
        self.app.include_router(system_router)
        self.app.include_router(lights_router)
        self.app.include_router(logs_router)

        self.app.add_api_route(
            "/features",
            lambda: self.feature_support.model_dump(),
            methods=["GET"],
            summary="Get supported features",
            tags=["features"],
            response_model=FeatureSupport,
        )

        # Error handling
        # TODO

    async def emit_logs(self):
        while True:
            logs = self.log_handler.pop_logs()
            for log in logs:
                await self.sio.emit("log", log.model_dump())
            await asyncio.sleep(0.1)

    def serve(self):
        # Create the logging handler
        logging.getLogger().addHandler(self.log_handler)

        # loop over and emit the logs to the client
        asyncio.create_task(self.emit_logs())

        self.device_manager.start_monitoring()
        if self.feature_support.wifi:
            self.wifi_manager.start_scanning()
        if self.feature_support.ttyd:
            self.ttyd_manager.start()
        else:
            logging.info("Running without TTYD")

    def shutdown(self):
        logging.info("Shutting down")

        self.light_manager.cleanup()
        self.device_manager.stop_monitoring()

        if self.feature_support.ttyd:
            self.ttyd_manager.kill()

        if self.feature_support.wifi:
            self.wifi_manager.stop_scanning()
