import platform, subprocess

def shut_down():
    match platform.system():
        case "Windows":
            cmd = "shutdown /s /t 1"
        case "Linux":
            cmd = "sudo shutdown -h now"
        case "Darwin":
            cmd = "sudo shutdown -h now"
        case _:
            raise NotImplementedError("Unsupported platform")
    subprocess.call(cmd, shell=True)
def restart_machine():
    match platform.system():
        case "Windows":
            cmd = "shutdown /r /t 0"
        case "Linux":
            cmd = "sudo reboot"
        case "Darwin":
            cmd = "sudo reboot"
        case _:
            raise NotImplementedError("Unsupported platform")
    subprocess.call(cmd, shell=True)
