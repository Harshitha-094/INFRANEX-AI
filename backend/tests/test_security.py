import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.sanitizer import sanitize_text, sanitize_dict

client = TestClient(app)

def test_security_headers_present():
    """Verify production security headers are present on all responses."""
    response = client.get("/health")
    assert response.status_code == 200
    
    headers = response.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert "max-age=31536000" in headers.get("strict-transport-security", "")
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "geolocation=(self)" in headers.get("permissions-policy", "")
    assert "x-request-id" in headers

def test_input_sanitizer_removes_xss_vectors():
    """Verify the sanitizer strips malicious scripts, tags, and javascript schemes."""
    # Test script injection
    malicious_script = "Pothole near gate <script>alert('pwned')</script> please fix"
    cleaned = sanitize_text(malicious_script)
    assert "<script>" not in cleaned
    assert "alert" not in cleaned
    assert "Pothole near gate please fix" in cleaned

    # Test dangerous HTML tags & event handlers
    malicious_img = "Broken drain <img src=x onerror=stealCookies()> urgent"
    cleaned_img = sanitize_text(malicious_img)
    assert "<img" not in cleaned_img
    assert "onerror=" not in cleaned_img
    assert "stealCookies" not in cleaned_img
    assert "Broken drain urgent" in cleaned_img

    # Test legitimate punctuation is preserved
    normal_text = "St. John's Road, 5th Cross & 80 Feet Road (Bengaluru)"
    cleaned_normal = sanitize_text(normal_text)
    assert cleaned_normal == normal_text

def test_input_sanitizer_dict_recursive():
    """Verify dictionary sanitization works recursively on nested payloads."""
    payload = {
        "title": "Road hazard <script>alert(1)</script>",
        "metadata": {
            "address": "MG Road <iframe src='evil.com'></iframe>",
            "tags": ["critical", "<b>pothole</b>"]
        }
    }
    clean_dict = sanitize_dict(payload)
    assert clean_dict["title"] == "Road hazard"
    assert clean_dict["metadata"]["address"] == "MG Road"
    assert clean_dict["metadata"]["tags"] == ["critical", "pothole"]

def test_payload_size_limit_rejection():
    """Verify oversized payloads exceeding 15MB receive HTTP 413 Payload Too Large."""
    # Send request with content-length header indicating excessive body
    oversized_headers = {
        "content-length": str(20 * 1024 * 1024)  # 20 MB
    }
    response = client.post("/api/v1/incidents", headers=oversized_headers, json={"test": "data"})
    assert response.status_code == 413
    assert "maximum allowed size" in response.json()["detail"].lower()

def test_cors_headers_for_allowed_origins():
    """Verify CORS headers correctly allow configured origins like the Netlify domain."""
    origin = "https://infranexai.netlify.app"
    response = client.options(
        "/api/v1/incidents",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
