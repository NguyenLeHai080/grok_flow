from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DashboardStats(BaseModel):
    jobs_total: int
    jobs_success: int
    jobs_failed: int
    proxies_active: int
    api_keys_active: int
    unresolved_errors: int


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    actor_id: int | None
    action: str
    resource: str
    detail: str | None
    created_at: datetime
