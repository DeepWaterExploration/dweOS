from flask import Blueprint, jsonify

status_bp = Blueprint('status', __name__, url_prefix='/api/status/')

@status_bp.route('/')
def restart():
    return jsonify({'status': 'running'})
