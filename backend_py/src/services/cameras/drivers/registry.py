from dataclasses import dataclass

from backend_py.src.models import (
    DeviceType,
)


@dataclass(frozen=True)
class DeviceMetadata:
    """
    Metadata for a Device class
    """

    name: str
    device_type: DeviceType
    manufacturer: str = "DeepWater Exploration Inc."


# DWE Device registry for supported cameras in dweOS
DEVICE_REGISTRY: dict[tuple[int, int], DeviceMetadata] = {
    # Legacy VID
    (0x0C45, 0x6366): DeviceMetadata("exploreHD", DeviceType.EXPLOREHD),
    (0x0C45, 0x6367): DeviceMetadata("stellarHD: Leader", DeviceType.STELLARHD_LEADER),
    (0x0C45, 0x6368): DeviceMetadata(
        "stellarHD: Follower", DeviceType.STELLARHD_FOLLOWER
    ),
    # exploreHD
    (0x3961, 0x2100): DeviceMetadata("exploreHD", DeviceType.EXPLOREHD),
    (0x3961, 0x2200): DeviceMetadata("exploreHD Heavy", DeviceType.EXPLOREHD),
    (0x3961, 0x2210): DeviceMetadata("exploreHD Heavy (AQ)", DeviceType.EXPLOREHD),
    # stellarHD Elite
    (0x3961, 0x1211): DeviceMetadata(
        "stellarHD Elite (AQ-L)", DeviceType.STELLARHD_LEADER
    ),
    (0x3961, 0x1212): DeviceMetadata(
        "stellarHD Elite (AQ-F)", DeviceType.STELLARHD_FOLLOWER
    ),
    (0x3961, 0x1201): DeviceMetadata(
        "stellarHD Elite (L)", DeviceType.STELLARHD_LEADER
    ),
    (0x3961, 0x1202): DeviceMetadata(
        "stellarHD Elite (F)", DeviceType.STELLARHD_FOLLOWER
    ),
    # stellarHD Standard
    (0x3961, 0x1111): DeviceMetadata("stellarHD (AQ-L)", DeviceType.STELLARHD_LEADER),
    (0x3961, 0x1112): DeviceMetadata("stellarHD (AQ-F)", DeviceType.STELLARHD_FOLLOWER),
    (0x3961, 0x1101): DeviceMetadata("stellarHD (L)", DeviceType.STELLARHD_LEADER),
    (0x3961, 0x1102): DeviceMetadata("stellarHD (F)", DeviceType.STELLARHD_FOLLOWER),
    # explore3D
    (0x3961, 0x3112): DeviceMetadata("explore3D (Left)", DeviceType.STELLARHD_FOLLOWER),
    (0x3961, 0x3111): DeviceMetadata("explore3D (Right)", DeviceType.STELLARHD_LEADER),
}


def lookup_vid_pid(vid: int, pid: int) -> DeviceMetadata | None:
    try:
        return DEVICE_REGISTRY[(vid, pid)]
    except KeyError:
        return None
