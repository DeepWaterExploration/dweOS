import platform


def get_windows_temperature():
    # Import Windows-specific modules here
    import wmi

    w = wmi.WMI(namespace="root\\cimv2")
    temperature_info = w.query("SELECT * FROM Win32_TemperatureProbe")
    temperature = temperature_info[0].CurrentReading / 10.0
    return temperature


def get_linux_temperature():
    import subprocess

    result = subprocess.check_output(["sensors"], universal_newlines=True)
    temperature = None
    for line in result.splitlines():
        if (
            "Core 0" in line
        ):  # Replace 'Core 0' with the sensor label relevant to your system
            temperature = float(line.split()[2][1:])
            break


def get_mac_temperature():
    from osxtemperature import temperature

    temperature_info = temperature()
    return temperature_info["TCXC"]


def get_temperature():
    cpu_temperature = None
    match platform.system():
        case "Windows":
            cpu_temperature = get_windows_temperature()
        case "Linux":
            cpu_temperature = get_linux_temperature()
        case "Darwin":
            cpu_temperature = get_mac_temperature()
        case _:
            raise NotImplementedError("Unsupported platform")
    temp_info = {"processor_temp": cpu_temperature}
    return temp_info
