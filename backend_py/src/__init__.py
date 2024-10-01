from ctypes import *
import sys
import signal

from flask import Flask, jsonify, request
from flask_cors import CORS
from gevent.pywsgi import WSGIServer

from .websockets.broadcast_server import BroadcastServer

from .services import *
from .blueprints import cameras_bp, lights_bp, logs_bp, preferences_bp, wifi_bp
from .logging import LogHandler

import logging


def main():
    # Create the flask application
    app = Flask(__name__)
    CORS(app)
    # avoid sorting the keys to keep the way we sort it in the backend
    app.json.sort_keys = False

    # Create the managers
    settings_manager = SettingsManager()
    broadcast_server = BroadcastServer()
    device_manager = DeviceManager(
        settings_manager=settings_manager, broadcast_server=broadcast_server)
    light_manager = LightManager(create_pwm_controllers())
    preferences_manager = PreferencesManager()
    wifi_manager = WiFiManager()

    # Create the logging handler
    log_handler = LogHandler(broadcast_server)
    logging.getLogger().addHandler(log_handler)
    logging.info('Log handler started...')

    # Set the app configs
    app.config['device_manager'] = device_manager
    app.config['light_manager'] = light_manager
    app.config['preferences_manager'] = preferences_manager
    app.config['log_handler'] = log_handler
    app.config['wifi_manager'] = wifi_manager

    # Register the blueprints
    app.register_blueprint(cameras_bp)
    app.register_blueprint(lights_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(preferences_bp)
    app.register_blueprint(wifi_bp)

    # create the server and run everything
    http_server = WSGIServer(('0.0.0.0', 8080), app, log=None)
    device_manager.start_monitoring()
    wifi_manager.start_scanning()

    def exit_clean(sig, frame):
        logging.info('Shutting down')

        light_manager.cleanup()

        http_server.stop()
        device_manager.stop_monitoring()
        broadcast_server.kill()
        wifi_manager.stop_scanning()

        sys.exit(0)

    broadcast_server.run_in_background()
    signal.signal(signal.SIGINT, exit_clean)

    logging.info('Starting backend server on http://0.0.0.0:8080')
    http_server.serve_forever()


if __name__ == '__main__':
    main()
