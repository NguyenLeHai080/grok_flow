from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import current_user, require_roles
from app.modules.api_keys.models import ApiKey
from app.modules.common.models import AuditLog
from app.modules.dashboard.schemas import AuditOut, DashboardStats
from app.modules.jobs.models import Job, JobStatus
from app.modules.logs.models import ErrorLog
from app.modules.proxies.models import ProxyConfig
from app.modules.users.models import Role, User

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def stats(database: Session = Depends(get_db), _: User = Depends(current_user)):
    count = lambda model, *where: database.scalar(select(func.count()).select_from(model).where(*where)) or 0
    return DashboardStats(jobs_total=count(Job), jobs_success=count(Job, Job.status == JobStatus.success), jobs_failed=count(Job, Job.status == JobStatus.failed), proxies_active=count(ProxyConfig, ProxyConfig.is_active.is_(True)), api_keys_active=count(ApiKey, ApiKey.revoked_at.is_(None)), unresolved_errors=count(ErrorLog, ErrorLog.resolved.is_(False)))


@router.get("/audit-logs", response_model=list[AuditOut])
def audit_logs(database: Session = Depends(get_db), _: User = Depends(require_roles(Role.admin))):
    return database.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(1000)).all()

