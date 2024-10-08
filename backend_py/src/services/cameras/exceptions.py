class DeviceNotFoundException(Exception):
    '''Device not found'''

    def __init__(self, bus_info, *args: object) -> None:
        super().__init__(f'Device not found: "{bus_info}"', *args)
