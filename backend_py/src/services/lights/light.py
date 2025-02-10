from pydantic import BaseModel

class Light(BaseModel):
    intensity: float
    pin: int
    nickname: str
    controller_index: int
    controller_name: str

class SetLightInfo(BaseModel):
    index: int
    intensity: float

class DisableLightInfo(BaseModel):
    controller_index: int
    pin: int
