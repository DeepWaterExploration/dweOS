import platform

def is_raspberry_pi() -> bool:
    return platform.machine() in ('armv7l', 'armv6l')
