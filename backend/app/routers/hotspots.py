import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import HotspotModel, DumpingEventModel, IncidentModel, WarningRecordModel
from app.schemas import HotspotResponse
from app.services.recurrence_service import calculate_recurrence_score

router = APIRouter(prefix="/hotspots", tags=["Hotspots & Recurrence Intelligence"])

def _format_hotspot(h: HotspotModel) -> dict:
    return {
        "id": h.id,
        "name": h.name,
        "location": {
            "address": h.address,
            "lat": h.lat,
            "lng": h.lng,
            "ward": h.ward,
        },
        "radiusMeters": h.radius_meters,
        "primaryCategory": h.primary_category,
        "dumpingEventIds": json.loads(h.dumping_event_ids_json or "[]"),
        "incidentIds": json.loads(h.incident_ids_json or "[]"),
        "cleanupCount": h.cleanup_count,
        "recurrenceLevel": h.recurrence_level,
        "recurrenceScore": h.recurrence_score,
        "lastCleanedAt": h.last_cleaned_at,
        "lastEventAt": h.last_event_at,
        "unresolvedAccumulationEstM3": h.unresolved_accumulation_est_m3,
        "preventiveRecommendation": h.preventive_recommendation or "Standard maintenance cycle",
        "status": h.status
    }

@router.get("", response_model=List[dict])
def list_hotspots(
    recurrence_level: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(HotspotModel)
    if recurrence_level and recurrence_level != "all":
        query = query.filter(HotspotModel.recurrence_level == recurrence_level)
    if category and category != "all":
        query = query.filter(HotspotModel.primary_category == category)

    hotspots = query.order_by(HotspotModel.recurrence_score.desc()).all()
    return [_format_hotspot(h) for h in hotspots]

@router.get("/{hotspot_id}", response_model=dict)
def get_hotspot_details(hotspot_id: str, db: Session = Depends(get_db)):
    h = db.query(HotspotModel).filter(HotspotModel.id == hotspot_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hotspot entity not found")

    dumping_ids = json.loads(h.dumping_event_ids_json or "[]")
    incident_ids = json.loads(h.incident_ids_json or "[]")

    events = db.query(DumpingEventModel).filter(DumpingEventModel.id.in_(dumping_ids)).all() if dumping_ids else []
    incidents = db.query(IncidentModel).filter(IncidentModel.id.in_(incident_ids)).all() if incident_ids else []
    warnings = db.query(WarningRecordModel).filter(WarningRecordModel.ward == h.ward).order_by(WarningRecordModel.issued_at.desc()).all()

    formatted = _format_hotspot(h)
    formatted["detailedEvents"] = [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat() + "Z",
            "sourceType": e.source_type,
            "volumeM3": e.estimated_volume_m3,
            "status": e.status,
            "evidenceUrl": e.evidence_url,
            "warningStage": e.warning_stage
        } for e in events
    ]
    formatted["detailedIncidents"] = [
        {
            "id": i.id,
            "title": i.title,
            "category": i.category,
            "severity": i.severity,
            "status": i.status,
            "reportedAt": i.reported_at.isoformat() + "Z"
        } for i in incidents
    ]
    formatted["warningHistory"] = [
        {
            "id": w.id,
            "stage": w.stage,
            "issuedAt": w.issued_at.isoformat() + "Z",
            "issuedBy": w.issued_by,
            "action": w.authority_action,
            "status": w.status
        } for w in warnings
    ]

    return formatted

@router.post("/{hotspot_id}/recalculate", response_model=dict)
def recalculate_hotspot(hotspot_id: str, db: Session = Depends(get_db)):
    h = db.query(HotspotModel).filter(HotspotModel.id == hotspot_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hotspot not found")

    dumping_ids = json.loads(h.dumping_event_ids_json or "[]")
    incident_ids = json.loads(h.incident_ids_json or "[]")

    repeat_events = max(0, len(dumping_ids) - h.cleanup_count)
    score, level, rec = calculate_recurrence_score(
        confirmed_events_count=len(dumping_ids),
        incidents_count=len(incident_ids),
        cleanup_count=h.cleanup_count,
        repeat_events_after_cleanup=repeat_events,
        unresolved_volume_m3=h.unresolved_accumulation_est_m3
    )

    h.recurrence_score = score
    h.recurrence_level = level
    h.preventive_recommendation = rec

    db.commit()
    db.refresh(h)
    return _format_hotspot(h)
