from pydantic import BaseModel


class RecordingInfo(BaseModel):
    path: str
    name: str
    format: str
    duration: str
    size: str
    created: str
