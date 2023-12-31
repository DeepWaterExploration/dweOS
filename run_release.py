import subprocess
from flask import Flask, send_from_directory
import eventlet
from eventlet import wsgi
import sys
import signal
import os

if __name__ == '__main__':
    BACKEND_CMD = './run.sh'
    FRONTEND_DIR = os.path.abspath('./frontend')

    app = Flask(__name__)


    backend_process = subprocess.Popen(BACKEND_CMD.split(' '), cwd='backend_py')

    def exit_clean(sig, frame):
        print('Exiting')
        backend_process.send_signal(sig=signal.SIGKILL)
        sys.exit(0)

    @app.route('/',  defaults={'path': 'index.html'})
    @app.route('/<path:path>')
    def index(path):
        return send_from_directory(FRONTEND_DIR, path)

    @app.errorhandler(404)
    def not_found(e):
        return send_from_directory(FRONTEND_DIR,'index.html')
    
    signal.signal(signal.SIGINT, exit_clean)

    wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)
    
    
