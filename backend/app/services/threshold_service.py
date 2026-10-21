from sqlalchemy.orm import Session
from app.models import ThresholdConfigModel

DEFAULT_THRESHOLDS = {
    "waste_coverage_threshold": {
        "label": "Garbage Coverage Trigger Threshold",
        "value": 10.0,
        "unit": "%",
        "action": "Generate consolidated waste complaint recommendation and flag for immediate officer review."
    },
    "waste_volume_threshold_m3": {
        "label": "Waste Volume Clearance Threshold",
        "value": 5.0,
        "unit": "m³",
        "action": "Dispatch prime mechanical clearance work order to authorized solid waste contractor."
    },
    "ai_confidence_gate": {
        "label": "AI Assessment Confidence Gate",
        "value": 70.0,
        "unit": "%",
        "action": "Eligible for human officer priority queue; cases below gate routed to manual camera review."
    },
    "spatial_duplicate_radius_meters": {
        "label": "Spatial Duplicate Consolidation Radius",
        "value": 50.0,
        "unit": "meters",
        "action": "Flag incidents within radius as candidate duplicate reports for non-destructive consolidation."
    },
    "critical_emergency_sla_hours": {
        "label": "Critical Hazard Emergency SLA",
        "value": 4.0,
        "unit": "hours",
        "action": "Trigger automated administrative escalation if field contractor has not acknowledged."
    }
}

def evaluate_threshold(db: Session, key: str, observed_value: float) -> dict:
    """Evaluate an observed telemetry measurement against persisted or default threshold rule."""
    record = db.query(ThresholdConfigModel).filter(ThresholdConfigModel.key == key).first()
    if record:
        threshold_val = record.value
        label = record.label
    else:
        fallback = DEFAULT_THRESHOLDS.get(key, {
            "label": key,
            "value": 10.0,
            "unit": "units",
            "action": "Review with municipal supervisor"
        })
        threshold_val = fallback["value"]
        label = fallback["label"]

    is_exceeded = observed_value >= threshold_val
    action = DEFAULT_THRESHOLDS.get(key, {}).get("action", "Perform municipal field triage.")

    explanation = (
        f"Rule '{label}' evaluated: Observed value of {observed_value} "
        f"{'exceeded' if is_exceeded else 'did not exceed'} configured threshold of {threshold_val}. "
        f"Human officer verification is required before operational dispatch."
    )

    return {
        "key": key,
        "observedValue": observed_value,
        "thresholdValue": threshold_val,
        "isExceeded": is_exceeded,
        "recommendedAction": action if is_exceeded else "Monitor location in standard cycle",
        "requiresHumanValidation": True,
        "explanation": explanation
    }
