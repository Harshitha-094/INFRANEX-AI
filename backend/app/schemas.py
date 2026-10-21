from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# User & Auth
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    department: Optional[str] = None
    company: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    model_config = {"from_attributes": True}

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Evidence & Analysis
class IncidentImageSchema(BaseModel):
    url: str
    caption: Optional[str] = None
    isAfterRepair: Optional[bool] = False
    isDemonstration: Optional[bool] = False
    isCitizenCapture: Optional[bool] = False
    sha256Hash: Optional[str] = None
    timestamp: Optional[str] = None

class TimelineEntrySchema(BaseModel):
    timestamp: str
    title: str
    description: str
    user: str
    type: str

class EstimatedDimensionsSchema(BaseModel):
    areaSqMeters: Optional[float] = None
    lengthMeters: Optional[float] = None
    volumeCuMeters: Optional[float] = None
    coveragePercentage: Optional[float] = None

class AIAnalysisResultSchema(BaseModel):
    confidenceScore: float
    detectedAnomaly: str
    recommendedPriority: str
    estimatedCostUsd: float
    estimatedRepairHours: float
    safetyHazardLevel: str
    trafficImpactIndex: int
    estimatedDimensions: Optional[EstimatedDimensionsSchema] = None
    calibrationNote: Optional[str] = None
    modelVersion: Optional[str] = "INFRANEX-Vision v2.0"
    requiresHumanReview: Optional[bool] = True
    limitationNotes: Optional[str] = None
    assessedAt: Optional[str] = None

class EvidenceValidationRequest(BaseModel):
    imageUrl: str
    category: str
    isDemonstration: Optional[bool] = False

class EvidenceValidationResponse(BaseModel):
    validationStatus: str
    errorCode: Optional[str] = None
    message: str
    isRelevant: bool
    confidence: float
    modelIdentity: str
    category: str
    detectedContent: str
    requiresHumanReview: bool
    qualityScore: float
    details: Dict[str, Any] = {}

# Incidents
class IncidentCreate(BaseModel):
    title: str
    description: str
    category: str
    severity: str
    address: str
    lat: float
    lng: float
    ward: str
    reporterName: str
    reporterContact: Optional[str] = None
    isAnonymous: bool = False
    imageUrl: Optional[str] = None
    isDemonstration: bool = False

class IncidentStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None
    rejectionReason: Optional[str] = None

class IncidentConsolidationRequest(BaseModel):
    primaryIncidentId: str
    duplicateIncidentId: Optional[str] = None
    duplicateIncidentIds: Optional[List[str]] = None
    reason: Optional[str] = None
    officerNotes: Optional[str] = None

class IncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    severity: str
    status: str
    location: Dict[str, Any]
    reporter: Dict[str, Any]
    assignedTo: Optional[Dict[str, Any]] = None
    aiAnalysis: Dict[str, Any]
    images: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]
    slaDeadline: Optional[str] = None
    budgetAllocated: Optional[float] = 0.0
    isDemonstration: bool = False
    isConsolidatedMaster: bool = False
    parentIncidentId: Optional[str] = None
    consolidatedReportIds: List[str] = []
    hotspotId: Optional[str] = None
    infrastructureAssetId: Optional[str] = None
    externalComplaintRef: Optional[str] = None
    reportedAt: str
    updatedAt: str

# Dumping Events
class DumpingEventCreate(BaseModel):
    address: str
    lat: float
    lng: float
    ward: str
    sourceType: str
    sourceReference: Optional[str] = None
    evidenceUrl: str
    estimatedVolumeM3: Optional[float] = 0.0
    coveragePercentage: Optional[float] = 0.0

class DumpingEventDecision(BaseModel):
    decision: str  # confirmed or rejected
    reason: Optional[str] = None
    notes: Optional[str] = None

class DumpingEventResponse(BaseModel):
    id: str
    timestamp: str
    location: Dict[str, Any]
    sourceType: str
    sourceReference: Optional[str] = None
    evidenceUrl: str
    estimatedVolumeM3: float
    coveragePercentage: float
    status: str
    confirmedBy: Optional[str] = None
    confirmedAt: Optional[str] = None
    rejectionReason: Optional[str] = None
    linkedIncidentId: Optional[str] = None
    linkedHotspotId: Optional[str] = None
    warningStage: int
    auditHistory: List[Dict[str, Any]]

# Hotspots
class HotspotResponse(BaseModel):
    id: str
    name: str
    location: Dict[str, Any]
    radiusMeters: float
    primaryCategory: str
    dumpingEventIds: List[str]
    incidentIds: List[str]
    cleanupCount: int
    recurrenceLevel: str
    recurrenceScore: float
    lastCleanedAt: Optional[str] = None
    lastEventAt: Optional[str] = None
    unresolvedAccumulationEstM3: float
    preventiveRecommendation: str
    status: str

# Thresholds
class ThresholdUpdate(BaseModel):
    value: float

class ThresholdResponse(BaseModel):
    id: str
    key: str
    label: str
    description: str
    value: float
    unit: str
    category: str
    min: float
    max: float
    updatedBy: str
    updatedAt: str

class ThresholdEvaluationRequest(BaseModel):
    key: str
    observedValue: float

class ThresholdEvaluationResponse(BaseModel):
    key: str
    observedValue: float
    thresholdValue: float
    isExceeded: bool
    recommendedAction: str
    requiresHumanValidation: bool
    explanation: str

# Work Orders & Repairs
class WorkOrderDispatch(BaseModel):
    incidentId: str
    contractorId: str
    contractorName: str
    scopeOfWork: str
    targetDays: Optional[int] = 2

class RepairSubmission(BaseModel):
    materialsUsed: str
    laborHours: str
    progressNotes: str
    repairEvidenceUrls: List[str] = []
    repairEvidence: Optional[List[Dict[str, Any]]] = []

class RepairValidationRequest(BaseModel):
    decision: str  # approved, partially_repaired, inspection_required, rework_required, rejected
    rationale: str
    remainingDamageEstimate: Optional[str] = None

class CitizenConfirmationRequest(BaseModel):
    citizenName: str
    response: str  # confirmed_fixed or disputed_unresolved
    notes: Optional[str] = None

# Infrastructure Assets
class InfrastructureAssetResponse(BaseModel):
    id: str
    name: str
    type: str
    location: Dict[str, Any]
    linkedIncidentIds: List[str]
    damageHistoryCount: int
    repairHistoryCount: int
    lastRepairedAt: Optional[str] = None
    recurrenceLevel: str
    maintenanceRecommendation: str
    auditTrail: List[Dict[str, Any]]

# Audit Log
class AuditLogResponse(BaseModel):
    id: str
    timestamp: str
    actor: str
    actorRole: str
    action: str
    entityType: str
    entityId: str
    details: str
    previousState: Optional[str] = None
    newState: Optional[str] = None
    contentHash: Optional[str] = None
