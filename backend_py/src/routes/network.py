from fastapi import APIRouter, Depends, Request
from typing import List
from ..services import (
    NetworkWrapper, IPV4Configuration, WiredDeviceModel, ConnectionProfileModel
)

network_router = APIRouter(tags=["network"])


# Ethernet
@network_router.get(
    "/wired/devices", summary="Get the wired devices"
)
def get_wired_devices(request: Request) -> List[WiredDeviceModel]:
    network_manager: NetworkWrapper = request.app.state.network_manager
    return network_manager.get_wired_devices()


@network_router.get(
    "/connection_profiles", summary="Get the connection profiles"
)
def get_connection_profiles(request: Request) -> List[ConnectionProfileModel]:
    network_manager: NetworkWrapper = request.app.state.network_manager
    return network_manager.get_connection_profiles()


@network_router.post(
    "/set_ip_configuration", summary="Update the ethernet IP configuration"
)
async def set_static_ip(request: Request, ip_configuration: IPV4Configuration):
    network_manager: NetworkWrapper = request.app.state.wifi_manager
    return {"status": await network_manager.set_ip_configuration(ip_configuration)}
