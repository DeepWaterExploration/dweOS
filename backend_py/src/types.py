from dataclasses import dataclass

@dataclass
class FeatureSupport:
    ttyd: bool
    wifi: bool

    @classmethod
    def all(cls):
        return cls(ttyd=True, wifi=True)
