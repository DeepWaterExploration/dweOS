from pydantic import BaseModel

class LogSchema(BaseModel):
    timestamp: str
    level: str
    name: str
    filename: str
    lineno: int
    function: str
    message: str