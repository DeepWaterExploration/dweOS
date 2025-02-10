from fastapi import APIRouter, Depends, Request
from typing import List
from ..logging import LogSchema, LogHandler

logs_router = APIRouter(tags=['logs'])

@logs_router.get('/logs')
def get_logs(request: Request) -> List[LogSchema]:
    log_handler: LogHandler = request.app.state.log_handler

    return log_handler.logs