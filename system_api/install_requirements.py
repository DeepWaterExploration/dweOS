import importlib
import os
import platform
import subprocess


def install_missing_packages():
    current_os = platform.system()
    required_packages = [
        {
            "module_name": "psutil",
            "pip_name": "psutil",
        },
        {
            "module_name": "netifaces",
            "pip_name": "netifaces",
        },
        {
            "module_name": "cpuinfo",
            "pip_name": "py-cpuinfo",
        },
        {
            "module_name": "pywifi",
            "pip_name": "pywifi",
        },
        {
            "module_name": "loguru",
            "pip_name": "loguru",
        },
        {
            "module_name": "pydantic",
            "pip_name": "pydantic",
        },
    ]
    if current_os == "Windows":
        pip_command = "runas /user:Administrator python -m pip install"
        required_packages.append(
            {
                "module_name": "wmi",
                "pip_name": "wmi",
            },
        )
    else:
        try:
            print("Trying to run pip3")
            subprocess.run(
                "sudo python3 -m pip --version",
                check=True,
                shell=True,
                capture_output=True,
                text=True,
            )
        # Command not found
        except Exception:
            print("Failed, trying to install pip3")
            subprocess.run(
                "sudo apt install python3-pip -y",
                shell=True,
                capture_output=True,
                text=True,
            )
        pip_command = "sudo python3 -m pip install"
    if current_os == "Darwin":
        required_packages.append(
            {
                "module_name": "plistlib",
                "pip_name": "plistlib",
            },
        )

    missing_packages = []
    for package in required_packages:
        try:
            importlib.import_module(package["module_name"])
            # importlib.remove_module(package["module_name"])
        except ImportError:
            missing_packages.append(package["pip_name"])
    if missing_packages:
        print("Installing missing packages:")
        for package in missing_packages:
            print(f"{package} - {pip_command + package}:")
            try:
                subprocess.run(
                    f"{pip_command} {package}",
                    shell=True,
                    capture_output=True,
                    text=True,
                )
            except Exception:
                print(
                    f"Failed to install {package}. Please try to install it manually."
                )
        subprocess.run("clear" if os.name == "posix" else "cls", shell=True)
        print("All missing packages have been installed.")
    else:
        subprocess.run("clear" if os.name == "posix" else "cls", shell=True)
        print("All required packages are already installed.")
    if not (current_os == "Windows"):
        try:
            print("Trying to run nmcli")
            subprocess.run(
                "nmcli device status",
                check=True,
                shell=True,
                capture_output=True,
                text=True,
            )
        # Command not found
        except Exception:
            subprocess.run(
                "sudo apt-get install network-manager -y",
                check=True,
                shell=True,
                capture_output=True,
                text=True,
            )
