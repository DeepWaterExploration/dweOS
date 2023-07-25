import psutil
from wifi import Cell, Scheme


class WiFiNetwork:
    def __init__(
        self, ssid: str, security: str, frequency: float, signal_strength: int
    ) -> None:
        """
        Represents a WiFi network.

        Parameters:
        - ssid (str): The network's SSID (Service Set Identifier).
        - security (str): The security protocol used by the network (e.g., WPA2, WPA3, Open).
        - frequency (float): The operating frequency of the network in GHz (e.g., 2.4, 5.0).
        - signal_strength (int): The signal strength of the network at the current location in dBm.
        """
        self.ssid = ssid
        self.security = security
        self.frequency = frequency
        self.signal_strength = signal_strength

    def __str__(self) -> str:
        """
        Returns a string representation of the WiFi network.
        """
        return f"SSID: {self.ssid}, Security: {self.security}, Frequency: {self.frequency} GHz, Signal Strength: {self.signal_strength} dBm"


def get_all_interfaces():
    """
    Returns a list of all network interfaces on the system.

    Returns:
    - interfaces (list): A list of all network interfaces on the system.
    """
    interfaces = psutil.net_if_stats().keys()
    return list(interfaces)


def scan_wifi_networks(interface):
    """
    Returns a list of WiFiNetwork objects representing the WiFi networks available on the given interface.

    Parameters:
    - interface (str): The name of the network interface to scan for WiFi networks.

    Returns:
    - wifi_networks (list): A list of WiFi networks available on the given interface.
    """
    return Cell.all(interface)


def get_wifi_info():
    wifi_info = {"interfaces": [], "wifi_networks": []}
    interfaces = get_all_interfaces()
    print(interfaces)
    for interface in interfaces:
        try:
            for network in scan_wifi_networks(interface):
                if network.ssid == "" or network.ssid is None:
                    continue
                wifi_info["wifi_networks"].append(
                    {
                        "ssid": network.ssid,
                        "security": network.encryption_type,
                        "frequency": network.frequency,
                        "signal_strength": int(network.signal),
                    }
                )
            wifi_info["interfaces"].append(interface)
        except:
            # Skip interfaces that don't support scanning for WiFi networks
            pass
    return wifi_info


def connect_to_wifi():
    pass
