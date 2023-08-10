from enum import Enum
from typing import Optional

from pydantic import BaseModel

class SecurityType(str, Enum):
    """Represents the security type of a Wifi network"""
    OPEN = "OPEN" # No security
    WEP = "WEP" # WEP security
    WPA_PSK = "WPA_PSK" # WPA PSK security
    WPA_EAP = "WPA_EAP" # WPA EAP security
    IEEE8021X = "IEEE8021X" # IEEE 802.1X security
    UNKNOWN = "UNKNOWN" # Unknown security type

class ScannedWifiNetwork(BaseModel):
    """Represents a Wifi network scanned from the network interface"""
    ssid: Optional[str] # Network SSID (can be hidden)
    bssid: str # Network BSSID (always available)
    secure: bool # Whether the network is secure
    security_type: Optional[SecurityType] # Network security type
    frequency: int # Network frequency
    signal_strength: int # Network signal strength

class SavedWifiNetwork(BaseModel):
    """Represents a Wifi network saved in the network interface"""
    network_id: int # Network ID (unique identifier)
    ssid: str # Network SSID
    bssid: str # Network BSSID

class WifiCredentials(BaseModel):
    """Represents a Wifi credential for connecting to a Wifi Network"""
    ssid: str # Network SSID
    password: str # Network password

class ConnectionStatus(str, Enum):
    DISCONNECTING = "DISCONNECTING" # Disconnecting from a network
    JUST_DISCONNECTED = "JUST_DISCONNECTED" # Just disconnected from a network
    STILL_DISCONNECTED = "STILL_DISCONNECTED" # Still disconnected from a network
    CONNECTING = "CONNECTING" # Connecting to a network
    JUST_CONNECTED = "JUST_CONNECTED" # Just connected to a network
    STILL_CONNECTED = "STILL_CONNECTED" # Still connected to a network
    UNKNOWN = "UNKNOWN" # Unknown connection status
