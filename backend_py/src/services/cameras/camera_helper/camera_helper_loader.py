import os
import subprocess
from ctypes import CDLL

dir_path = os.path.dirname(os.path.realpath(__file__))
CAMERA_HELPER_SO_FILE = f"{dir_path}/build/camera_helper.so"

if not os.path.exists(CAMERA_HELPER_SO_FILE):
    try:
        subprocess.run(["sh", "build.sh"], cwd=dir_path, check=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(
            "Failed to build camera_helper.so. A C compiler is required, install "
            "one with: sudo apt-get install -y build-essential"
        ) from e

camera_helper = CDLL(CAMERA_HELPER_SO_FILE)
