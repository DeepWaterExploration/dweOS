from fastapi import APIRouter, Depends, Request
from typing import List

from ..services import (
    AsyncNetworkManager,
    NetworkConfig,
    Status,
    AccessPoint,
    Connection,
    IPConfiguration,
    NetworkPriorityInformation,
    ConnectionResultModel,
    IPListConfig
)

wifi_router = APIRouter(tags=["wifi"])


@wifi_router.get("/wifi/status", summary="Get the WiFi Status")
def wifi_status(request: Request) -> Status:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    active_connection = wifi_manager.get_status()
    return active_connection


@wifi_router.get("/wifi/access_points", summary="Get the scanned access points")
def access_points(request: Request) -> List[AccessPoint]:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    aps = wifi_manager.get_access_points()

    ap_list = []
    for ap in aps:
        try:
            requires_password = wifi_manager._requires_password(ap)
            ap_list.append({
                "ssid": ap.ssid,
                "strength": ap.strength,
                "requires_password": requires_password
            })
        except Exception as e:
            #Network is no longer available, ignore it
            continue
    return ap_list


@wifi_router.get("/wifi/connections", summary="Get the known WiFi connections list")
def list_wifi_connections(request: Request) -> List[Connection]:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return wifi_manager.list_connections()


@wifi_router.post("/wifi/connect", summary="Connect to a network")
async def connect(request: Request, network_config: NetworkConfig) -> ConnectionResultModel:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    result = await wifi_manager.connect(network_config.ssid, network_config.password)

    return ConnectionResultModel(result=result)


@wifi_router.post("/wifi/disconnect", summary="Disconnect from the connected network")
async def disconnect(request: Request):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.disconnect()}


@wifi_router.post("/wifi/forget", summary="Forget a network")
async def forget(request: Request, network_config: NetworkConfig):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.forget(network_config.ssid)}

@wifi_router.post("/wifi/off", summary="Turn off WiFi")
async def wifi_off(request: Request):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.turn_off_wifi()}
@wifi_router.post("/wifi/on", summary="Turn on WiFi")
async def wifi_on(request: Request):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.turn_on_wifi()}

@wifi_router.get("/wifi/ip_addresses", summary="List all IP addresses")
async def list_ip_addresses(request: Request) -> List[IPListConfig]:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    ip_addresses = await wifi_manager.list_ip_addresses()
    return [IPListConfig(ip_address=ip, device_name=device) for device, ip in ip_addresses]