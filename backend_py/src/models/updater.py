from enum import Enum

from pydantic import BaseModel


class ReleaseModel(BaseModel):
    tag: str
    name: str
    published_at: str
    prerelease: bool
    notes: str
    url: str


class UpdateStateEnum(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    FAILED = "failed"


class UpdateStatusModel(BaseModel):
    state: UpdateStateEnum
    log: str


class InstallReleasePayload(BaseModel):
    tag: str
