from flask import Flask, send_from_directory
from gevent.pywsgi import WSGIServer
import sys
import signal
import os
from backend_py.src import Server, ServerOptions
import multiprocessing
import logging
import argparse

logging.getLogger().setLevel(logging.INFO)


def run_frontend():
    app = Flask(__name__)
    FRONTEND_DIR = os.path.abspath('./frontend/dist')

    @app.route('/',  defaults={'path': 'index.html'})
    @app.route('/<path:path>')
    def index(path):
        return send_from_directory(FRONTEND_DIR, path)

    @app.errorhandler(404)
    def not_found(e):
        return send_from_directory(FRONTEND_DIR, 'index.html')

    logging.info('Starting client server on http://0.0.0.0:5000')
    http_server = WSGIServer(('0.0.0.0', 5000), app, log=None)
    http_server.serve_forever()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the server with parameters')
    parser.add_argument('--no-ttyd', action='store_true', help='Disable ttyd server')

    args = parser.parse_args()

    frontend_thread = multiprocessing.Process(target=run_frontend)
    frontend_thread.start()

    def exit_clean(sig, frame):
        logging.info('Exiting')
        frontend_thread.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, exit_clean)

    server = Server(server_options=ServerOptions(no_ttyd=args.no_ttyd))
    server.serve()
