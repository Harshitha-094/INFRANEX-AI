import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import IncidentModel, CitizenReportModel, UserModel
from app.schemas import (
    IncidentCreate,
    IncidentResponse,
    IncidentStatusUpdate,
    IncidentConsolidationRequest,
    EvidenceValidationRequest,
    EvidenceValidationResponse,
)
from app.services.ai_vision_service import ai_vision_service
from app.services.consolidation_service import find_duplicate_candidates, consolidate_incidents
from app.services.audit_service import log_audit_event
from app.routers.auth import get_current_user, require_role

router = APIRouter(prefix="/incidents", tags=["Incidents"])

def _format_incident(inc: IncidentModel) -> dict:
    return {
        "id": inc.id,
        "title": inc.title,
        "description": inc.description,
        "category": inc.category,
        "severity": inc.severity,
        "status": inc.status,
        "location": {
            "address": inc.address,
            "lat": inc.lat,
            "lng": inc.lng,
            "ward": inc.ward,
        },
        "reporter": {
            "name": inc.reporter_name,
            "contact": inc.reporter_contact,
            "isAnonymous": inc.is_anonymous,
        },
        "assignedTo": {
            "id": inc.assigned_to_id,
            "name": inc.assigned_to_name,
            "role": inc.assigned_to_role,
            "company": inc.assigned_to_company,
        } if inc.assigned_to_id else None,
        "aiAnalysis": {
            "confidenceScore": inc.ai_confidence,
            "detectedAnomaly": inc.ai_detected_anomaly,
            "recommendedPriority": inc.severity,
            "estimatedCostUsd": inc.ai_estimated_cost,
            "estimatedRepairHours": inc.ai_estimated_hours,
            "safetyHazardLevel": inc.ai_hazard_level,
            "trafficImpactIndex": inc.ai_traffic_impact,
            "estimatedDimensions": json.loads(inc.ai_dimensions_json or "{}")
        },
        "images": json.loads(inc.images_json or "[]"),
        "timeline": json.loads(inc.timeline_json or "[]"),
        "slaDeadline": inc.sla_deadline,
        "budgetAllocated": inc.budget_allocated,
        "isDemonstration": inc.is_demonstration,
        "isConsolidatedMaster": inc.is_consolidated_master,
        "parentIncidentId": inc.parent_incident_id,
        "consolidatedReportIds": json.loads(inc.consolidated_report_ids_json or "[]"),
        "hotspotId": inc.hotspot_id,
        "infrastructureAssetId": inc.infrastructure_asset_id,
        "externalComplaintRef": inc.external_complaint_ref,
        "reportedAt": inc.reported_at.isoformat() + "Z",
        "updatedAt": inc.updated_at.isoformat() + "Z",
    }

@router.get("", response_model=List[dict])
def list_incidents(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(IncidentModel)
    if category and category != "all":
        query = query.filter(IncidentModel.category == category)
    if severity and severity != "all":
        query = query.filter(IncidentModel.severity == severity)
    if status_filter and status_filter != "all":
        query = query.filter(IncidentModel.status == status_filter)

    incidents = query.order_by(IncidentModel.reported_at.desc()).all()
    return [_format_incident(inc) for inc in incidents]

@router.get("/{incident_id}", response_model=dict)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident record not found")
    return _format_incident(inc)

@router.post("/validate-evidence", response_model=EvidenceValidationResponse)
def validate_evidence(
    req: EvidenceValidationRequest
):
    """
    Authoritative pre-submission AI image relevance and biometric validation gate.
    Detects personal selfies/portraits, unusable blur, or blank images.
    """
    result = ai_vision_service.validate_evidence(
        image_input=req.imageUrl,
        reported_category=req.category,
        is_demo=req.isDemonstration or False
    )
    return result

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_incident(
    data: IncidentCreate,
    db: Session = Depends(get_db)
):
    # Validate location
    if not (12.75 <= data.lat <= 13.20 and 77.40 <= data.lng <= 77.85):
        raise HTTPException(
            status_code=400,
            detail="Incident location coordinates are outside the Bengaluru metropolitan boundary."
        )

    # Authoritative AI Image Relevance Gate (Phase 2 Requirement)
    if data.imageUrl:
        val_result = ai_vision_service.validate_evidence(
            image_input=data.imageUrl,
            reported_category=data.category,
            is_demo=data.isDemonstration
        )
        if val_result["validationStatus"] == "REJECTED_IRRELEVANT":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=val_result["message"]
            )
        elif val_result["validationStatus"] in ("NEEDS_RETAKE", "VALIDATION_FAILED"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=val_result["message"]
            )

    new_id = f"INF-2026-{uuid.uuid4().hex[:4].upper()}"
    now_iso = datetime.utcnow().isoformat() + "Z"

    # Run AI Vision Assessment
    ai_result = ai_vision_service.assess_hazard_image(
        image_url=data.imageUrl or "",
        reported_category=data.category,
        is_demo=data.isDemonstration
    )

    images = []
    if data.imageUrl:
        images.append({
            "url": data.imageUrl,
            "caption": "Citizen verified on-site photographic evidence",
            "isCitizenCapture": True,
            "isAfterRepair": False,
            "isDemonstration": data.isDemonstration,
            "timestamp": now_iso
        })

    timeline = [
        {
            "timestamp": now_iso,
            "title": "Incident Registered",
            "description": f"Filed by {data.reporterName} via live camera capture at {data.address}.",
            "user": data.reporterName,
            "type": "report"
        },
        {
            "timestamp": now_iso,
            "title": "AI Automated Triage Assessment",
            "description": f"{ai_result['detectedAnomaly']} (Confidence: {int(ai_result['confidenceScore']*100)}%). Routed to Officer Verification.",
            "user": "INFRANEX Core AI",
            "type": "ai_triage"
        }
    ]

    sla_hours = 4 if data.severity == "critical" else 24 if data.severity == "high" else 48
    sla_deadline = (datetime.utcnow() + timedelta(hours=sla_hours)).isoformat() + "Z"

    new_inc = IncidentModel(
        id=new_id,
        title=data.title,
        description=data.description,
        category=data.category,
        severity=data.severity,
        status="submitted",
        address=data.address,
        lat=data.lat,
        lng=data.lng,
        ward=data.ward,
        reporter_name=data.reporterName,
        reporter_contact=data.reporterContact,
        is_anonymous=data.isAnonymous,
        ai_confidence=ai_result["confidenceScore"],
        ai_detected_anomaly=ai_result["detectedAnomaly"],
        ai_estimated_cost=ai_result["estimatedCostUsd"],
        ai_estimated_hours=ai_result["estimatedRepairHours"],
        ai_hazard_level=ai_result["safetyHazardLevel"],
        ai_traffic_impact=ai_result["trafficImpactIndex"],
        ai_dimensions_json=json.dumps(ai_result.get("estimatedDimensions", {})),
        images_json=json.dumps(images),
        timeline_json=json.dumps(timeline),
        sla_deadline=sla_deadline,
        budget_allocated=ai_result["estimatedCostUsd"],
        is_demonstration=data.isDemonstration,
    )

    db.add(new_inc)

    # Record individual CitizenReport for evidence preservation
    citizen_report = CitizenReportModel(
        id=f"CIT-REP-{uuid.uuid4().hex[:8].upper()}",
        incident_id=new_id,
        reporter_name=data.reporterName,
        reporter_contact=data.reporterContact,
        is_anonymous=data.isAnonymous,
        title=data.title,
        description=data.description,
        category=data.category,
        severity=data.severity,
        address=data.address,
        lat=data.lat,
        lng=data.lng,
        ward=data.ward,
        evidence_json=json.dumps(images),
        status="active"
    )
    db.add(citizen_report)

    log_audit_event(
        db=db,
        actor=data.reporterName,
        actor_role="citizen",
        action="report_created",
        entity_type="incident",
        entity_id=new_id,
        details=f"Citizen report created with on-site evidence in ward {data.ward}.",
        new_state="submitted",
        payload_to_hash={"title": data.title, "lat": data.lat, "lng": data.lng}
    )

    db.commit()
    db.refresh(new_inc)
    return _format_incident(new_inc)

@router.patch("/{incident_id}/status", response_model=dict)
def update_status(
    incident_id: str,
    update_data: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("officer", "contractor", "admin"))
):
    inc = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    prev_status = inc.status
    now_iso = datetime.utcnow().isoformat() + "Z"
    timeline = json.loads(inc.timeline_json or "[]")

    action_title = f"Status updated to {update_data.status.replace('_', ' ').upper()}"
    if update_data.status == "closed" and update_data.rejectionReason:
        action_title = f"Report Rejected by {current_user.full_name}"
        desc = f"Reason: {update_data.rejectionReason}. Note: {update_data.note or 'No additional notes.'}"
    else:
        desc = update_data.note or f"Lifecycle transition performed by {current_user.role.upper()} ({current_user.full_name})."

    timeline.append({
        "timestamp": now_iso,
        "title": action_title,
        "description": desc,
        "user": current_user.full_name,
        "type": "status_change"
    })

    inc.status = update_data.status
    inc.timeline_json = json.dumps(timeline)

    log_audit_event(
        db=db,
        actor=current_user.full_name,
        actor_role=current_user.role,
        action="status_transition",
        entity_type="incident",
        entity_id=incident_id,
        details=desc,
        previous_state=prev_status,
        new_state=update_data.status
    )

    db.commit()
    db.refresh(inc)
    return _format_incident(inc)

@router.get("/{incident_id}/duplicate-candidates", response_model=List[dict])
def get_duplicate_candidates(
    incident_id: str,
    radius_meters: float = 50.0,
    db: Session = Depends(get_db)
):
    return find_duplicate_candidates(db, incident_id, radius_meters)

@router.post("/consolidate", response_model=dict)
@router.post("/{primary_id}/consolidate", response_model=dict)
def consolidate(
    req: IncidentConsolidationRequest,
    primary_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("officer", "admin"))
):
    target_primary_id = primary_id or req.primaryIncidentId
    notes = req.officerNotes or req.reason
    duplicate_ids = []
    if req.duplicateIncidentIds:
        duplicate_ids.extend(req.duplicateIncidentIds)
    if req.duplicateIncidentId and req.duplicateIncidentId not in duplicate_ids:
        duplicate_ids.append(req.duplicateIncidentId)

    if not duplicate_ids:
        raise HTTPException(status_code=400, detail="No duplicate incident IDs provided for consolidation.")

    master = None
    for dup_id in duplicate_ids:
        master = consolidate_incidents(
            db=db,
            primary_id=target_primary_id,
            duplicate_id=dup_id,
            officer_name=current_user.full_name,
            officer_notes=notes
        )
        if not master:
            raise HTTPException(status_code=400, detail=f"Unable to consolidate duplicate incident #{dup_id} into #{target_primary_id}.")

    return _format_incident(master)
