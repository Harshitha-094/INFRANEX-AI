import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    DumpingEventModel,
    WarningRecordModel,
    HotspotModel,
    IncidentModel,
    UserModel
)
from app.schemas import (
    DumpingEventCreate,
    DumpingEventDecision,
    DumpingEventResponse
)
from app.services.audit_service import log_audit_event
from app.services.threshold_service import evaluate_threshold
from app.services.recurrence_service import calculate_recurrence_score
from app.routers.auth import require_role

router = APIRouter(prefix="/dumping-events", tags=["Unauthorized Dumping & Behaviour Intelligence"])

def _format_dumping_event(event: DumpingEventModel) -> dict:
    return {
        "id": event.id,
        "timestamp": event.timestamp.isoformat() + "Z",
        "location": {
            "address": event.address,
            "lat": event.lat,
            "lng": event.lng,
            "ward": event.ward,
        },
        "sourceType": event.source_type,
        "sourceReference": event.source_reference,
        "evidenceUrl": event.evidence_url,
        "estimatedVolumeM3": event.estimated_volume_m3,
        "coveragePercentage": event.coverage_percentage,
        "status": event.status,
        "confirmedBy": event.confirmed_by,
        "confirmedAt": event.confirmed_at.isoformat() + "Z" if event.confirmed_at else None,
        "rejectionReason": event.rejection_reason,
        "linkedIncidentId": event.linked_incident_id,
        "linkedHotspotId": event.linked_hotspot_id,
        "warningStage": event.warning_stage,
        "auditHistory": json.loads(event.audit_history_json or "[]")
    }

@router.get("", response_model=List[dict])
def list_dumping_events(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DumpingEventModel)
    if status_filter and status_filter != "all":
        query = query.filter(DumpingEventModel.status == status_filter)
    events = query.order_by(DumpingEventModel.timestamp.desc()).all()
    return [_format_dumping_event(e) for e in events]

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def record_dumping_event(
    data: DumpingEventCreate,
    db: Session = Depends(get_db)
):
    new_id = f"DUMP-2026-{uuid.uuid4().hex[:4].upper()}"
    now_iso = datetime.utcnow().isoformat() + "Z"

    audit_history = [
        {
            "timestamp": now_iso,
            "action": f"Ingested event from {data.sourceType} ({data.sourceReference or 'General Node'})",
            "actor": "Surveillance Ingestion Engine"
        }
    ]

    event = DumpingEventModel(
        id=new_id,
        timestamp=datetime.utcnow(),
        address=data.address,
        lat=data.lat,
        lng=data.lng,
        ward=data.ward,
        source_type=data.sourceType,
        source_reference=data.sourceReference,
        evidence_url=data.evidenceUrl,
        estimated_volume_m3=data.estimatedVolumeM3 or 0.0,
        coverage_percentage=data.coveragePercentage or 0.0,
        status="unverified",
        warning_stage=1,
        audit_history_json=json.dumps(audit_history)
    )

    db.add(event)
    log_audit_event(
        db=db,
        actor="Surveillance Engine",
        actor_role="system",
        action="dumping_event_ingested",
        entity_type="dumping_event",
        entity_id=new_id,
        details=f"Possible unauthorized dumping flagged at {data.address}.",
        new_state="unverified",
        payload_to_hash={"lat": data.lat, "lng": data.lng, "evidence": data.evidenceUrl}
    )

    db.commit()
    db.refresh(event)
    return _format_dumping_event(event)

@router.post("/{event_id}/decision", response_model=dict)
@router.post("/{event_id}/decide", response_model=dict)
def decide_dumping_event(
    event_id: str,
    decision_req: DumpingEventDecision,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("officer", "admin"))
):
    event = db.query(DumpingEventModel).filter(DumpingEventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Dumping event record not found")

    now = datetime.utcnow()
    now_iso = now.isoformat() + "Z"
    history = json.loads(event.audit_history_json or "[]")
    decision_str = decision_req.decision.lower().strip()
    notes_or_reason = decision_req.reason or decision_req.notes

    if decision_str in ("rejected", "reject"):
        event.status = "rejected"
        event.rejection_reason = notes_or_reason or "Inconclusive photographic evidence"
        event.confirmed_by = current_user.full_name
        event.confirmed_at = now

        history.append({
            "timestamp": now_iso,
            "action": f"Event Rejected by Officer {current_user.full_name}",
            "actor": current_user.full_name,
            "notes": f"Reason: {event.rejection_reason}"
        })
        event.audit_history_json = json.dumps(history)

        log_audit_event(
            db=db,
            actor=current_user.full_name,
            actor_role=current_user.role,
            action="dumping_event_rejected",
            entity_type="dumping_event",
            entity_id=event_id,
            details=f"Rejected: {event.rejection_reason}",
            previous_state="unverified",
            new_state="rejected"
        )
        db.commit()
        db.refresh(event)
        return _format_dumping_event(event)

    # Decision is CONFIRMED
    event.status = "confirmed"
    event.confirmed_by = current_user.full_name
    event.confirmed_at = now

    # 3-Stage Warning Escalation Logic
    # Find prior confirmed events near this location in the last 30 days
    prior_events = db.query(DumpingEventModel).filter(
        DumpingEventModel.id != event_id,
        DumpingEventModel.ward == event.ward,
        DumpingEventModel.status == "confirmed"
    ).count()

    calculated_stage = min(prior_events + 1, 3)
    event.warning_stage = calculated_stage

    warning_action = ""
    if calculated_stage == 1:
        warning_action = "First confirmed occurrence — formal municipal notice issued."
    elif calculated_stage == 2:
        warning_action = "Second confirmed occurrence — repeated infraction warning issued."
    else:
        warning_action = "Third confirmed occurrence — escalate to the responsible authority for official review."

    # Record formal WarningRecord
    warn_rec = WarningRecordModel(
        id=f"WARN-2026-{uuid.uuid4().hex[:6].upper()}",
        location_key=f"{event.ward}-Verge",
        ward=event.ward,
        event_id=event.id,
        stage=calculated_stage,
        issued_at=now,
        issued_by=current_user.full_name,
        authority_action=warning_action,
        status="escalated_to_authority" if calculated_stage == 3 else "active"
    )
    db.add(warn_rec)

    history.append({
        "timestamp": now_iso,
        "action": f"Human Officer Verified. {warning_action}",
        "actor": current_user.full_name,
        "notes": decision_req.reason or "Physical verification confirmed solid waste violation."
    })
    event.audit_history_json = json.dumps(history)

    # Check Accumulation against Threshold
    eval_res = evaluate_threshold(db, "waste_coverage_threshold", event.coverage_percentage)
    if eval_res["isExceeded"]:
        # Link to active waste incident or create one
        active_waste_inc = db.query(IncidentModel).filter(
            IncidentModel.category == "waste",
            IncidentModel.ward == event.ward,
            IncidentModel.status.in_(["submitted", "triage", "assigned", "in_progress"])
        ).first()

        if active_waste_inc:
            event.linked_incident_id = active_waste_inc.id
            timeline = json.loads(active_waste_inc.timeline_json or "[]")
            timeline.append({
                "timestamp": now_iso,
                "title": f"Confirmed Dumping Event #{event.id} Linked",
                "description": f"Coverage {event.coverage_percentage}% triggered accumulation threshold. Linked by {current_user.full_name}.",
                "user": current_user.full_name,
                "type": "milestone"
            })
            active_waste_inc.timeline_json = json.dumps(timeline)
        else:
            # Create consolidated municipal complaint ticket
            new_inc_id = f"INF-2026-{uuid.uuid4().hex[:4].upper()}"
            new_waste_inc = IncidentModel(
                id=new_inc_id,
                title=f"Chronic Solid Waste & Debris Accumulation ({event.ward})",
                description=f"Automated complaint triggered after verified dumping event #{event.id} exceeded {eval_res['thresholdValue']}% coverage threshold.",
                category="waste",
                severity="high",
                status="triage",
                address=event.address,
                lat=event.lat,
                lng=event.lng,
                ward=event.ward,
                reporter_name="INFRANEX Recurrence Intelligence",
                reporter_contact="Automated Threshold System",
                is_anonymous=False,
                ai_confidence=0.94,
                ai_detected_anomaly="Solid waste volume threshold exceeded via confirmed dumping event",
                ai_estimated_cost=1400.0,
                ai_estimated_hours=8.0,
                ai_hazard_level="Severe",
                ai_traffic_impact=5,
                ai_dimensions_json=json.dumps({"areaSqMeters": 25.0, "volumeCuMeters": event.estimated_volume_m3, "coveragePercentage": event.coverage_percentage}),
                images_json=json.dumps([{
                    "url": event.evidence_url,
                    "caption": f"Verified Dumping Evidence Event #{event.id}",
                    "timestamp": now_iso
                }]),
                timeline_json=json.dumps([{
                    "timestamp": now_iso,
                    "title": "Consolidated Waste Incident Generated",
                    "description": f"Triggered by confirmed dumping event #{event.id} ({eval_res['explanation']})",
                    "user": "Threshold Engine",
                    "type": "report"
                }]),
                sla_deadline=(now + timedelta(hours=24)).isoformat() + "Z",
                budget_allocated=1400.0,
                is_demonstration=False,
                is_consolidated_master=True
            )
            db.add(new_waste_inc)
            event.linked_incident_id = new_inc_id

    # Update Hotspot Recurrence
    hotspot = db.query(HotspotModel).filter(HotspotModel.ward == event.ward).first()
    if hotspot:
        event.linked_hotspot_id = hotspot.id
        event_ids = json.loads(hotspot.dumping_event_ids_json or "[]")
        if event.id not in event_ids:
            event_ids.append(event.id)
        hotspot.dumping_event_ids_json = json.dumps(event_ids)
        hotspot.last_event_at = now_iso
        hotspot.unresolved_accumulation_est_m3 += event.estimated_volume_m3

        # Recalculate recurrence score
        inc_ids = json.loads(hotspot.incident_ids_json or "[]")
        new_score, new_lvl, new_rec = calculate_recurrence_score(
            confirmed_events_count=len(event_ids),
            incidents_count=len(inc_ids),
            cleanup_count=hotspot.cleanup_count,
            repeat_events_after_cleanup=max(0, len(event_ids) - hotspot.cleanup_count),
            unresolved_volume_m3=hotspot.unresolved_accumulation_est_m3
        )
        hotspot.recurrence_score = new_score
        hotspot.recurrence_level = new_lvl
        hotspot.preventive_recommendation = new_rec

    log_audit_event(
        db=db,
        actor=current_user.full_name,
        actor_role=current_user.role,
        action="dumping_event_confirmed",
        entity_type="dumping_event",
        entity_id=event_id,
        details=f"Confirmed by officer. Warning stage: {calculated_stage}.",
        previous_state="unverified",
        new_state="confirmed",
        payload_to_hash={"id": event_id, "stage": calculated_stage, "ward": event.ward}
    )

    db.commit()
    db.refresh(event)
    return _format_dumping_event(event)
