from app.modules.common.models import AuditLog


def write_audit(database, actor_id, action, resource, detail=""):
    database.add(AuditLog(actor_id=actor_id, action=action, resource=resource, detail=detail))

