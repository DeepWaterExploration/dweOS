from flask import Blueprint, request, jsonify, current_app
from ..services import WiFiManager, NetworkConfigSchema, NetworkConfig
from marshmallow import ValidationError

wifi_bp = Blueprint('wifi', __name__, url_prefix='/api/wifi')

@wifi_bp.route('/status')
def wifi_status():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    active_connection = wifi_manager.get_status()
    return jsonify(active_connection)

@wifi_bp.route('/access_points')
def access_points():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    return jsonify(wifi_manager.get_access_points())

@wifi_bp.route('/connections')
def list_wifi_connections():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    return jsonify(wifi_manager.list_connections())

@wifi_bp.route('/connect', methods=['POST'])
def connect():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    network_config: NetworkConfig = NetworkConfigSchema().load(request.get_json())
    return jsonify({'status': wifi_manager.connect(network_config.ssid, network_config.password)})

@wifi_bp.route('/disconnect', methods=['POST'])
def disconnect():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    wifi_manager.disconnect()
    return jsonify({})

@wifi_bp.route('/forget', methods=['POST'])
def forget():
    wifi_manager: WiFiManager = current_app.config['wifi_manager']
    network_config: NetworkConfig = NetworkConfigSchema(only=['ssid']).load(request.get_json())
    wifi_manager.forget(network_config.ssid)
    return jsonify({})
