from flask import Blueprint, jsonify, current_app
from ..logging import LogHandler

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/logs', methods=['GET'])
def get_logs():
    log_handler: LogHandler = current_app.config['log_handler']

    return jsonify(log_handler.logs)