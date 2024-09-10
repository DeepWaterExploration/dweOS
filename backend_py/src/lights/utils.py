import os

def is_raspberry_pi():
    try:
        with open('/sys/firmware/devicetree/base/model', 'r') as m:
            return 'raspberry pi 4' in m.read().lower()
    except:
        return False
