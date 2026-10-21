import uuid
from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DumpingEventModel
from app.services.ai_vision_service import ai_vision_service

router = APIRouter(prefix="/integrations", tags=["External Integrations & Camera Feeds"])

EXTERNAL_SYSTEMS = [
    {
        "id": "INT-BBMP-SAHAY",
        "systemName": "BBMP Sahay Municipal Complaint Grievance Portal",
        "status": "mock_connected",
        "description": "Prototype adapter communicating via mock JSON schema. Real BBMP REST gateway requires government credentials.",
        "lastSync": datetime.utcnow().isoformat() + "Z",
        "activeSyncRecords": 2
    },
    {
        "id": "INT-BWSSB-HELPLINE",
        "systemName": "BWSSB Hydraulic Telemetry & Water Grievance",
        "status": "mock_connected",
        "description": "Prototype adapter mapped to Cauvery water trunk line tickets. Connected in sandbox mode.",
        "lastSync": datetime.utcnow().isoformat() + "Z",
        "activeSyncRecords": 1
    },
    {
        "id": "INT-CCTV-SMARTCITY",
        "systemName": "Bengaluru Smart City CCTV Feeds",
        "status": "unconfigured",
        "description": "Restricted government optical network. Live video stream unconfigured; running on simulated optical demonstration nodes.",
        "lastSync": "Unavailable",
        "activeSyncRecords": 0
    }
]

CAMERA_SOURCES = [
    {
        "id": "CAM-BLR-04",
        "name": "Vittal Mallya North Perimeter Optical Node",
        "location": {
            "address": "Vittal Mallya Road near Cubbon Park Perimeter, Bengaluru",
            "lat": 12.9716,
            "lng": 77.5946,
            "ward": "Indiranagar & Domlur Central (Ward 74)",
        },
        "isSimulated": True,
        "frameIntervalSeconds": 60,
        "status": "active",
        "authorizedAgency": "BBMP Smart City Optical Surveillance Network (Simulated Prototype Source)"
    },
    {
        "id": "CAM-BLR-09",
        "name": "Silk Board Flyover Ramp Surveillance Node #2",
        "location": {
            "address": "Hosur Road Service Lane near Silk Board Junction, Bengaluru",
            "lat": 12.9175,
            "lng": 77.6234,
            "ward": "Bommanahalli & Electronic City (Ward 174)",
        },
        "isSimulated": True,
        "frameIntervalSeconds": 30,
        "status": "active",
        "authorizedAgency": "Bengaluru Traffic Police Video Network (Simulated Prototype Source)"
    }
]

@router.get("/status", response_model=Dict[str, Any])
def get_integrations_status():
    ai_status = ai_vision_service.get_status()
    return {
        "aiVisionEngine": ai_status,
        "externalSystems": EXTERNAL_SYSTEMS,
        "cameraSourcesCount": len(CAMERA_SOURCES),
        "environment": "Development / Autonomous Civic Prototype"
    }

@router.get("/camera-sources", response_model=List[dict])
def list_camera_sources():
    return CAMERA_SOURCES

@router.post("/camera-sources/{camera_id}/simulate-event", response_model=dict)
def simulate_camera_event(camera_id: str, db: Session = Depends(get_db)):
    cam = next((c for c in CAMERA_SOURCES if c["id"] == camera_id), None)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera source not found")

    new_event_id = f"DUMP-2026-{uuid.uuid4().hex[:4].upper()}"
    now = datetime.utcnow()

    event = DumpingEventModel(
        id=new_event_id,
        timestamp=now,
        address=cam["location"]["address"],
        lat=cam["location"]["lat"],
        lng=cam["location"]["lng"],
        ward=cam["location"]["ward"],
        source_type="authorized_camera",
        source_reference=cam["id"],
        evidence_url="/images/demo/bengaluru-waste-demo.jpg",
        estimated_volume_m3=4.2,
        coverage_percentage=16.5,
        status="unverified",
        warning_stage=1,
        audit_history_json=f'[{{"timestamp": "{now.isoformat()}Z", "action": "Simulated optical event ingested from {cam["name"]}", "actor": "{cam["id"]}"}}]'
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "eventId": event.id,
        "cameraId": cam["id"],
        "status": "unverified",
        "message": f"Simulated optical frame ingested from {cam['name']}. Flagged for officer review."
    }
