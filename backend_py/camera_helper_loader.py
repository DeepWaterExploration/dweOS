from ctypes import CDLL

CAMERA_HELPER_SO_FILE = './camera_helper.so'

camera_helper = CDLL(CAMERA_HELPER_SO_FILE)
