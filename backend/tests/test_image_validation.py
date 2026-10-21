import base64
import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ai_vision_service import ai_vision_service

client = TestClient(app)

@pytest.fixture
def selfie_base64():
    path = "tests/fixtures/selfie_sample.jpg"
    assert os.path.exists(path), "Selfie fixture must exist"
    with open(path, "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("utf-8")

@pytest.fixture
def road_base64():
    path = "tests/fixtures/road_sample.png"
    assert os.path.exists(path), "Road fixture must exist"
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")

def test_selfie_validation_service_rejection(selfie_base64):
    """
    PHASE 2 - AI Image Validation:
    Citizen captures a selfie and selects category 'roads'.
    The backend validation service must detect the human portrait/selfie,
    classify it as REJECTED_IRRELEVANT, return IRRELEVANT_OR_INSUFFICIENT_EVIDENCE,
    and supply the required user message.
    """
    result = ai_vision_service.validate_evidence(
        image_input=selfie_base64,
        reported_category="roads",
        is_demo=False
    )
    assert result["validationStatus"] == "REJECTED_IRRELEVANT"
    assert result["errorCode"] == "IRRELEVANT_OR_INSUFFICIENT_EVIDENCE"
    assert result["isRelevant"] is False
    assert result["confidence"] >= 0.90
    assert result["details"]["isPortraitOrSelfie"] is True
    assert "The captured image does not appear to show the selected infrastructure problem" in result["message"]

def test_road_defect_validation_service_acceptance(road_base64):
    """
    Genuine road surface image must pass validation and be routed for human verification.
    """
    result = ai_vision_service.validate_evidence(
        image_input=road_base64,
        reported_category="roads",
        is_demo=False
    )
    assert result["validationStatus"] in ("VALIDATION_PASSED", "PENDING_HUMAN_REVIEW")
    assert result["isRelevant"] is True
    assert result["requiresHumanReview"] is True

def test_api_validate_evidence_endpoint_selfie(selfie_base64):
    """
    Direct API test on /api/v1/incidents/validate-evidence.
    """
    response = client.post(
        "/api/v1/incidents/validate-evidence",
        json={
            "imageUrl": selfie_base64,
            "category": "roads",
            "isDemonstration": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["validationStatus"] == "REJECTED_IRRELEVANT"
    assert data["errorCode"] == "IRRELEVANT_OR_INSUFFICIENT_EVIDENCE"
    assert "The captured image does not appear to show the selected infrastructure problem" in data["message"]

def test_incident_creation_blocked_by_selfie_gate(selfie_base64):
    """
    Submitting an incident with a selfie as Road Damage must be rejected with HTTP 422,
    preventing any actionable complaint from entering the workflow.
    """
    payload = {
        "title": "Severe Pothole on Indiranagar 100ft Road",
        "description": "Deep asphalt void damaging vehicles.",
        "category": "roads",
        "severity": "high",
        "address": "100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038",
        "lat": 12.9716,
        "lng": 77.6412,
        "ward": "Ward 80 - Indiranagar",
        "reporterName": "Citizen Tester",
        "reporterContact": "+91 98765 43210",
        "isAnonymous": False,
        "imageUrl": selfie_base64,
        "isDemonstration": False
    }

    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 422
    assert "The captured image does not appear to show the selected infrastructure problem" in response.text

def test_incident_creation_succeeds_with_valid_road_evidence(road_base64):
    """
    Submitting an incident with legitimate road evidence succeeds with HTTP 201.
    """
    payload = {
        "title": "Severe Pothole on Indiranagar 100ft Road",
        "description": "Deep asphalt void damaging vehicles.",
        "category": "roads",
        "severity": "high",
        "address": "100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038",
        "lat": 12.9716,
        "lng": 77.6412,
        "ward": "Ward 80 - Indiranagar",
        "reporterName": "Citizen Tester",
        "reporterContact": "+91 98765 43210",
        "isAnonymous": False,
        "imageUrl": road_base64,
        "isDemonstration": False
    }

    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "submitted"
    assert data["category"] == "roads"
