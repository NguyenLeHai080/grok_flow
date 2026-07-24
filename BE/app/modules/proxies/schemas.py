from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ProxyInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    base_url: str = Field(min_length=5, max_length=500)
    provider: str = Field(min_length=2, max_length=80)
    config_json: str = "{}"
    is_active: bool = True


class ProxyOut(ProxyInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

