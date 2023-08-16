from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class SecurityType(str, Enum):
    """Represents the security type of a Wifi network"""

    WPA = "WPA"  # WPA security
    WEP = "WEP"  # WEP security
    WSN = "WSN"  # WSN security


class ScannedWifiNetwork(BaseModel):
    """Represents a Wifi network scanned from the network interface"""

    ssid: Optional[str]  # Network SSID (can be hidden)
    frequency: int  # Network frequency
    mac_address: str  # Network BSSID (always available)
    secure: bool  # Whether the network is secure
    security_type: Optional[List[SecurityType]]  # Network security type
    signal_strength: int  # Network signal strength

    def to_dict(self):
        return {
            "ssid": self.ssid,
            "frequency": self.frequency,
            "mac_address": self.mac_address,
            "secure": self.secure,
            "security_type": self.security_type,
            "signal_strength": self.signal_strength,
        }


class SavedWifiNetwork(BaseModel):
    """Represents a Wifi network saved in the network interface"""

    network_id: int  # Network ID (unique identifier)
    ssid: str  # Network SSID
    bssid: str  # Network BSSID
    connected: bool  # Whether the network is connected

    def to_dict(self):
        return {
            "network_id": self.network_id,
            "ssid": self.ssid,
            "bssid": self.bssid,
            "connected": self.connected,
        }


class ConnectedWifiNetwork(BaseModel):
    """Represents a Wifi network connected to the network interface"""

    ssid: str  # Network SSID (can be hidden)
    frequency: int  # Network frequency
    mac_address: str  # Network BSSID (always available)
    secure: bool  # Whether the network is secure
    security_type: Optional[List[SecurityType]]  # Network security type
    signal_strength: int  # Network signal strength
    network_id: int  # Network ID (unique identifier)

    def to_dict(self):
        return {
            "ssid": self.ssid,
            "frequency": self.frequency,
            "mac_address": self.mac_address,
            "secure": self.secure,
            "security_type": self.security_type,
            "signal_strength": self.signal_strength,
            "network_id": self.network_id,
            "ssid": self.ssid,
        }


class WifiCredentials(BaseModel):
    """Represents a Wifi credential for connecting to a Wifi Network"""

    ssid: str  # Network SSID
    password: str  # Network password


class ConnectionStatus(str, Enum):
    DISCONNECTING = "DISCONNECTING"  # Disconnecting from a network
    JUST_DISCONNECTED = "JUST_DISCONNECTED"  # Just disconnected from a network
    STILL_DISCONNECTED = "STILL_DISCONNECTED"  # Still disconnected from a network
    CONNECTING = "CONNECTING"  # Connecting to a network
    JUST_CONNECTED = "JUST_CONNECTED"  # Just connected to a network
    STILL_CONNECTED = "STILL_CONNECTED"  # Still connected to a network
    UNKNOWN = "UNKNOWN"  # Unknown connection status
