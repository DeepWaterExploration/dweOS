from flask import Blueprint, jsonify

status_bp = Blueprint('status', __name__)

@status_bp.route('/status')
def restart():
    return jsonify({'status': 'running'})
