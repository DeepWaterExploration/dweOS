from typing import List
import subprocess, os, select, socket

def find_valid_interfaces() -> List[str]:
    """Returns a list of valid network interfaces."""
    try:
        return (
            subprocess.check_output(
                "iwconfig 2>/dev/null | grep -o '^[[:alnum:]]*'", shell=True
            )
            .decode()
            .split()
        )
    except subprocess.CalledProcessError:
        return []

wpa_send_path = f"/run/wpa_supplicant/{find_valid_interfaces()[0]}"
wpa_recv_path = "/tmp/wpa_ctrl_{pid}-{count}".format(pid=os.getpid(), count=1)

soc = socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM, 0)
soc.bind(wpa_recv_path)
soc.connect(wpa_send_path)

print("> PING")
soc.send(b"PING")
print("<", soc.recv(4096).decode().strip())
