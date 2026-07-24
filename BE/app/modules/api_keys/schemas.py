from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class KeyInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)


class KeyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    prefix: str
    owner_id: int
    last_used_at: datetime | None
    revoked_at: datetime | None
    created_at: datetime


class KeyCreated(KeyOut):
    key: str

