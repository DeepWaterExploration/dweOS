from flask import Blueprint, request, jsonify, current_app
from ..services import LightManager

lights_bp = Blueprint('lights', __name__)

@lights_bp.route('/lights/')
def get_lights():
    light_manager: LightManager = current_app.config['light_manager']

    return jsonify(light_manager.get_lights())

@lights_bp.route('/lights/set_intensity', methods=['POST'])
def set_intensity():
    light_manager: LightManager = current_app.config['light_manager']

    req = request.get_json()
    light_manager.set_intensity(req['index'], req['intensity'])
    return jsonify({})

@lights_bp.route('/lights/disable_pin', methods=['POST'])
def disable_light():
    light_manager: LightManager = current_app.config['light_manager']

    req = request.get_json()
    light_manager.disable_light(req['controller_index'], req['pin'])
    return jsonify({})
