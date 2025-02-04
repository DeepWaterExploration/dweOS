from fastapi import APIRouter, Depends, Request
from typing import List
from ..services import WiFiManager, NetworkConfigSchema, NetworkConfig, Status, AccessPoint, Connection

wifi_router = APIRouter(tags=['wifi'])

@wifi_router.get('/wifi/status', response_class=Status)
def wifi_status(request: Request):
    wifi_manager: WiFiManager = request.app.state.wifi_manager
    active_connection = wifi_manager.get_status()
    return active_connection

@wifi_router.get('/wifi/access_points', response_model=List[AccessPoint])
def access_points(request: Request):
    wifi_manager: WiFiManager = request.app.state.wifi_manager
    return wifi_manager.get_access_points()

@wifi_router.get('/wifi/connections', response_model=List[Connection])
def list_wifi_connections(request: Request):
    wifi_manager: WiFiManager = request.app.state.wifi_manager
    return wifi_manager.list_connections()

@wifi_router.post('/wifi/connect')
def connect(request: Request, network_config: NetworkConfig):
    wifi_manager: WiFiManager = request.app.state.wifi_manager

    return {'status': wifi_manager.connect(network_config.ssid, network_config.password)}

@wifi_router.post('/wifi/disconnect')
def disconnect(request: Request):
    wifi_manager: WiFiManager = request.app.state.wifi_manager
    wifi_manager.disconnect()
    return {}

@wifi_router.post('/wifi/forget')
def forget(request: Request, network_config: NetworkConfig):
    wifi_manager: WiFiManager = request.app.state.wifi_manager

    wifi_manager.forget(network_config.ssid)
    return {}
