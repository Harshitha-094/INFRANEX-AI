import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    WorkOrderModel,
    RepairValidationModel,
    IncidentModel,
    UserModel
)
from app.schemas import (
    WorkOrderDispatch,
    RepairSubmission,
    RepairValidationRequest,
    CitizenConfirmationRequest
)
from app.services.audit_service import log_audit_event
from app.routers.auth import require_role, get_current_user

router = APIRouter(tags=["Contractor Work Orders & Repair Validation"])

def _format_work_order(wo: WorkOrderModel) -> dict:
    return {
        "id": wo.id,
        "incidentId": wo.incident_id,
        "contractorId": wo.contractor_id,
        "contractorName": wo.contractor_name,
        "scopeOfWork": wo.scope_of_work,
        "status": wo.status,
        "dispatchedAt": wo.dispatched_at.isoformat() + "Z",
        "targetCompletionAt": wo.target_completion_at.isoformat() + "Z",
        "startedAt": wo.started_at.isoformat() + "Z" if wo.started_at else None,
        "submittedAt": wo.submitted_at.isoformat() + "Z" if wo.submitted_at else None,
        "materialsUsed": wo.materials_used,
        "laborHours": wo.labor_hours,
        "progressNotes": wo.progress_notes,
        "repairEvidence": json.loads(wo.repair_evidence_json or "[]")
    }

@router.get("/work-orders", response_model=List[dict])
def list_work_orders(
    contractor_id: Optional[str] = None,
    incident_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WorkOrderModel)
    if contractor_id:
        query = query.filter(WorkOrderModel.contractor_id == contractor_id)
    if incident_id:
        query = query.filter(WorkOrderModel.incident_id == incident_id)
    orders = query.order_by(WorkOrderModel.dispatched_at.desc()).all()
    return [_format_work_order(wo) for wo in orders]

@router.post("/work-orders/dispatch", response_model=dict, status_code=status.HTTP_201_CREATED)
def dispatch_work_order(
    req: WorkOrderDispatch,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("officer", "admin"))
):
    inc = db.query(IncidentModel).filter(IncidentModel.id == req.incidentId).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    wo_id = f"WO-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow()
    target_dt = now + timedelta(days=req.targetDays or 2)

    wo = WorkOrderModel(
        id=wo_id,
        incident_id=req.incidentId,
        contractor_id=req.contractorId,
        contractor_name=req.contractorName,
        scope_of_work=req.scopeOfWork,
        status="dispatched",
        dispatched_at=now,
        target_completion_at=target_dt
    )
    db.add(wo)

    # Update incident state
    inc.status = "assigned"
    inc.assigned_to_id = req.contractorId
    inc.assigned_to_name = req.contractorName
    inc.assigned_to_role = "Dispatched Contractor"

    timeline = json.loads(inc.timeline_json or "[]")
    timeline.append({
        "timestamp": now.isoformat() + "Z",
        "title": f"Work Order #{wo_id} Dispatched",
        "description": f"Assigned to {req.contractorName}. Target completion in {req.targetDays or 2} days. Scope: {req.scopeOfWork}",
        "user": current_user.full_name,
        "type": "assignment"
    })
    inc.timeline_json = json.dumps(timeline)

    log_audit_event(
        db=db,
        actor=current_user.full_name,
        actor_role=current_user.role,
        action="work_order_dispatched",
        entity_type="work_order",
        entity_id=wo_id,
        details=f"Dispatched work order for #{req.incidentId} to {req.contractorName}.",
        new_state="dispatched"
    )

    db.commit()
    db.refresh(wo)
    return _format_work_order(wo)

@router.post("/work-orders/{wo_id}/submit-repair", response_model=dict)
def submit_contractor_repair(
    wo_id: str,
    submission: RepairSubmission,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("contractor", "admin"))
):
    wo = db.query(WorkOrderModel).filter(WorkOrderModel.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    now = datetime.utcnow()
    now_iso = now.isoformat() + "Z"

    evidence_items = []
    if submission.repairEvidence:
        for item in submission.repairEvidence:
            if isinstance(item, dict):
                url = item.get("url")
                if url:
                    evidence_items.append({
                        "url": url,
                        "caption": item.get("caption", "Contractor completion photographic evidence"),
                        "isAfterRepair": True,
                        "isDemonstration": False,
                        "sha256Hash": item.get("sha256Hash"),
                        "timestamp": now_iso
                    })
    for url in submission.repairEvidenceUrls:
        if not any(e.get("url") == url for e in evidence_items):
            evidence_items.append({
                "url": url,
                "caption": "Contractor completion photographic evidence",
                "isAfterRepair": True,
                "isDemonstration": False,
                "timestamp": now_iso
            })

    wo.materials_used = submission.materialsUsed
    wo.labor_hours = submission.laborHours
    wo.progress_notes = submission.progressNotes
    wo.repair_evidence_json = json.dumps(evidence_items)
    wo.submitted_at = now
    wo.status = "repair_submitted"

    # Update Incident to 'review' status
    inc = db.query(IncidentModel).filter(IncidentModel.id == wo.incident_id).first()
    if inc:
        inc.status = "review"
        inc_images = json.loads(inc.images_json or "[]")
        inc_images.extend(evidence_items)
        inc.images_json = json.dumps(inc_images)

        timeline = json.loads(inc.timeline_json or "[]")
        timeline.append({
            "timestamp": now_iso,
            "title": f"Repair Evidence Submitted by {wo.contractor_name}",
            "description": f"Materials: {submission.materialsUsed} • Labor: {submission.laborHours}. Notes: {submission.progressNotes}",
            "user": current_user.full_name,
            "type": "repair_submission"
        })
        inc.timeline_json = json.dumps(timeline)

    log_audit_event(
        db=db,
        actor=current_user.full_name,
        actor_role="contractor",
        action="repair_submitted",
        entity_type="work_order",
        entity_id=wo_id,
        details=f"Contractor submitted repair evidence and labor hours ({submission.laborHours}).",
        previous_state="in_progress",
        new_state="repair_submitted"
    )

    db.commit()
    db.refresh(wo)
    return _format_work_order(wo)

@router.post("/work-orders/{wo_id}/validate", response_model=dict)
@router.post("/work-orders/{wo_id}/validate-repair", response_model=dict)
def validate_repair(
    wo_id: str,
    val_req: RepairValidationRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("officer", "admin"))
):
    wo = db.query(WorkOrderModel).filter(WorkOrderModel.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    # Anti-tampering / Segregation of duties: Contractor cannot approve own work
    if current_user.id == wo.contractor_id or current_user.username.lower() == wo.contractor_name.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contractor conflict: A contractor cannot validate or approve their own repair work."
        )

    inc = db.query(IncidentModel).filter(IncidentModel.id == wo.incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Linked incident not found")

    now = datetime.utcnow()
    now_iso = now.isoformat() + "Z"

    # Record RepairValidationModel
    validation_entry = RepairValidationModel(
        id=f"VAL-{uuid.uuid4().hex[:8].upper()}",
        work_order_id=wo.id,
        incident_id=inc.id,
        decision=val_req.decision,
        rationale=val_req.rationale,
        remaining_damage_estimate=val_req.remainingDamageEstimate,
        officer_id=current_user.id,
        officer_name=current_user.full_name,
        validated_at=now
    )
    db.add(validation_entry)

    timeline = json.loads(inc.timeline_json or "[]")

    if val_req.decision == "approved":
        wo.status = "approved_closed"
        inc.status = "resolved"
        timeline_title = f"Repair Verified & Approved by {current_user.full_name}"
    elif val_req.decision == "rework_required":
        wo.status = "rework_required"
        inc.status = "in_progress"
        timeline_title = "Rework Required: Insufficient Repair"
    elif val_req.decision == "inspection_required":
        inc.status = "inspection_required"
        timeline_title = "Physical On-Site Secondary Inspection Scheduled"
    else:
        wo.status = "rework_required"
        inc.status = "review"
        timeline_title = f"Repair Audit Decision: {val_req.decision.replace('_', ' ').upper()}"

    timeline.append({
        "timestamp": now_iso,
        "title": timeline_title,
        "description": f"Decision: {val_req.decision}. Rationale: {val_req.rationale} {f'(Remaining Damage: {val_req.remainingDamageEstimate})' if val_req.remainingDamageEstimate else ''}",
        "user": current_user.full_name,
        "type": "repair_validation"
    })
    inc.timeline_json = json.dumps(timeline)

    log_audit_event(
        db=db,
        actor=current_user.full_name,
        actor_role=current_user.role,
        action="repair_validated",
        entity_type="work_order",
        entity_id=wo_id,
        details=f"Repair decision: {val_req.decision}. Rationale: {val_req.rationale}",
        previous_state="repair_submitted",
        new_state=wo.status
    )

    db.commit()
    db.refresh(wo)
    return {
        "workOrder": _format_work_order(wo),
        "validationDecision": val_req.decision,
        "incidentStatus": inc.status
    }

@router.post("/incidents/{incident_id}/citizen-confirm", response_model=dict)
@router.post("/work-orders/incident/{incident_id}/citizen-confirm", response_model=dict)
def citizen_confirm_repair(
    incident_id: str,
    req: CitizenConfirmationRequest,
    db: Session = Depends(get_db)
):
    inc = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.utcnow()
    now_iso = now.isoformat() + "Z"
    timeline = json.loads(inc.timeline_json or "[]")

    if req.response == "confirmed_fixed":
        inc.status = "archived"
        title = "Citizen Sign-Off: Repair Confirmed Satisfactory"
        desc = f"Verified by citizen reporter {req.citizenName}. Case permanently archived in municipal history. Notes: {req.notes or 'None'}"
        action_type = "citizen_confirmation"
    else:
        inc.status = "disputed"
        title = "Citizen Dispute: Problem Reported Unresolved"
        desc = f"Dispute logged by {req.citizenName}. Case scheduled for priority inspection audit. Citizen notes: {req.notes or 'Work incomplete.'}"
        action_type = "citizen_dispute"

    timeline.append({
        "timestamp": now_iso,
        "title": title,
        "description": desc,
        "user": req.citizenName,
        "type": action_type
    })
    inc.timeline_json = json.dumps(timeline)

    log_audit_event(
        db=db,
        actor=req.citizenName,
        actor_role="citizen",
        action="citizen_confirmation" if req.response == "confirmed_fixed" else "citizen_dispute",
        entity_type="incident",
        entity_id=incident_id,
        details=desc,
        previous_state="resolved",
        new_state=inc.status
    )

    db.commit()
    db.refresh(inc)
    return {
        "incidentId": inc.id,
        "status": inc.status,
        "citizenResponse": req.response,
        "updatedAt": now_iso
    }
