from fastapi import APIRouter, Depends, Request
from typing import List
from ..services import WiFiManager, NetworkConfigSchema, NetworkConfig, Status, AccessPoint, Connection, StaticIPConfiguration, NetworkPriority

wifi_router = APIRouter(tags=['wifi'])

@wifi_router.get('/wifi/status')
def wifi_status(request: Request) -> Status:
    wifi_manager: WiFiManager = request.app.state.wifi_manager
    active_connection = wifi_manager.get_status()
    return active_connection

@wifi_router.get('/wifi/access_points')
def access_points(request: Request) -> List[AccessPoint]:
    wifi_manager: WiFiManager = request.app.state.wifi_manager
    return wifi_manager.get_access_points()

@wifi_router.get('/wifi/connections')
def list_wifi_connections(request: Request) -> List[Connection]:
    wifi_manager: WiFiManager = request.app.state.wifi_manager
    return wifi_manager.list_connections()

@wifi_router.post('/wifi/connect')
def connect(request: Request, network_config: NetworkConfig):
    wifi_manager: WiFiManager = request.app.state.wifi_manager
    wifi_manager.connect(network_config.ssid, network_config.password)

    return {}

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

# Ethernet
@wifi_router.post('/wifi/set_static_ip')
async def set_static_ip(request: Request, static_ip_configuration: StaticIPConfiguration):
    wifi_manager: WiFiManager = request.app.state.wifi_manager

    await wifi_manager.set_static_ip_configuration(static_ip_configuration)

    return {}
    

@wifi_router.post('/wifi/set_network_priority')
def set_network_priority(request: Request, network_priority: NetworkPriority):
    wifi_manager: WiFiManager = request.app.state.wifi_manager

    wifi_manager.set_network_priority(network_priority)
