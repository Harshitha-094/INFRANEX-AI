from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLogModel
from app.schemas import AuditLogResponse
from app.routers.auth import require_role

router = APIRouter(prefix="/audit", tags=["Audit Trail & Evidence Integrity"])

def _format_audit(log: AuditLogModel) -> dict:
    return {
        "id": log.id,
        "timestamp": log.timestamp.isoformat() + "Z",
        "actor": log.actor,
        "actorRole": log.actor_role,
        "action": log.action,
        "entityType": log.entity_type,
        "entityId": log.entity_id,
        "details": log.details,
        "previousState": log.previous_state,
        "newState": log.new_state,
        "contentHash": log.content_hash
    }

@router.get("", response_model=List[dict])
def list_audit_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("officer", "admin"))
):
    query = db.query(AuditLogModel)
    if entity_type:
        query = query.filter(AuditLogModel.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLogModel.entity_id == entity_id)

    logs = query.order_by(AuditLogModel.timestamp.desc()).limit(limit).all()
    return [_format_audit(l) for l in logs]
