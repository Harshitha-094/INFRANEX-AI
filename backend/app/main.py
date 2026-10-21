import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.database import engine, Base, SessionLocal
from app.models import (
    UserModel,
    IncidentModel,
    HotspotModel,
    DumpingEventModel,
    InfrastructureAssetModel,
    ThresholdConfigModel,
    WorkOrderModel,
    AuditLogModel,
)
from app.routers import (
    auth,
    incidents,
    dumping_events,
    hotspots,
    infrastructure,
    work_orders,
    thresholds,
    analytics,
    audit,
    integrations,
)

# Seed Initial Demonstration Users & Records
def seed_initial_data(db: Session):
    # 1. Users
    if db.query(UserModel).count() == 0:
        default_users = [
            UserModel(
                id="USR-CIT-01",
                username="citizen",
                email="citizen@infranex.civic",
                hashed_password=hash_password("citizen123"),
                full_name="Aarav Sharma",
                role="citizen",
                phone="+91 98450 11223"
            ),
            UserModel(
                id="USR-OFF-01",
                username="officer",
                email="officer.vance@bbmp.gov.in",
                hashed_password=hash_password("officer123"),
                full_name="Officer Marcus Vance",
                role="officer",
                department="BBMP Civil Infrastructure & Quality Audit",
                phone="+91 98450 44556"
            ),
            UserModel(
                id="USR-CTR-01",
                username="contractor",
                email="dispatch@apexpaving.co.in",
                hashed_password=hash_password("contractor123"),
                full_name="Apex Paving & Heavy Civils Ltd.",
                role="contractor",
                company="Apex Civil Engineering",
                phone="+91 98450 77889"
            ),
            UserModel(
                id="USR-ADM-01",
                username="admin",
                email="admin.command@infranex.civic",
                hashed_password=hash_password("admin123"),
                full_name="Municipal Admin Command",
                role="admin",
                department="Metropolitan Infrastructure Command Center"
            )
        ]
        db.add_all(default_users)
        db.commit()

    # 2. Thresholds
    if db.query(ThresholdConfigModel).count() == 0:
        default_thresholds = [
            ThresholdConfigModel(
                id="TH-01",
                key="waste_coverage_threshold",
                label="Garbage Coverage Trigger Threshold",
                description="Verge or sidewalk surface area coverage percentage before triggering automated complaint recommendation",
                value=10.0,
                unit="%",
                category="waste",
                min_val=5.0,
                max_val=50.0,
                updated_by="System Initializer"
            ),
            ThresholdConfigModel(
                id="TH-02",
                key="waste_volume_threshold_m3",
                label="Waste Volume Threshold",
                description="Estimated cubic meters of accumulated solid waste requiring prime mechanical clearing dispatch",
                value=5.0,
                unit="m³",
                category="waste",
                min_val=1.0,
                max_val=30.0,
                updated_by="System Initializer"
            ),
            ThresholdConfigModel(
                id="TH-03",
                key="ai_confidence_gate",
                label="AI Assessment Confidence Gate",
                description="Minimum model confidence score required before advancing case into human officer queue",
                value=70.0,
                unit="%",
                category="ai_governance",
                min_val=50.0,
                max_val=95.0,
                updated_by="System Initializer"
            ),
            ThresholdConfigModel(
                id="TH-04",
                key="spatial_duplicate_radius_meters",
                label="Spatial Duplicate Consolidation Radius",
                description="Maximum geographical distance between incident reports considered for candidate duplicate matching",
                value=50.0,
                unit="meters",
                category="consolidation",
                min_val=10.0,
                max_val=200.0,
                updated_by="System Initializer"
            ),
            ThresholdConfigModel(
                id="TH-05",
                key="critical_emergency_sla_hours",
                label="Critical Hazard Emergency SLA",
                description="Maximum response window before automated administrative escalation",
                value=4.0,
                unit="hours",
                category="sla",
                min_val=1.0,
                max_val=12.0,
                updated_by="System Initializer"
            )
        ]
        db.add_all(default_thresholds)
        db.commit()

    # 3. Hotspots
    if db.query(HotspotModel).count() == 0:
        hotspots_data = [
            HotspotModel(
                id="HOTSPOT-184",
                name="Vittal Mallya Road & Cubbon Perimeter",
                address="Vittal Mallya Road near Cubbon Park Perimeter, Bengaluru",
                lat=12.9716,
                lng=77.5946,
                ward="Indiranagar & Domlur Central (Ward 74)",
                radius_meters=60.0,
                primary_category="waste",
                dumping_event_ids_json=json.dumps(["DUMP-2026-001", "DUMP-2026-002", "DUMP-2026-003"]),
                incident_ids_json=json.dumps(["INF-2026-9048"]),
                cleanup_count=5,
                recurrence_level="high",
                recurrence_score=86.0,
                last_cleaned_at="2026-10-12T14:00:00Z",
                last_event_at="2026-10-19T09:15:00Z",
                unresolved_accumulation_est_m3=14.2,
                preventive_recommendation="Deploy fixed deterrence surveillance camera and request BBMP Night Marshal patrol."
            ),
            HotspotModel(
                id="HOTSPOT-109",
                name="Silk Board - HSR Walkway Corridor",
                address="Hosur Road Service Lane near Silk Board Junction, Bengaluru",
                lat=12.9175,
                lng=77.6234,
                ward="Bommanahalli & Electronic City (Ward 174)",
                radius_meters=100.0,
                primary_category="lighting",
                dumping_event_ids_json=json.dumps([]),
                incident_ids_json=json.dumps(["INF-2026-9045"]),
                cleanup_count=3,
                recurrence_level="medium",
                recurrence_score=64.0,
                last_cleaned_at="2026-09-28T18:00:00Z",
                last_event_at="2026-10-18T20:45:00Z",
                unresolved_accumulation_est_m3=0.0,
                preventive_recommendation="Underground feeder cable armor replacement due to persistent moisture intrusion."
            )
        ]
        db.add_all(hotspots_data)
        db.commit()

    # 4. Infrastructure Assets
    if db.query(InfrastructureAssetModel).count() == 0:
        assets_data = [
            InfrastructureAssetModel(
                id="INF-BLR-ROAD-00182",
                name="Outer Ring Road (Marathahalli Overpass Section)",
                asset_type="road_segment",
                address="Outer Ring Road near Marathahalli Bridge, Mahadevapura",
                lat=12.9553,
                lng=77.6985,
                ward="Mahadevapura Tech Corridor (Ward 85)",
                linked_incident_ids_json=json.dumps(["INF-2026-9041"]),
                damage_history_count=6,
                repair_history_count=5,
                last_repaired_at="2026-10-05T11:00:00Z",
                recurrence_level="high",
                maintenance_recommendation="Heavy sub-grade asphalt milling and concrete base re-stabilization needed."
            ),
            InfrastructureAssetModel(
                id="INF-BLR-WASTE-00088",
                name="Vittal Mallya Municipal Verge & Storm Culvert Flank",
                asset_type="waste_site",
                address="Vittal Mallya Road near Cubbon Park Perimeter, Bengaluru",
                lat=12.9716,
                lng=77.5946,
                ward="Indiranagar & Domlur Central (Ward 74)",
                linked_incident_ids_json=json.dumps(["INF-2026-9048"]),
                damage_history_count=8,
                repair_history_count=5,
                last_repaired_at="2026-10-12T14:00:00Z",
                recurrence_level="high",
                maintenance_recommendation="Install 2.4m steel mesh barrier and high-lumen solar floodlighting."
            )
        ]
        db.add_all(assets_data)
        db.commit()

from starlette.requests import Request
from starlette.responses import JSONResponse
from app.core.security_headers import SecurityHeadersMiddleware
from app.core.rate_limiter import RateLimiterMiddleware

# Create tables and seed immediately on startup/import
Base.metadata.create_all(bind=engine)
_init_db = SessionLocal()
try:
    seed_initial_data(_init_db)
finally:
    _init_db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="INFRANEX AI — Civic Infrastructure Platform API",
    description="Backend API for AI-Powered Civic Infrastructure Detection, Measurement, Verification, and Accountability.",
    version="1.0.0",
    lifespan=lifespan
)

# 1. Anti-DoS Payload Size Verification Middleware
@app.middleware("http")
async def verify_payload_size_limit(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.MAX_REQUEST_BODY_BYTES:
        return JSONResponse(
            status_code=413,
            content={"detail": f"Payload too large. Maximum allowed size is {settings.MAX_REQUEST_BODY_BYTES // (1024*1024)} MB."}
        )
    return await call_next(request)

# 2. HTTP Security Headers Middleware (X-Frame-Options, CSP, HSTS, Sniff Guard)
app.add_middleware(SecurityHeadersMiddleware)

# 3. Sliding Window Rate Limiter & Brute-Force Shield Middleware
app.add_middleware(RateLimiterMiddleware, general_limit=250, auth_limit=30, window_seconds=60)

# 4. Hardened Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https://.*\.netlify\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)

# API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(incidents.router, prefix=api_v1)
app.include_router(dumping_events.router, prefix=api_v1)
app.include_router(hotspots.router, prefix=api_v1)
app.include_router(infrastructure.router, prefix=api_v1)
app.include_router(work_orders.router, prefix=api_v1)
app.include_router(thresholds.router, prefix=api_v1)
app.include_router(analytics.router, prefix=api_v1)
app.include_router(audit.router, prefix=api_v1)
app.include_router(integrations.router, prefix=api_v1)

@app.get("/health", tags=["System"])
@app.get(f"{api_v1}/health", tags=["System"])
def health_check():
    return {
        "status": "online",
        "service": "INFRANEX AI Civic Backend",
        "version": "1.0.0",
        "database": settings.DATABASE_URL.split("://")[0]
    }

@app.get("/", tags=["System"])
def root():
    return {
        "message": "INFRANEX AI Civic Platform API",
        "documentation": "/docs",
        "health": "/health"
    }
