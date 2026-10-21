import math
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import IncidentModel, CitizenReportModel
from app.services.audit_service import log_audit_event

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate geographical distance in meters between two GPS coordinates."""
    R = 6371000  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 1)

def find_duplicate_candidates(db: Session, target_incident_id: str, radius_meters: float = 50.0) -> List[Dict[str, Any]]:
    """Scan existing incidents and return candidate duplicates within spatial proximity and category match."""
    target = db.query(IncidentModel).filter(IncidentModel.id == target_incident_id).first()
    if not target:
        return []

    candidates = []
    all_others = db.query(IncidentModel).filter(
        IncidentModel.id != target_incident_id,
        IncidentModel.status.notin_(["closed", "archived"])
    ).all()

    for other in all_others:
        distance = calculate_haversine_distance(target.lat, target.lng, other.lat, other.lng)
        if distance <= radius_meters:
            cat_match = target.category.lower() == other.category.lower()
            # Time delta in hours
            t_diff = abs((target.reported_at - other.reported_at).total_seconds()) / 3600.0

            # Confidence score calculation based on distance, category, and time proximity
            score = 0.5
            if cat_match:
                score += 0.3
            if distance < 20.0:
                score += 0.15
            if t_diff < 48.0:
                score += 0.05
            score = min(score, 0.98)

            match_reason = f"Located {distance}m away with {'identical' if cat_match else 'different'} hazard category within {round(t_diff, 1)}h."

            candidates.append({
                "primaryIncidentId": target.id,
                "candidateIncidentId": other.id,
                "distanceMeters": distance,
                "categoryMatch": cat_match,
                "timeDeltaHours": round(t_diff, 1),
                "confidenceScore": round(score, 2),
                "matchReason": match_reason
            })

    # Sort highest confidence first
    candidates.sort(key=lambda x: x["confidenceScore"], reverse=True)
    return candidates

def consolidate_incidents(
    db: Session,
    primary_id: str,
    duplicate_id: str,
    officer_name: str,
    officer_notes: Optional[str] = None
) -> Optional[IncidentModel]:
    """
    Non-destructively consolidate a duplicate incident into a primary actionable incident.
    - Preserves all original evidence and reporter attribution.
    - Appends duplicate's photos and notes to the primary incident.
    - Marks duplicate as 'closed' with reason 'Consolidated into primary incident'.
    - Updates audit trail.
    """
    primary = db.query(IncidentModel).filter(IncidentModel.id == primary_id).first()
    duplicate = db.query(IncidentModel).filter(IncidentModel.id == duplicate_id).first()

    if not primary or not duplicate:
        return None

    # Parse primary data
    primary_images = json.loads(primary.images_json or "[]")
    duplicate_images = json.loads(duplicate.images_json or "[]")
    primary_timeline = json.loads(primary.timeline_json or "[]")
    duplicate_timeline = json.loads(duplicate.timeline_json or "[]")
    consolidated_ids = json.loads(primary.consolidated_report_ids_json or "[]")

    # Add duplicate ID to consolidated list
    if duplicate_id not in consolidated_ids:
        consolidated_ids.append(duplicate_id)

    # Append duplicate images while marking their source
    for img in duplicate_images:
        img_copy = dict(img)
        img_copy["caption"] = f"[Consolidated from #{duplicate_id}] {img_copy.get('caption', '')}"
        primary_images.append(img_copy)

    now_iso = datetime.utcnow().isoformat() + "Z"
    consolidation_entry = {
        "timestamp": now_iso,
        "title": f"Consolidated Duplicate Incident #{duplicate_id}",
        "description": f"Verified by {officer_name}. All original evidence and telemetry merged into master case. Notes: {officer_notes or 'Proximity match.'}",
        "user": officer_name,
        "type": "consolidation"
    }
    primary_timeline.append(consolidation_entry)

    # Update primary incident
    primary.is_consolidated_master = True
    primary.consolidated_report_ids_json = json.dumps(consolidated_ids)
    primary.images_json = json.dumps(primary_images)
    primary.timeline_json = json.dumps(primary_timeline)

    # Update duplicate incident
    duplicate.status = "closed"
    duplicate.parent_incident_id = primary_id
    duplicate_timeline.append({
        "timestamp": now_iso,
        "title": f"Closed via Consolidation into Master #{primary_id}",
        "description": f"All evidence preserved under master incident #{primary_id}.",
        "user": officer_name,
        "type": "consolidation"
    })
    duplicate.timeline_json = json.dumps(duplicate_timeline)

    log_audit_event(
        db=db,
        actor=officer_name,
        actor_role="officer",
        action="incident_consolidation",
        entity_type="incident",
        entity_id=primary_id,
        details=f"Consolidated duplicate incident #{duplicate_id} into primary #{primary_id}.",
        previous_state="independent",
        new_state="consolidated_master",
        payload_to_hash={"primary": primary_id, "duplicate": duplicate_id}
    )

    db.commit()
    db.refresh(primary)
    return primary
