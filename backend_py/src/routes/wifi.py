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


@wifi_router.get("/wifi/status")
def wifi_status(request: Request) -> Status:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    active_connection = wifi_manager.get_status()
    return active_connection


@wifi_router.get("/wifi/access_points")
def access_points(request: Request) -> List[AccessPoint]:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return wifi_manager.get_access_points()


@wifi_router.get("/wifi/connections")
def list_wifi_connections(request: Request) -> List[Connection]:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return wifi_manager.list_connections()


@wifi_router.post("/wifi/connect")
async def connect(request: Request, network_config: NetworkConfig):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    result = await wifi_manager.connect(network_config.ssid, network_config.password)

    return {"result": result}


@wifi_router.post("/wifi/disconnect")
async def disconnect(request: Request):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.disconnect()}


@wifi_router.post("/wifi/forget")
async def forget(request: Request, network_config: NetworkConfig):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.forget(network_config.ssid)}


# Ethernet
@wifi_router.get(
    "/wifi/get_ip_configuration", summary="Get the ethernet IP configuration"
)
def get_ip_configuration(request: Request) -> IPConfiguration:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager

    return wifi_manager.get_ip_configuration()


@wifi_router.post(
    "/wifi/set_ip_configuration", summary="Update the ethernet IP configuration"
)
async def set_static_ip(request: Request, ip_configuration: IPConfiguration):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.set_ip_configuration(ip_configuration)}


@wifi_router.post("/wifi/set_network_priority")
async def set_network_priority(
    request: Request, network_priority: NetworkPriorityInformation
):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    await wifi_manager.set_network_priority(network_priority.network_priority)
    return {}


@wifi_router.get("/wifi/get_network_priority")
async def getet_network_priority(request: Request) -> NetworkPriorityInformation:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    network_priority = NetworkPriorityInformation(
        network_priority=wifi_manager.get_network_priority()
    )
    return network_priority
