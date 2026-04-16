from fastapi import APIRouter, Request

from ..logging import LogHandler, LogSchema

logs_router = APIRouter(tags=["logs"])


@logs_router.get("")
def get_logs(request: Request) -> list[LogSchema]:
    log_handler: LogHandler = request.app.state.log_handler

    return log_handler.logs
