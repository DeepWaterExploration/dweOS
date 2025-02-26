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
    return wifi_manager.get_access_points()


@wifi_router.get("/wifi/connections", summary="Get the known WiFi connections list")
def list_wifi_connections(request: Request) -> List[Connection]:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return wifi_manager.list_connections()


@wifi_router.post("/wifi/connect", summary="Connect to a network")
async def connect(request: Request, network_config: NetworkConfig):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    result = await wifi_manager.connect(network_config.ssid, network_config.password)

    return {"result": result}


@wifi_router.post("/wifi/disconnect", summary="Disconnect from the connected network")
async def disconnect(request: Request):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.disconnect()}


@wifi_router.post("/wifi/forget", summary="Forget a network")
async def forget(request: Request, network_config: NetworkConfig):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.forget(network_config.ssid)}
