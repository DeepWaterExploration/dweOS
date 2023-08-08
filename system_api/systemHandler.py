import platform, subprocess

def shut_down():
    current_os = platform.system()
    if current_os == "Windows":
        cmd = "shutdown /s /t 1"
    if current_os == "Linux":
        cmd = "sudo shutdown -h now"
    if current_os == "Darwin":
        cmd = "sudo shutdown -h now"
    else:
        raise NotImplementedError("Unsupported platform")
    subprocess.call(cmd, shell=True)
def restart_machine():
    current_os = platform.system()
    if current_os ==  "Windows":
        cmd = "shutdown /r /t 0"
    if current_os ==  "Linux":
        cmd = "sudo reboot"
    if current_os ==  "Darwin":
        cmd = "sudo reboot"
    else:
        raise NotImplementedError("Unsupported platform")
    subprocess.call(cmd, shell=True)
