from flask import Blueprint, request, jsonify, current_app
from ..services import WiFiManager

wifi_bp = Blueprint('wifi', __name__)

@wifi_bp.route('/wifi/status')
def wifi_status():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    return jsonify(wifi_manager.get_active_connection())

@wifi_bp.route('/wifi/access_points')
def access_points():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    return jsonify(wifi_manager.get_access_points())

@wifi_bp.route('/wifi/connections')
def list_wifi_connections():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    
    return jsonify(wifi_manager.list_connections())
