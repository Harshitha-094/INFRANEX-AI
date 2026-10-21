from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ThresholdConfigModel, UserModel
from app.schemas import ThresholdUpdate, ThresholdEvaluationRequest, ThresholdEvaluationResponse
from app.services.threshold_service import evaluate_threshold
from app.services.audit_service import log_audit_event
from app.routers.auth import require_role

router = APIRouter(prefix="/thresholds", tags=["Configurable Threshold Engine"])

def _format_threshold(t: ThresholdConfigModel) -> dict:
    return {
        "id": t.id,
        "key": t.key,
        "label": t.label,
        "description": t.description,
        "value": t.value,
        "unit": t.unit,
        "category": t.category,
        "min": t.min_val,
        "max": t.max_val,
        "updatedBy": t.updated_by,
        "updatedAt": t.updated_at.isoformat() + "Z"
    }

@router.get("", response_model=List[dict])
def list_thresholds(db: Session = Depends(get_db)):
    rules = db.query(ThresholdConfigModel).all()
    return [_format_threshold(t) for t in rules]

@router.patch("/{key}", response_model=dict)
@router.put("/{key}", response_model=dict)
def update_threshold_rule(
    key: str,
    req: ThresholdUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("admin"))
):
    rule = db.query(ThresholdConfigModel).filter(ThresholdConfigModel.key == key).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Threshold configuration rule not found")

    if not (rule.min_val <= req.value <= rule.max_val):
        raise HTTPException(
            status_code=400,
            detail=f"Threshold value {req.value} out of allowable bounds [{rule.min_val}, {rule.max_val}] {rule.unit}."
        )

    prev_val = rule.value
    rule.value = req.value
    rule.updated_by = current_user.full_name

    log_audit_event(
        db=db,
        actor=current_user.full_name,
        actor_role="admin",
        action="threshold_updated",
        entity_type="threshold_config",
        entity_id=rule.id,
        details=f"Updated '{rule.label}' from {prev_val} to {req.value} {rule.unit}.",
        previous_state=str(prev_val),
        new_state=str(req.value)
    )

    db.commit()
    db.refresh(rule)
    return _format_threshold(rule)

@router.post("/evaluate", response_model=ThresholdEvaluationResponse)
def evaluate_observed_value(
    req: ThresholdEvaluationRequest,
    db: Session = Depends(get_db)
):
    return evaluate_threshold(db, req.key, req.observedValue)
