from pydantic import BaseModel


class FeatureSupport(BaseModel):
    ttyd: bool
    wifi: bool
    serial: bool
    updater: bool

    @classmethod
    def all(cls) -> "FeatureSupport":
        return cls(ttyd=True, wifi=True, serial=True, updater=True)

    @classmethod
    def none(cls) -> "FeatureSupport":
        return cls(ttyd=False, wifi=False, serial=False, updater=False)


class SimpleRequestStatusModel(BaseModel):
    success: bool = True
