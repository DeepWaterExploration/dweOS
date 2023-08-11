"""
Exceptions for the wpa_supplicant module.
"""


class ParseError(ValueError):
    """Raise for errors regarding parsing data into proper structs."""


class FetchError(ValueError):
    """Raise for errors regarding failing to fetch data."""


class BusyError(ValueError):
    """Raise for errors regarding an excessive number of requests at a given time."""


class SockCommError(ConnectionError):
    """Raise for errors regarding WPA socket communication."""


class WPAOperationFail(ConnectionError):
    """Raised when a WPA operation fails."""


class NetworkAddFail(ValueError):
    """Raised when a WPA add_network operation fails to return an int."""
