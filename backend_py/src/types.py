from dataclasses import dataclass

@dataclass
class ServerOptions:
    no_ttyd: bool = False
