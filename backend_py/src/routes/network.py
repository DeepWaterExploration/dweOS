from fastapi import APIRouter, Request

from ..services.network import (
    ConnectionProfileModel,
    IPV4Configuration,
    NetworkWrapper,
    WiredDeviceModel,
)

network_router = APIRouter(tags=["network"])


# Ethernet
@network_router.get("/wired/devices", summary="Get the wired devices")
def get_wired_devices(request: Request) -> list[WiredDeviceModel]:
    network_manager: NetworkWrapper = request.app.state.network_manager
    return network_manager.get_wired_devices()


@network_router.get("/connection_profiles", summary="Get the connection profiles")
def get_connection_profiles(request: Request) -> list[ConnectionProfileModel]:
    network_manager: NetworkWrapper = request.app.state.network_manager
    return network_manager.get_connection_profiles()


@network_router.post(
    "/update_connection_profile", summary="Update the profile of a given nmconnection"
)
async def update_connection_profile(
    request: Request, path: str, ip_configuration: IPV4Configuration
) -> dict:
    # TODO: change return type to a proper schema
    network_manager: NetworkWrapper = request.app.state.network_manager
    return {
        "status": await network_manager.update_connection_profile(
            path, ip_configuration
        )
    }


@network_router.post(
    "/wired/activate_profile", summary="Activate a given profile for a device"
)
async def activate_profile(request: Request, interface: str, profile_path: str) -> dict:
    network_manager: NetworkWrapper = request.app.state.network_manager
    return {"status": await network_manager.activate_interface(interface, profile_path)}
