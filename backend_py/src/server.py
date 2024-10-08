from ctypes import *
import sys
import signal

from flask import Flask, jsonify, request
from flask_cors import CORS
from gevent.pywsgi import WSGIServer

from .websockets.broadcast_server import BroadcastServer

from .services import *
from .blueprints import cameras_bp, lights_bp, logs_bp, preferences_bp, wifi_bp, system_bp
from .logging import LogHandler

from marshmallow import ValidationError

import logging

class Server:

    def __init__(self, port=8080) -> None:
        # Create the flask application
        self.app = Flask(__name__)
        CORS(self.app)

        self.app.register_error_handler(ValidationError, self._handle_validation_error)
        self.app.register_error_handler(DeviceNotFoundException, self._handle_device_not_found)
        self.app.register_error_handler(Exception, self._handle_server_error)

        # avoid sorting the keys to keep the way we sort it in the backend
        self.app.json.sort_keys = False

        # Create the managers
        self.broadcast_server = BroadcastServer()
        # Create the logging handler
        self.log_handler = LogHandler(self.broadcast_server)
        logging.getLogger().addHandler(self.log_handler)
        self.settings_manager = SettingsManager()
        self.device_manager = DeviceManager(
            settings_manager=self.settings_manager, broadcast_server=self.broadcast_server)
        self.light_manager = LightManager(create_pwm_controllers())
        self.preferences_manager = PreferencesManager()
        self.wifi_manager = WiFiManager()
        self.system_manager = SystemManager()

        # Set the app configs
        self.app.config['device_manager'] = self.device_manager
        self.app.config['light_manager'] = self.light_manager
        self.app.config['preferences_manager'] = self.preferences_manager
        self.app.config['log_handler'] = self.log_handler
        self.app.config['wifi_manager'] = self.wifi_manager
        self.app.config['system_manager'] = self.system_manager

        # Register the blueprints
        self.app.register_blueprint(cameras_bp)
        self.app.register_blueprint(lights_bp)
        self.app.register_blueprint(logs_bp)
        self.app.register_blueprint(preferences_bp)
        self.app.register_blueprint(wifi_bp)
        self.app.register_blueprint(system_bp)

        # create the server and run everything
        self.http_server = WSGIServer(('0.0.0.0', port), self.app, log=None)

        def exit_clean(sig, frame):
            logging.info('Shutting down')

            self.light_manager.cleanup()
            self.http_server.stop()
            self.device_manager.stop_monitoring()
            self.broadcast_server.kill()
            self.wifi_manager.stop_scanning()

            sys.exit(0)


        signal.signal(signal.SIGINT, exit_clean)

        logging.info('Starting backend server on http://0.0.0.0:8080')

    def serve(self):
        self.device_manager.start_monitoring()
        self.wifi_manager.start_scanning()
        self.broadcast_server.run_in_background()
        self.http_server.serve_forever()

    def _handle_validation_error(self, e: ValidationError):
        logging.warning('Internal error occurred due to a malformed input.')
        response = {
            'error': 'Malformed input',
            'message': str(e.messages)
        }
        
        return jsonify(response), 400 # 400: Bad Request
    
    def _handle_device_not_found(self, e: DeviceNotFoundException):
        logging.warning(e)
        response = {
            'error': 'Device not found',
            'message': str(e)
        }
        return jsonify(response), 400 # 400: Bad Request
    
    def _handle_server_error(self, e: Exception):
        logging.error(e)
        response = {
            'error': 'Unhandled exception occurred within the server',
            'message': str(e)
        }
        return jsonify(response), 500
