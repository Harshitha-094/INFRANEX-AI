import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_complete_incident_lifecycle_and_repair_verification():
    """
    Tests the authoritative incident lifecycle:
    Citizen Report -> Human Verification -> Contractor Assignment ->
    Repair In Progress -> Repair Evidence Submission ->
    Comparative Inspection -> Approval -> Citizen Confirmation -> Closure
    """
    # 0. Set up roles & tokens
    officer_res = client.post("/api/v1/auth/login", json={"username": "officer", "password": "officer123"})
    assert officer_res.status_code == 200
    officer_token = officer_res.json()["access_token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    contractor_res = client.post("/api/v1/auth/login", json={"username": "contractor", "password": "contractor123"})
    assert contractor_res.status_code == 200
    contractor_token = contractor_res.json()["access_token"]
    contractor_headers = {"Authorization": f"Bearer {contractor_token}"}

    citizen_res = client.post("/api/v1/auth/login", json={"username": "citizen", "password": "citizen123"})
    assert citizen_res.status_code == 200
    citizen_token = citizen_res.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # Criterion 1: Citizen creates an incident
    original_photo_url = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800"
    create_payload = {
        "title": "Severe Trench Void on 100ft Road",
        "description": "Exposed trench void causing hazardous transit disruption",
        "category": "roads",
        "severity": "critical",
        "address": "100 Feet Road, Indiranagar, Bengaluru",
        "lat": 12.9716,
        "lng": 77.6412,
        "ward": "Indiranagar & Domlur Central (Ward 74)",
        "reporterName": "Aarav Sharma",
        "imageUrl": original_photo_url,
        "isDemonstration": True
    }
    create_res = client.post("/api/v1/incidents", json=create_payload)
    assert create_res.status_code == 201
    incident = create_res.json()
    inc_id = incident["id"]
    assert incident["status"] == "submitted"
    assert incident["images"][0]["url"] == original_photo_url

    # Criterion 2: Human Verification by Field Officer
    verify_res = client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "triage", "notes": "Human verification complete: Road void confirmed by Officer Vance"},
        headers=officer_headers
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "triage"

    # Criterion 3: Incident Assignment to Contractor & Work Order Creation
    dispatch_payload = {
        "incidentId": inc_id,
        "contractorId": "CTR-04",
        "contractorName": "Apex Paving & Heavy Civils Ltd.",
        "scopeOfWork": "Asphalt excavation, sub-base compaction, and Grade-4 bitumen resurfacing",
        "targetCompletionAt": "2026-10-25T18:00:00Z"
    }
    dispatch_res = client.post("/api/v1/work-orders/dispatch", json=dispatch_payload, headers=officer_headers)
    assert dispatch_res.status_code == 201
    wo = dispatch_res.json()
    wo_id = wo["id"]
    assert wo["status"] == "dispatched"
    assert wo["incidentId"] == inc_id

    # Verify incident transitioned to assigned
    assigned_inc = client.get(f"/api/v1/incidents/{inc_id}").json()
    assert assigned_inc["status"] == "assigned"

    # Criterion 4: Contractor accesses work order and marks On-Site / In-Progress
    progress_res = client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "in_progress", "notes": "Contractor crew mobilized on-site with roller equipment"},
        headers=contractor_headers
    )
    assert progress_res.status_code == 200
    assert progress_res.json()["status"] == "in_progress"

    # Criterion 16: Unauthorized check - Citizen cannot submit contractor repair evidence
    repaired_photo_url = "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&q=80&w=800"
    unauth_evidence = client.post(
        f"/api/v1/work-orders/{wo_id}/submit-repair",
        json={
            "laborHours": "14 crew-hours",
            "materialsUsed": "450kg Grade-4 Bitumen, 2.4 tons M-20 aggregate",
            "progressNotes": "Excavation leveled and roller compacted",
            "repairEvidence": [{"url": repaired_photo_url, "caption": "Finished asphalt wear layer"}]
        },
        headers=citizen_headers
    )
    assert unauth_evidence.status_code == 403

    # Criterion 5: Contractor submits repair evidence
    repair_submission = {
        "laborHours": "14 crew-hours",
        "materialsUsed": "450kg Grade-4 Bitumen, 2.4 tons M-20 aggregate",
        "progressNotes": "Asphalt wear course paved and compacted to level grade",
        "repairEvidence": [
            {
                "url": repaired_photo_url,
                "caption": "Post-repair completion photo submitted by Apex Civils",
                "isAfterRepair": True,
                "sha256Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            }
        ]
    }
    submit_res = client.post(
        f"/api/v1/work-orders/{wo_id}/submit-repair",
        json=repair_submission,
        headers=contractor_headers
    )
    assert submit_res.status_code == 200
    updated_wo = submit_res.json()
    assert updated_wo["status"] == "repair_submitted"
    assert len(updated_wo["repairEvidence"]) > 0

    # Criterion 6 & 7: Incident becomes "review" (Awaiting Repair Verification)
    review_inc = client.get(f"/api/v1/incidents/{inc_id}").json()
    assert review_inc["status"] == "review"

    # Criterion 8: Original incident photograph remains unchanged
    assert review_inc["images"][0]["url"] == original_photo_url
    assert review_inc["images"][0]["isAfterRepair"] is False

    # Criterion 9: Both original and repaired photographs are present
    assert any(img["url"] == original_photo_url for img in review_inc["images"])
    assert any(img["url"] == repaired_photo_url and img.get("isAfterRepair") is True for img in review_inc["images"])

    # Criterion 10: Reporter / Citizen can retrieve the incident and evidence
    citizen_fetch = client.get(f"/api/v1/incidents/{inc_id}", headers=citizen_headers)
    assert citizen_fetch.status_code == 200
    assert citizen_fetch.json()["status"] == "review"

    # Criterion 11 & 12: Test Officer Rejection & Rework cycle
    # If officer rejects repair evidence, work order returns to rework_required and incident to in_progress
    rework_res = client.post(
        f"/api/v1/work-orders/{wo_id}/validate-repair",
        json={"decision": "rework_required", "rationale": "Edge sealing incomplete on north perimeter"},
        headers=officer_headers
    )
    assert rework_res.status_code == 200
    rework_wo = rework_res.json()
    assert rework_wo["workOrder"]["status"] == "rework_required"
    assert rework_wo["incidentStatus"] == "in_progress"
    inc_rework = client.get(f"/api/v1/incidents/{inc_id}").json()
    assert inc_rework["status"] == "in_progress"

    # Contractor re-submits corrected repair evidence
    resubmit_res = client.post(
        f"/api/v1/work-orders/{wo_id}/submit-repair",
        json={
            "laborHours": "4 additional crew-hours",
            "materialsUsed": "Cold pour joint sealant (50kg)",
            "progressNotes": "Perimeter joints fully sealed and tamped",
            "repairEvidence": [
                {
                    "url": repaired_photo_url,
                    "caption": "Reworked perimeter seal photo",
                    "isAfterRepair": True,
                    "sha256Hash": "f4c0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b999"
                }
            ]
        },
        headers=contractor_headers
    )
    assert resubmit_res.status_code == 200

    # Officer now Approves the repair
    approve_res = client.post(
        f"/api/v1/work-orders/{wo_id}/validate-repair",
        json={"decision": "approved", "rationale": "High quality compaction and sealed edges verified on site"},
        headers=officer_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["workOrder"]["status"] == "approved_closed"
    assert approve_res.json()["incidentStatus"] == "resolved"
    approved_inc = client.get(f"/api/v1/incidents/{inc_id}").json()
    assert approved_inc["status"] == "resolved"

    # Criterion 13: Citizen Dispute prevents auto-closure
    # Citizen checks site and disputes initial resolution
    dispute_res = client.post(
        f"/api/v1/work-orders/incident/{inc_id}/citizen-confirm",
        json={
            "citizenName": "Aarav Sharma",
            "response": "disputed_unresolved",
            "notes": "Loose asphalt debris left scattered across cycle track"
        }
    )
    assert dispute_res.status_code == 200
    disputed_inc = client.get(f"/api/v1/incidents/{inc_id}").json()
    assert disputed_inc["status"] == "disputed"
    # Case must NOT be closed!
    assert disputed_inc["status"] != "closed"
    assert disputed_inc["status"] != "archived"

    # Contractor cleans up debris and officer re-verifies
    client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "resolved", "notes": "Cycle lane swept and debris removed"},
        headers=officer_headers
    )

    # Criterion 14: Citizen confirms "YES — ISSUE RESOLVED" -> Closure
    final_confirm_res = client.post(
        f"/api/v1/work-orders/incident/{inc_id}/citizen-confirm",
        json={
            "citizenName": "Aarav Sharma",
            "response": "confirmed_fixed",
            "notes": "Cycle lane clear and asphalt road completely restored. Thank you!"
        }
    )
    assert final_confirm_res.status_code == 200
    closed_inc = client.get(f"/api/v1/incidents/{inc_id}").json()
    assert closed_inc["status"] in ("archived", "closed")
