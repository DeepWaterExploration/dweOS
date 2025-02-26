from fastapi import APIRouter, Depends, Request
from typing import List
from ..services import (
    AsyncNetworkManager,
    IPConfiguration,
    NetworkPriorityInformation,
)

wired_router = APIRouter(tags=["wired"])


# Ethernet
@wired_router.get(
    "/wired/get_ip_configuration", summary="Get the ethernet IP configuration"
)
def get_ip_configuration(request: Request) -> IPConfiguration:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager

    return wifi_manager.get_ip_configuration()


@wired_router.post(
    "/wired/set_ip_configuration", summary="Update the ethernet IP configuration"
)
async def set_static_ip(request: Request, ip_configuration: IPConfiguration):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    return {"status": await wifi_manager.set_ip_configuration(ip_configuration)}


@wired_router.post("/wired/set_network_priority", summary="Set the network priority")
async def set_network_priority(
    request: Request, network_priority: NetworkPriorityInformation
):
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    await wifi_manager.set_network_priority(network_priority.network_priority)
    return {}


@wired_router.get("/wired/get_network_priority", summary="Get the network priority")
async def getet_network_priority(request: Request) -> NetworkPriorityInformation:
    wifi_manager: AsyncNetworkManager = request.app.state.wifi_manager
    network_priority = NetworkPriorityInformation(
        network_priority=wifi_manager.get_network_priority()
    )
    return network_priority
