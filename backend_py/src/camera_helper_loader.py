from ctypes import CDLL
import os

dir_path = os.path.dirname(os.path.realpath(__file__))
print(dir_path)
CAMERA_HELPER_SO_FILE = f'{dir_path}/../build/camera_helper.so'

camera_helper = CDLL(CAMERA_HELPER_SO_FILE)
