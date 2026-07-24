from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from app.modules.jobs.models import JobStatus


class JobInput(BaseModel):
    provider: str = Field(min_length=2, max_length=80)
    type: str = Field(min_length=2, max_length=80)
    prompt: str = Field(min_length=1, max_length=20000)
    status: JobStatus = JobStatus.pending


class JobUpdate(BaseModel):
    provider: str | None = None
    type: str | None = None
    prompt: str | None = None
    status: JobStatus | None = None
    result: str | None = None
    error: str | None = None


class JobRunInput(BaseModel):
    proxy_id: int
    model: str = Field(min_length=1, max_length=120)


class ImageJobRunInput(BaseModel):
    model: str = Field(default="grok-imagine-image-quality", pattern=r"^grok-imagine-image")
    count: int = Field(default=1, ge=1, le=4)
    response_format: str = Field(default="url", pattern=r"^(url|b64_json)$")
    enhance_prompt: bool = True

class MediaJobRunInput(BaseModel):
    proxy_id: int
    mode: Literal["t2i", "i2i", "t2v", "i2v"]
    model: str = Field(min_length=1, max_length=120)
    input_image: str | None = Field(default=None, max_length=14_000_000)
    count: int = Field(default=1, ge=1, le=4)
    aspect_ratio: str = Field(default="1:1", pattern=r"^(1:1|16:9|9:16|4:3|3:4|3:2|2:3)$")
    resolution: str = Field(default="1k", pattern=r"^(1k|2k)$")
    duration: int = Field(default=5, ge=1, le=15)
    enhance_prompt: bool = True


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    provider: str
    type: str
    prompt: str
    status: JobStatus
    result: str | None
    error: str | None
    retry_of_id: int | None
    created_at: datetime
