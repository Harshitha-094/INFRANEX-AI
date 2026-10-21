import json
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # citizen, officer, contractor, admin
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    company = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    status = Column(String(30), nullable=False, default="submitted")
    address = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    ward = Column(String(100), nullable=False)

    reporter_name = Column(String(100), nullable=False)
    reporter_contact = Column(String(50), nullable=True)
    is_anonymous = Column(Boolean, default=False)

    assigned_to_id = Column(String(50), nullable=True)
    assigned_to_name = Column(String(100), nullable=True)
    assigned_to_role = Column(String(100), nullable=True)
    assigned_to_company = Column(String(100), nullable=True)

    ai_confidence = Column(Float, default=0.0)
    ai_detected_anomaly = Column(Text, nullable=True)
    ai_estimated_cost = Column(Float, default=0.0)
    ai_estimated_hours = Column(Float, default=0.0)
    ai_hazard_level = Column(String(50), default="Moderate")
    ai_traffic_impact = Column(Integer, default=5)
    ai_dimensions_json = Column(Text, nullable=True)

    images_json = Column(Text, default="[]")  # List of IncidentImage
    timeline_json = Column(Text, default="[]")  # List of TimelineEntry
    sla_deadline = Column(String(50), nullable=True)
    budget_allocated = Column(Float, default=0.0)

    is_demonstration = Column(Boolean, default=False)
    is_consolidated_master = Column(Boolean, default=False)
    parent_incident_id = Column(String(50), nullable=True)
    consolidated_report_ids_json = Column(Text, default="[]")
    hotspot_id = Column(String(50), nullable=True)
    infrastructure_asset_id = Column(String(50), nullable=True)
    external_complaint_ref = Column(String(50), nullable=True)

    reported_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CitizenReportModel(Base):
    __tablename__ = "citizen_reports"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), nullable=True)
    reporter_name = Column(String(100), nullable=False)
    reporter_contact = Column(String(50), nullable=True)
    is_anonymous = Column(Boolean, default=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    address = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    ward = Column(String(100), nullable=False)
    evidence_json = Column(Text, default="[]")
    status = Column(String(30), default="active")  # active, consolidated, rejected
    submitted_at = Column(DateTime, default=datetime.utcnow)

class DumpingEventModel(Base):
    __tablename__ = "dumping_events"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    address = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    ward = Column(String(100), nullable=False)
    source_type = Column(String(50), nullable=False)  # authorized_camera, citizen_report, patrol_officer
    source_reference = Column(String(100), nullable=True)
    evidence_url = Column(String(255), nullable=False)
    estimated_volume_m3 = Column(Float, default=0.0)
    coverage_percentage = Column(Float, default=0.0)
    status = Column(String(30), default="unverified")  # unverified, confirmed, rejected
    confirmed_by = Column(String(100), nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String(255), nullable=True)
    linked_incident_id = Column(String(50), nullable=True)
    linked_hotspot_id = Column(String(50), nullable=True)
    warning_stage = Column(Integer, default=1)
    audit_history_json = Column(Text, default="[]")

class WarningRecordModel(Base):
    __tablename__ = "warning_records"

    id = Column(String(50), primary_key=True, index=True)
    location_key = Column(String(100), nullable=False)
    ward = Column(String(100), nullable=False)
    event_id = Column(String(50), nullable=False)
    stage = Column(Integer, nullable=False)  # 1, 2, 3
    issued_at = Column(DateTime, default=datetime.utcnow)
    issued_by = Column(String(100), nullable=False)
    authority_action = Column(Text, nullable=True)
    status = Column(String(50), default="active")

class HotspotModel(Base):
    __tablename__ = "hotspots"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    ward = Column(String(100), nullable=False)
    radius_meters = Column(Float, default=60.0)
    primary_category = Column(String(50), default="waste")
    dumping_event_ids_json = Column(Text, default="[]")
    incident_ids_json = Column(Text, default="[]")
    cleanup_count = Column(Integer, default=0)
    recurrence_level = Column(String(20), default="low")  # low, medium, high
    recurrence_score = Column(Float, default=0.0)
    last_cleaned_at = Column(String(50), nullable=True)
    last_event_at = Column(String(50), nullable=True)
    unresolved_accumulation_est_m3 = Column(Float, default=0.0)
    preventive_recommendation = Column(Text, nullable=True)
    status = Column(String(30), default="active")

class InfrastructureAssetModel(Base):
    __tablename__ = "infrastructure_assets"

    id = Column(String(50), primary_key=True, index=True)  # INF-BLR-ROAD-00182
    name = Column(String(255), nullable=False)
    asset_type = Column(String(50), nullable=False)
    address = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    ward = Column(String(100), nullable=False)
    linked_incident_ids_json = Column(Text, default="[]")
    damage_history_count = Column(Integer, default=0)
    repair_history_count = Column(Integer, default=0)
    last_repaired_at = Column(String(50), nullable=True)
    recurrence_level = Column(String(20), default="low")
    maintenance_recommendation = Column(Text, nullable=True)
    audit_trail_json = Column(Text, default="[]")

class ThresholdConfigModel(Base):
    __tablename__ = "threshold_configs"

    id = Column(String(50), primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    label = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    min_val = Column(Float, default=0.0)
    max_val = Column(Float, default=100.0)
    updated_by = Column(String(100), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WorkOrderModel(Base):
    __tablename__ = "work_orders"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), nullable=False, index=True)
    contractor_id = Column(String(50), nullable=False)
    contractor_name = Column(String(100), nullable=False)
    scope_of_work = Column(Text, nullable=False)
    status = Column(String(30), default="dispatched")  # dispatched, acknowledged, in_progress, repair_submitted, rework_required, approved_closed
    dispatched_at = Column(DateTime, default=datetime.utcnow)
    target_completion_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    materials_used = Column(Text, nullable=True)
    labor_hours = Column(String(100), nullable=True)
    progress_notes = Column(Text, nullable=True)
    repair_evidence_json = Column(Text, default="[]")

class RepairValidationModel(Base):
    __tablename__ = "repair_validations"

    id = Column(String(50), primary_key=True, index=True)
    work_order_id = Column(String(50), nullable=False, index=True)
    incident_id = Column(String(50), nullable=False, index=True)
    decision = Column(String(50), nullable=False)  # approved, partially_repaired, inspection_required, rework_required, rejected
    rationale = Column(Text, nullable=False)
    remaining_damage_estimate = Column(Text, nullable=True)
    officer_id = Column(String(50), nullable=False)
    officer_name = Column(String(100), nullable=False)
    validated_at = Column(DateTime, default=datetime.utcnow)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor = Column(String(100), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=False)
    details = Column(Text, nullable=False)
    previous_state = Column(String(100), nullable=True)
    new_state = Column(String(100), nullable=True)
    content_hash = Column(String(64), nullable=True)

class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    related_incident_id = Column(String(50), nullable=True)
    target_role = Column(String(50), nullable=False)
    is_read = Column(Boolean, default=False)
    event_type = Column(String(50), nullable=False)
    priority = Column(String(20), default="normal")
