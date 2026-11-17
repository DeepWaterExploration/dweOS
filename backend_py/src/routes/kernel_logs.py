from fastapi import APIRouter, Request
from pydantic import BaseModel

from ..services.kernel_logs import KernelLogEntry, KernelLogService

kernel_logs_router = APIRouter(tags=["logs"])


class KernelLogsModel(BaseModel):
    available: bool
    logs: list[KernelLogEntry]


@kernel_logs_router.get("", summary="Get the buffered kernel logs")
def get_kernel_logs(request: Request) -> KernelLogsModel:
    service: KernelLogService = request.app.state.kernel_log_service
    return KernelLogsModel(available=service.available, logs=list(service.entries))
