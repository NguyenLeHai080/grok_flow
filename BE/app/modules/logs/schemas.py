from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    level: str
    source: str
    message: str
    details: str | None
    resolved: bool
    created_at: datetime

