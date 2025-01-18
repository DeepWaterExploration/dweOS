from flask import Flask, send_from_directory, jsonify
from gevent.pywsgi import WSGIServer
import sys
import signal
import os
from backend_py.src import Server, FeatureSupport
from flask_socketio import SocketIO
import multiprocessing
import logging
import argparse

logging.getLogger().setLevel(logging.INFO)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

def run_frontend(port):
    FRONTEND_DIR = os.path.abspath('./frontend/dist')

    @app.route('/',  defaults={'path': 'index.html'})
    @app.route('/<path:path>')
    def index(path):
        return send_from_directory(FRONTEND_DIR, path)
    
    blueos_extension = {
        'name': 'dwe_os_2',
        'description': 'Web-based driver and software interface for DWE.ai cameras',
        'icon': 'mdi-camera-plus',
        'company': 'DeepWater Exploration',
        'version': '1.0.0',
        'webpage': 'https://dwe.ai/products/dwe-os',
        'api': 'https://dwe.ai/products/dwe-os'
    }

    @app.route('/register_service')
    def register_service():
        return jsonify(blueos_extension)

    @app.errorhandler(404)
    def not_found(e):
        return send_from_directory(FRONTEND_DIR, 'index.html')

    logging.info(f'Starting client server on http://0.0.0.0:{port}')
    # http_server = WSGIServer(('0.0.0.0', port), app, log=None)
    # http_server.serve_forever()
    socketio.run(app, host='0.0.0.0', port=port)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the server with parameters')
    parser.add_argument('--no-ttyd', action='store_true', help='Disable ttyd server')
    parser.add_argument('--no-wifi', action='store_true', help='Disable WiFi')
    parser.add_argument('--port', type=int, default=80, help='Set the port of the server')
    parser.add_argument('--settings-path', type=str, default='.', help='The path for the settings file (for docker use)')

    args = parser.parse_args()

    server = Server(app=app, socketio=socketio, settings_path=args.settings_path, feature_support=FeatureSupport(ttyd=not args.no_ttyd, wifi=not args.no_wifi), port=args.port)
    server.serve()
    run_frontend(args.port)

