import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

def test_auth_login_success():
    response = client.post("/api/v1/auth/login", json={"username": "officer", "password": "officer123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "officer"

def test_auth_login_invalid():
    response = client.post("/api/v1/auth/login", json={"username": "officer", "password": "wrongpassword"})
    assert response.status_code == 401

def test_incident_creation_and_boundary_validation():
    # 1. Valid location in Bengaluru
    valid_payload = {
        "title": "Severe Trench Void on Ring Road",
        "description": "Exposed trench void causing transit disruption",
        "category": "roads",
        "severity": "critical",
        "address": "Outer Ring Road near Bellandur Flyover, Bengaluru",
        "lat": 12.9304,
        "lng": 77.6784,
        "ward": "Mahadevapura Tech Corridor (Ward 85)",
        "reporterName": "Citizen Commuter",
        "imageUrl": "/images/demo/bengaluru-flooding-demo.jpg",
        "isDemonstration": True
    }
    res_valid = client.post("/api/v1/incidents", json=valid_payload)
    assert res_valid.status_code == 201
    inc_data = res_valid.json()
    assert inc_data["status"] == "submitted"
    assert "id" in inc_data

    # 2. Out of bounds location (e.g. Mumbai or New York)
    invalid_payload = dict(valid_payload)
    invalid_payload["lat"] = 19.0760  # Mumbai
    invalid_payload["lng"] = 72.8777
    res_invalid = client.post("/api/v1/incidents", json=invalid_payload)
    assert res_invalid.status_code == 400
    assert "boundary" in res_invalid.json()["detail"].lower()

def test_threshold_evaluation():
    # 1. Fetch current configured threshold
    thresh_list = client.get("/api/v1/thresholds").json()
    waste_rule = next(t for t in thresh_list if t["key"] == "waste_coverage_threshold")
    current_val = waste_rule["value"]

    # Test exceeding threshold
    res_exceeded = client.post("/api/v1/thresholds/evaluate", json={"key": "waste_coverage_threshold", "observedValue": current_val + 5.0})
    assert res_exceeded.status_code == 200
    assert res_exceeded.json()["isExceeded"] is True
    assert res_exceeded.json()["requiresHumanValidation"] is True

    # Test equal to threshold
    res_equal = client.post("/api/v1/thresholds/evaluate", json={"key": "waste_coverage_threshold", "observedValue": current_val})
    assert res_equal.status_code == 200
    assert res_equal.json()["isExceeded"] is True

    # Test under threshold
    res_under = client.post("/api/v1/thresholds/evaluate", json={"key": "waste_coverage_threshold", "observedValue": max(0.0, current_val - 5.0)})
    assert res_under.status_code == 200
    assert res_under.json()["isExceeded"] is False

def test_dumping_event_lifecycle():
    # Login as officer to get token
    login_res = client.post("/api/v1/auth/login", json={"username": "officer", "password": "officer123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ingest event
    event_payload = {
        "address": "Vittal Mallya Road Verge, Bengaluru",
        "lat": 12.9716,
        "lng": 77.5946,
        "ward": "Indiranagar & Domlur Central (Ward 74)",
        "sourceType": "authorized_camera",
        "sourceReference": "CAM-BLR-04",
        "evidenceUrl": "/images/demo/bengaluru-waste-demo.jpg",
        "estimatedVolumeM3": 6.0,
        "coveragePercentage": 18.0
    }
    create_res = client.post("/api/v1/dumping-events", json=event_payload)
    assert create_res.status_code == 201
    event = create_res.json()
    event_id = event["id"]
    assert event["status"] == "unverified"

    # 2. Officer confirms event
    decision_res = client.post(
        f"/api/v1/dumping-events/{event_id}/decision",
        json={"decision": "confirmed", "reason": "Commercial packaging accumulation confirmed"},
        headers=headers
    )
    assert decision_res.status_code == 200
    confirmed_data = decision_res.json()
    assert confirmed_data["status"] == "confirmed"
    assert confirmed_data["confirmedBy"] == "Officer Marcus Vance"
    assert confirmed_data["warningStage"] >= 1

def test_duplicate_candidates_and_consolidation():
    # Login as officer
    login_res = client.post("/api/v1/auth/login", json={"username": "officer", "password": "officer123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create two nearby incidents (15 meters apart)
    inc1 = client.post("/api/v1/incidents", json={
        "title": "Clogged Culvert Inlet A",
        "description": "Trash blockage causing backflow",
        "category": "drainage",
        "severity": "high",
        "address": "Rajakaluve Flank near 100 Feet Rd, Indiranagar",
        "lat": 12.97500,
        "lng": 77.64100,
        "ward": "Indiranagar & Domlur Central (Ward 74)",
        "reporterName": "Citizen Ananya",
        "imageUrl": "/images/demo/bengaluru-drainage-demo.jpg"
    }).json()

    inc2 = client.post("/api/v1/incidents", json={
        "title": "Clogged Culvert Inlet B (Same issue)",
        "description": "Water overflowing culvert",
        "category": "drainage",
        "severity": "high",
        "address": "Rajakaluve Flank near 100 Feet Rd, Indiranagar",
        "lat": 12.97510,
        "lng": 77.64105,
        "ward": "Indiranagar & Domlur Central (Ward 74)",
        "reporterName": "Citizen Ramesh",
        "imageUrl": "/images/demo/bengaluru-drainage-demo.jpg"
    }).json()

    # Query duplicate candidates for inc1
    candidates_res = client.get(f"/api/v1/incidents/{inc1['id']}/duplicate-candidates?radius_meters=100")
    assert candidates_res.status_code == 200
    candidates = candidates_res.json()
    assert len(candidates) > 0
    candidate_match = next((c for c in candidates if c["candidateIncidentId"] == inc2["id"]), None)
    assert candidate_match is not None
    assert candidate_match["categoryMatch"] is True
    assert candidate_match["distanceMeters"] < 30.0

    # Consolidate inc2 into inc1
    cons_res = client.post(
        "/api/v1/incidents/consolidate",
        json={"primaryIncidentId": inc1["id"], "duplicateIncidentId": inc2["id"], "officerNotes": "Verified identical culvert block"},
        headers=headers
    )
    assert cons_res.status_code == 200
    master = cons_res.json()
    assert master["isConsolidatedMaster"] is True
    assert inc2["id"] in master["consolidatedReportIds"]

    # Verify duplicate incident is marked closed
    dup_check = client.get(f"/api/v1/incidents/{inc2['id']}").json()
    assert dup_check["status"] == "closed"
    assert dup_check["parentIncidentId"] == inc1["id"]

def test_work_order_and_repair_validation():
    # Login as officer
    login_res = client.post("/api/v1/auth/login", json={"username": "officer", "password": "officer123"})
    officer_token = login_res.json()["access_token"]

    # Login as contractor
    ctr_login = client.post("/api/v1/auth/login", json={"username": "contractor", "password": "contractor123"})
    ctr_token = ctr_login.json()["access_token"]

    # Create a test incident
    created_inc = client.post("/api/v1/incidents", json={
        "title": "Crater Pothole Repair Section",
        "description": "Asphalt depression needing immediate patch",
        "category": "roads",
        "severity": "high",
        "address": "Outer Ring Road near Bellandur Flyover, Bengaluru",
        "lat": 12.9304,
        "lng": 77.6784,
        "ward": "Mahadevapura Tech Corridor (Ward 85)",
        "reporterName": "Citizen Commuter",
        "imageUrl": "/images/demo/bengaluru-signpost-demo.jpg"
    }).json()

    # 1. Dispatch Work Order
    dispatch_res = client.post(
        "/api/v1/work-orders/dispatch",
        json={
            "incidentId": created_inc["id"],
            "contractorId": "CTR-04",
            "contractorName": "Apex Paving & Heavy Civils Ltd.",
            "scopeOfWork": "Milling and hot-mix asphalt asphalt paving across 24m² crater"
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert dispatch_res.status_code == 201
    wo = dispatch_res.json()
    wo_id = wo["id"]
    assert wo["status"] == "dispatched"

    # 2. Contractor submits repair with materials and labor
    submit_res = client.post(
        f"/api/v1/work-orders/{wo_id}/submit-repair",
        json={
            "materialsUsed": "2.4 MT Hot-Mix Polymer Asphalt, Tack Coat Binder",
            "laborHours": "16 crew-hours",
            "progressNotes": "Excavation, base shoring and rolling complete.",
            "repairEvidenceUrls": ["/images/demo/bengaluru-signpost-demo.jpg"]
        },
        headers={"Authorization": f"Bearer {ctr_token}"}
    )
    assert submit_res.status_code == 200
    updated_wo = submit_res.json()
    assert updated_wo["status"] == "repair_submitted"
    assert updated_wo["materialsUsed"] == "2.4 MT Hot-Mix Polymer Asphalt, Tack Coat Binder"

    # 3. Officer validates repair
    val_res = client.post(
        f"/api/v1/work-orders/{wo_id}/validate",
        json={
            "decision": "approved",
            "rationale": "High-density compaction and smooth transition to roadway verified via photo.",
            "remainingDamageEstimate": "None observed"
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert val_res.status_code == 200
    assert val_res.json()["validationDecision"] == "approved"
    assert val_res.json()["incidentStatus"] == "resolved"

def test_health_check_versioned():
    res1 = client.get("/health")
    assert res1.status_code == 200
    assert res1.json()["status"] == "online"

    res2 = client.get("/api/v1/health")
    assert res2.status_code == 200
    assert res2.json()["status"] == "online"
    assert res2.json()["database"] == "sqlite"

def test_security_rbac_negative_authorization():
    # 1. Unauthenticated access to protected routes
    unauth_threshold = client.put("/api/v1/thresholds/waste_coverage_threshold", json={"value": 15.0})
    assert unauth_threshold.status_code == 401

    unauth_audit = client.get("/api/v1/audit")
    assert unauth_audit.status_code == 401

    # 2. Invalid / tampered token
    tampered_res = client.get("/api/v1/audit", headers={"Authorization": "Bearer invalid.jwt.signature"})
    assert tampered_res.status_code == 401

    # 3. Citizen login
    cit_login = client.post("/api/v1/auth/login", json={"username": "citizen", "password": "citizen123"})
    assert cit_login.status_code == 200
    cit_token = cit_login.json()["access_token"]

    # 4. Contractor login
    ctr_login = client.post("/api/v1/auth/login", json={"username": "contractor", "password": "contractor123"})
    assert ctr_login.status_code == 200
    ctr_token = ctr_login.json()["access_token"]

    # 5. Officer login
    off_login = client.post("/api/v1/auth/login", json={"username": "officer", "password": "officer123"})
    assert off_login.status_code == 200
    off_token = off_login.json()["access_token"]

    # 6. Admin login
    adm_login = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert adm_login.status_code == 200
    adm_token = adm_login.json()["access_token"]

    # Citizen CANNOT update threshold (requires admin)
    res_cit_thresh = client.put(
        "/api/v1/thresholds/waste_coverage_threshold",
        json={"value": 18.0},
        headers={"Authorization": f"Bearer {cit_token}"}
    )
    assert res_cit_thresh.status_code == 403

    # Officer CANNOT update threshold (requires admin)
    res_off_thresh = client.put(
        "/api/v1/thresholds/waste_coverage_threshold",
        json={"value": 18.0},
        headers={"Authorization": f"Bearer {off_token}"}
    )
    assert res_off_thresh.status_code == 403

    # Admin CAN update threshold
    res_adm_thresh = client.put(
        "/api/v1/thresholds/waste_coverage_threshold",
        json={"value": 18.0},
        headers={"Authorization": f"Bearer {adm_token}"}
    )
    assert res_adm_thresh.status_code == 200

    # Citizen CANNOT dispatch work orders (requires officer/admin)
    res_cit_dispatch = client.post(
        "/api/v1/work-orders/dispatch",
        json={"incidentId": "INF-NONEXISTENT", "contractorId": "CTR-01", "contractorName": "Test", "scopeOfWork": "Test"},
        headers={"Authorization": f"Bearer {cit_token}"}
    )
    assert res_cit_dispatch.status_code == 403

    # Citizen CANNOT validate repairs
    res_cit_val = client.post(
        "/api/v1/work-orders/WO-TEST/validate-repair",
        json={"decision": "approved", "rationale": "Citizen self approval"},
        headers={"Authorization": f"Bearer {cit_token}"}
    )
    assert res_cit_val.status_code == 403

    # Contractor CANNOT validate repairs (must be officer or admin)
    res_ctr_val = client.post(
        "/api/v1/work-orders/WO-TEST/validate-repair",
        json={"decision": "approved", "rationale": "Contractor self approval"},
        headers={"Authorization": f"Bearer {ctr_token}"}
    )
    assert res_ctr_val.status_code == 403

    # Restore threshold back to baseline
    client.put(
        "/api/v1/thresholds/waste_coverage_threshold",
        json={"value": 10.0},
        headers={"Authorization": f"Bearer {adm_token}"}
    )

def test_neutral_warning_actions_and_legal_language():
    login_res = client.post("/api/v1/auth/login", json={"username": "officer", "password": "officer123"})
    officer_token = login_res.json()["access_token"]

    # Ingest event
    ingest_res = client.post("/api/v1/dumping-events", json={
        "address": "Indiranagar 100 Feet Road Verge, Bengaluru",
        "lat": 12.9716,
        "lng": 77.5946,
        "ward": "Indiranagar (Ward 74)",
        "sourceType": "authorized_camera",
        "evidenceUrl": "/images/demo/bengaluru-waste-demo.jpg",
        "coveragePercentage": 22.0
    })
    assert ingest_res.status_code == 201
    evt_id = ingest_res.json()["id"]

    # Confirm event
    decide_res = client.post(
        f"/api/v1/dumping-events/{evt_id}/decide",
        json={"decision": "confirm", "notes": "Verified by officer on optical stream"},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert decide_res.status_code == 200
    evt_data = decide_res.json()
    assert evt_data["status"] == "confirmed"

    # Fetch hotspot detail to verify warning record text
    hotspot_res = client.get("/api/v1/hotspots/HOTSPOT-184")
    assert hotspot_res.status_code == 200
    history = hotspot_res.json().get("warningHistory", [])
    for w in history:
        action_text = w.get("action", "")
        # Ensure unsupported legal jargon is NOT present
        assert "KMC Act" not in action_text
        assert "statutory fine" not in action_text.lower()

def test_citizen_repair_confirm_and_dispute():
    # Create incident
    inc = client.post("/api/v1/incidents", json={
        "title": "Broken Footpath Paver Slabs",
        "description": "Loose granite slabs creating pedestrian trip hazard",
        "category": "roads",
        "severity": "medium",
        "address": "Residency Road near Richmond Circle, Bengaluru",
        "lat": 12.9650,
        "lng": 77.6000,
        "ward": "Shanthi Nagar (Ward 111)",
        "reporterName": "Priya Rao"
    }).json()

    # 1. Citizen Dispute
    disp_res = client.post(
        f"/api/v1/work-orders/incident/{inc['id']}/citizen-confirm",
        json={
            "citizenName": "Priya Rao",
            "response": "disputed_unresolved",
            "notes": "Contractor only filled half of the trench; paver still unstable."
        }
    )
    assert disp_res.status_code == 200
    updated_disp = client.get(f"/api/v1/incidents/{inc['id']}").json()
    assert updated_disp["status"] == "disputed"

    # 2. Citizen Confirmed
    conf_res = client.post(
        f"/api/v1/work-orders/incident/{inc['id']}/citizen-confirm",
        json={
            "citizenName": "Priya Rao",
            "response": "confirmed_fixed",
            "notes": "Paving replaced smoothly, site clean."
        }
    )
    assert conf_res.status_code == 200
    updated_conf = client.get(f"/api/v1/incidents/{inc['id']}").json()
    assert updated_conf["status"] == "archived"

def test_audit_log_hashing_and_retrieval():
    # Login officer
    off_login = client.post("/api/v1/auth/login", json={"username": "officer", "password": "officer123"})
    off_token = off_login.json()["access_token"]

    # Trigger fresh auditable event
    client.post(
        "/api/v1/dumping-events",
        json={
            "address": "MG Road Brigade Junction, Bengaluru",
            "lat": 12.9750,
            "lng": 77.6080,
            "ward": "Shanthi Nagar (Ward 111)",
            "sourceType": "authorized_camera",
            "evidenceUrl": "/images/demo/bengaluru-waste-demo.jpg",
            "coveragePercentage": 14.0
        }
    )

    logs_res = client.get("/api/v1/audit", headers={"Authorization": f"Bearer {off_token}"})
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) > 0
    # The most recent event possesses a 64-character SHA-256 digest
    recent = logs[0]
    assert recent["contentHash"] is not None
    assert len(recent["contentHash"]) == 64
    assert recent["actor"] is not None
    assert recent["timestamp"] is not None
