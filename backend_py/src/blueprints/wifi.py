from flask import Blueprint, request, jsonify, current_app
from ..services import WiFiManager, NetworkConfigSchema, NetworkConfig
from marshmallow import ValidationError

wifi_bp = Blueprint('wifi', __name__)

@wifi_bp.route('/wifi/status')
def wifi_status():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    # NOTE: try/except blocks are placed for each function in WiFi manager that can throw errors
    # If there is an error, the API would benefit from trying again at a later time, the device may just be busy
    try:
        active_connection = wifi_manager.get_active_connection()
        return jsonify(active_connection)
    except:
        return jsonify({})

@wifi_bp.route('/wifi/access_points')
def access_points():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    try:
        return jsonify(wifi_manager.get_access_points())
    except:
        return jsonify({})

@wifi_bp.route('/wifi/connections')
def list_wifi_connections():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    try:
        return jsonify(wifi_manager.list_connections())
    except:
        return jsonify({})

@wifi_bp.route('/wifi/connect', methods=['POST'])
def connect():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    try:
        network_config: NetworkConfig = NetworkConfigSchema().load(request.get_json())
        return jsonify({'status': wifi_manager.connect(network_config.ssid, network_config.password)})
    except ValidationError as e:
        return jsonify({'Error': e.messages})

@wifi_bp.route('/wifi/disconnect', methods=['POST'])
def disconnect():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    wifi_manager.disconnect()
    return jsonify({})
