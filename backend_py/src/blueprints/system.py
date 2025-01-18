from flask import Blueprint, request, jsonify, current_app
from ..services import SystemManager
import logging

system_bp = Blueprint('system', __name__, url_prefix='/api/system/')

@system_bp.route('/restart', methods=['POST'])
def restart():
    system_manager: SystemManager = current_app.config['system_manager']
    system_manager.restart_system()
    return jsonify({})

@system_bp.route('/shutdown', methods=['POST'])
def shutdown():
    system_manager: SystemManager = current_app.config['system_manager']
    system_manager.shutdown_system()
    return jsonify({})
