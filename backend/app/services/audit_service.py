import hashlib
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import AuditLogModel

def create_content_hash(data: any) -> str:
    """Generate a SHA-256 digest of arbitrary structured payload."""
    try:
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()
    except Exception:
        return hashlib.sha256(str(data).encode('utf-8')).hexdigest()

def log_audit_event(
    db: Session,
    actor: str,
    actor_role: str,
    action: str,
    entity_type: str,
    entity_id: str,
    details: str,
    previous_state: str = None,
    new_state: str = None,
    payload_to_hash: any = None
) -> AuditLogModel:
    """Record an auditable, timestamped action in the append-only audit trail."""
    now = datetime.utcnow()
    hash_subject = payload_to_hash if payload_to_hash is not None else {
        "actor": actor,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
        "previous_state": previous_state,
        "new_state": new_state,
        "timestamp": now.isoformat()
    }
    content_hash = create_content_hash(hash_subject)

    audit_entry = AuditLogModel(
        id=f"AUDIT-{uuid.uuid4().hex[:12].upper()}",
        timestamp=now,
        actor=actor,
        actor_role=actor_role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        previous_state=previous_state,
        new_state=new_state,
        content_hash=content_hash
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
