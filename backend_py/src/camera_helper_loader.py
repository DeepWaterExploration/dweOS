from ctypes import CDLL
import os
import subprocess

dir_path = os.path.dirname(os.path.realpath(__file__))
CAMERA_HELPER_SO_FILE = f'{dir_path}/../build/camera_helper.so'

if not os.path.exists(CAMERA_HELPER_SO_FILE):
    subprocess.call(['sh', 'build.sh'], cwd=f'{dir_path}/../')

camera_helper = CDLL(CAMERA_HELPER_SO_FILE)
