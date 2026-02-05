from pydantic import BaseModel


class FeatureSupport(BaseModel):
    ttyd: bool
    wifi: bool
    serial: bool

    @classmethod
    def all(cls) -> 'FeatureSupport':
        return cls(ttyd=True, wifi=True, serial=True)

    @classmethod
    def none(cls) -> 'FeatureSupport':
        return cls(ttyd=False, wifi=False, serial=False)
