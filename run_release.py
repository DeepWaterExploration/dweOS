from flask import Flask, send_from_directory
from gevent.pywsgi import WSGIServer
import sys
import signal
import os
from backend_py.src import main
import multiprocessing
import subprocess
import logging

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

    print('Starting client server on http://0.0.0.0:5000')
    http_server = WSGIServer(('0.0.0.0', 5000), app, log=None)
    http_server.serve_forever()


if __name__ == '__main__':
    frontend_thread = multiprocessing.Process(target=run_frontend)
    frontend_thread.start()

    system_api_process = subprocess.Popen(
        ['go', 'run', '.'], cwd='./system_api')

    def exit_clean(sig, frame):
        print('Exiting')
        frontend_thread.kill()
        system_api_process.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, exit_clean)

    main()
