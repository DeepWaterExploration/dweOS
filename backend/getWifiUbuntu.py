from prettytable import PrettyTable
import platform
import subprocess
import re
import os


def scan_wifi_networks():
    system_name = platform.system()
    if (
        system_name.lower() == "linux"
        and "raspberrypi" in platform.uname().node.lower()
    ):
        try:
            # Start NetworkManager service with sudo
            os.system("sudo service NetworkManager start")
        except subprocess.CalledProcessError as e:
            print("Error:", e)
    scan_output = subprocess.check_output(["sudo", "nmcli", "device", "wifi", "list"])
    wifi_networks = []
    for line in scan_output.split(b"\n"):
        line = line.strip()
        if b"IN-USE" in line:
            continue
        ssid_match = re.search(b"^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)", line)
        if ssid_match:
            ssid = ssid_match.group(1).decode()
            bssid = ssid_match.group(2).decode()
            signal_strength_str = ssid_match.group(4).decode()
            if bssid == "--" or ssid == "*":  # Skip networks with BSSID as "--" or SSID as "*"
                continue
            signal_strength = (
                int(signal_strength_str) if signal_strength_str.isdigit() else -1
            )
            wifi_networks.append(
                {
                    "SSID": ssid,
                    "BSSID": bssid,
                    "Signal Strength": signal_strength,
                }
            )
    return wifi_networks


if __name__ == "__main__":
    networks_table = PrettyTable()
    wifi_networks = scan_wifi_networks()

    networks_table.field_names = ["SSID", "BSSID", "Signal Strength (dBm)"]
    for network in wifi_networks:
        networks_table.add_row(
            [network["SSID"], network["BSSID"], network["Signal Strength"]]
        )

    print(networks_table)
