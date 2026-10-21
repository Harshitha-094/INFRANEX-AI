import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import InfrastructureAssetModel, IncidentModel

router = APIRouter(prefix="/infrastructure", tags=["Infrastructure Digital ID & History"])

def _format_asset(a: InfrastructureAssetModel) -> dict:
    return {
        "id": a.id,
        "name": a.name,
        "type": a.asset_type,
        "location": {
            "address": a.address,
            "lat": a.lat,
            "lng": a.lng,
            "ward": a.ward,
        },
        "linkedIncidentIds": json.loads(a.linked_incident_ids_json or "[]"),
        "damageHistoryCount": a.damage_history_count,
        "repairHistoryCount": a.repair_history_count,
        "lastRepairedAt": a.last_repaired_at,
        "recurrenceLevel": a.recurrence_level,
        "maintenanceRecommendation": a.maintenance_recommendation or "Routine inspection cycle",
        "auditTrail": json.loads(a.audit_trail_json or "[]")
    }

@router.get("", response_model=List[dict])
def list_infrastructure_assets(
    asset_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InfrastructureAssetModel)
    if asset_type and asset_type != "all":
        query = query.filter(InfrastructureAssetModel.asset_type == asset_type)
    assets = query.order_by(InfrastructureAssetModel.id.asc()).all()
    return [_format_asset(a) for a in assets]

@router.get("/{asset_id}", response_model=dict)
def get_asset_history(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(InfrastructureAssetModel).filter(InfrastructureAssetModel.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Infrastructure asset not found")

    inc_ids = json.loads(asset.linked_incident_ids_json or "[]")
    incidents = db.query(IncidentModel).filter(IncidentModel.id.in_(inc_ids)).all() if inc_ids else []

    formatted = _format_asset(asset)
    formatted["detailedIncidents"] = [
        {
            "id": i.id,
            "title": i.title,
            "severity": i.severity,
            "status": i.status,
            "reportedAt": i.reported_at.isoformat() + "Z"
        } for i in incidents
    ]
    return formatted
