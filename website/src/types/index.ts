export type UserRole = 'citizen' | 'officer' | 'contractor' | 'admin';

export type IssueCategory =
  | 'roads'
  | 'water'
  | 'electrical'
  | 'lighting'
  | 'drainage'
  | 'structural'
  | 'waste';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus =
  | 'submitted'
  | 'triage'
  | 'assigned'
  | 'in_progress'
  | 'review'
  | 'resolved'
  | 'closed'
  | 'inspection_required'
  | 'disputed'
  | 'reopened'
  | 'archived'
  | 'consolidated';

export interface TimelineEntry {
  timestamp: string;
  title: string;
  description: string;
  user: string;
  type:
    | 'report'
    | 'ai_triage'
    | 'assignment'
    | 'status_change'
    | 'comment'
    | 'milestone'
    | 'consolidation'
    | 'repair_submission'
    | 'repair_validation'
    | 'citizen_confirmation'
    | 'citizen_dispute'
    | 'audit';
}

export interface IncidentImage {
  url: string;
  caption?: string;
  isAfterRepair?: boolean;
  isDemonstration?: boolean;
  isCitizenCapture?: boolean;
  sha256Hash?: string;
  timestamp?: string;
}

export interface EstimatedDimensions {
  areaSqMeters?: number;
  lengthMeters?: number;
  volumeCuMeters?: number;
  coveragePercentage?: number;
}

export interface AIAnalysisResult {
  confidenceScore: number;
  detectedAnomaly: string;
  recommendedPriority: IssueSeverity;
  estimatedCostUsd: number;
  estimatedRepairHours: number;
  safetyHazardLevel: 'Minimal' | 'Moderate' | 'Severe' | 'Life-Threatening';
  trafficImpactIndex: number; // 1-10
  estimatedDimensions?: EstimatedDimensions;
  calibrationNote?: string;
  modelVersion?: string;
  requiresHumanReview?: boolean;
  limitationNotes?: string;
  assessedAt?: string;
}

export interface EvidenceRecord {
  id: string;
  incidentId?: string;
  eventId?: string;
  sourceType:
    | 'citizen_camera'
    | 'authorized_camera'
    | 'contractor_repair'
    | 'officer_inspection'
    | 'system_import';
  url: string;
  mediaType: string;
  sizeBytes: number;
  sha256Hash: string;
  timestamp: string;
  location?: {
    address: string;
    lat: number;
    lng: number;
    ward: string;
  };
  isAfterRepair?: boolean;
  isDemonstration?: boolean;
  provenanceLabel: string;
  metadata?: Record<string, any>;
}

export interface CitizenReport {
  id: string;
  incidentId?: string;
  reporterName: string;
  reporterContact?: string;
  isAnonymous: boolean;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  location: {
    address: string;
    lat: number;
    lng: number;
    ward: string;
  };
  submittedAt: string;
  evidence: IncidentImage[];
  status: 'active' | 'consolidated' | 'rejected';
}

export interface HumanVerificationDecision {
  id: string;
  incidentId?: string;
  eventId?: string;
  decision:
    | 'verified'
    | 'rejected'
    | 'inspection_required'
    | 'duplicate_consolidated'
    | 'more_evidence_required';
  officerId: string;
  officerName: string;
  reason?: string;
  note?: string;
  timestamp: string;
}

export interface ContractorWorkOrder {
  id: string;
  incidentId: string;
  contractorId: string;
  contractorName: string;
  scopeOfWork: string;
  status:
    | 'dispatched'
    | 'acknowledged'
    | 'in_progress'
    | 'repair_submitted'
    | 'rework_required'
    | 'approved_closed';
  dispatchedAt: string;
  targetCompletionAt: string;
  startedAt?: string;
  submittedAt?: string;
  materialsUsed?: string;
  laborHours?: string;
  progressNotes?: string;
  repairEvidence: IncidentImage[];
}

export interface RepairValidationRecord {
  id: string;
  workOrderId: string;
  incidentId: string;
  decision:
    | 'approved'
    | 'partially_repaired'
    | 'inspection_required'
    | 'rework_required'
    | 'rejected'
    | 'more_evidence_required';
  rationale: string;
  remainingDamageEstimate?: string;
  officerId: string;
  officerName: string;
  validatedAt: string;
}

export interface CitizenConfirmation {
  id: string;
  incidentId: string;
  citizenName: string;
  response: 'confirmed_fixed' | 'disputed_unresolved';
  notes?: string;
  submittedAt: string;
  followUpInspectionScheduled?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  previousState?: string;
  newState?: string;
  contentHash?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  isDemonstration?: boolean;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  location: {
    address: string;
    lat: number;
    lng: number;
    ward: string;
  };
  reportedAt: string;
  updatedAt: string;
  reporter: {
    name: string;
    contact?: string;
    isAnonymous: boolean;
  };
  assignedTo?: {
    id: string;
    name: string;
    role: string;
    company?: string;
  };
  aiAnalysis: AIAnalysisResult;
  images: IncidentImage[];
  timeline: TimelineEntry[];
  slaDeadline: string;
  budgetAllocated?: number;

  // Connected Workflow Extensions
  consolidatedReportIds?: string[];
  isConsolidatedMaster?: boolean;
  parentIncidentId?: string;
  hotspotId?: string;
  infrastructureAssetId?: string;
  externalComplaintRef?: string;
  workOrder?: ContractorWorkOrder;
  repairValidation?: RepairValidationRecord;
  citizenConfirmation?: CitizenConfirmation;
  auditTrail?: AuditLogEntry[];
}

export interface DumpingEvent {
  id: string;
  timestamp: string;
  location: {
    address: string;
    lat: number;
    lng: number;
    ward: string;
  };
  sourceType: 'authorized_camera' | 'citizen_report' | 'patrol_officer';
  sourceReference?: string;
  evidenceUrl: string;
  estimatedVolumeM3?: number;
  coveragePercentage?: number;
  status: 'unverified' | 'confirmed' | 'rejected';
  confirmedBy?: string;
  confirmedAt?: string;
  rejectionReason?: string;
  linkedIncidentId?: string;
  linkedHotspotId?: string;
  warningStage?: 1 | 2 | 3 | 4;
  auditHistory: {
    timestamp: string;
    action: string;
    actor: string;
    notes?: string;
  }[];
}

export interface WarningRecord {
  id: string;
  locationKey: string;
  ward: string;
  eventId: string;
  stage: 1 | 2 | 3 | 4;
  issuedAt: string;
  issuedBy: string;
  authorityAction?: string;
  proposedPenaltyAmount?: string;
  ruleReference?: string;
  enforcementReviewStatus?: 'pending_authority_review' | 'approved' | 'dismissed';
  status: 'active' | 'escalated_to_authority' | 'resolved';
}

export interface Hotspot {
  id: string;
  name: string;
  location: {
    address: string;
    lat: number;
    lng: number;
    ward: string;
  };
  radiusMeters: number;
  primaryCategory: IssueCategory;
  dumpingEventIds: string[];
  incidentIds: string[];
  cleanupCount: number;
  recurrenceLevel: 'low' | 'medium' | 'high';
  recurrenceScore: number; // 0 - 100
  lastCleanedAt?: string;
  lastEventAt?: string;
  unresolvedAccumulationEstM3: number;
  preventiveRecommendation: string;
  status: 'active' | 'monitoring' | 'remediated';
}

export interface InfrastructureAsset {
  id: string; // e.g. INF-BLR-ROAD-00182
  name: string;
  type:
    | 'road_segment'
    | 'junction'
    | 'drainage_culvert'
    | 'waste_site'
    | 'electrical_substation'
    | 'overpass_viaduct'
    | 'streetlight_circuit';
  location: {
    address: string;
    lat: number;
    lng: number;
    ward: string;
  };
  linkedIncidentIds: string[];
  damageHistoryCount: number;
  repairHistoryCount: number;
  lastRepairedAt?: string;
  recurrenceLevel: 'low' | 'medium' | 'high';
  maintenanceRecommendation: string;
  auditTrail: {
    timestamp: string;
    event: string;
    actor: string;
  }[];
}

export interface ThresholdConfig {
  id: string;
  key: string;
  label: string;
  description: string;
  value: number;
  unit: string;
  category: string;
  min: number;
  max: number;
  updatedBy: string;
  updatedAt: string;
}

export interface DuplicateMatchCandidate {
  primaryIncidentId: string;
  candidateIncidentId: string;
  distanceMeters: number;
  categoryMatch: boolean;
  timeDeltaHours: number;
  confidenceScore: number; // 0 - 1
  matchReason: string;
}

export interface ContractorPerformanceMetric {
  contractorId: string;
  contractorName: string;
  company: string;
  assignedWorkOrders: number;
  completedRepairs: number;
  humanVerifiedRepairs: number;
  partialRepairs: number;
  rejectedRepairs: number;
  reopenedCases: number;
  firstTimeSuccessRate: number; // percentage
  avgResolutionHours: number;
  repeatFailureRate: number; // percentage
  calculationBasis: string;
}

export interface AuthorizedCameraSource {
  id: string;
  name: string;
  location: {
    address: string;
    lat: number;
    lng: number;
    ward: string;
  };
  isSimulated: boolean;
  streamUrl?: string;
  frameIntervalSeconds: number;
  status: 'active' | 'degraded' | 'offline';
  lastHeartbeat: string;
  authorizedAgency: string;
}

export interface CameraEvent {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  frameEvidenceUrl: string;
  detectedHazard: string;
  confidence: number;
  location: {
    address: string;
    lat: number;
    lng: number;
    ward: string;
  };
  status: 'pending_review' | 'verified_dumping' | 'verified_hazard' | 'false_positive' | 'dismissed';
  isSimulated: boolean;
}

export interface ExternalComplaintIntegration {
  id: string;
  externalRef: string;
  sourceSystem: 'BBMP_SAHAY' | 'BWSSB_HELPLINE' | 'BESCOM_CENTRAL' | 'CPGRAMS';
  status: 'synchronized' | 'mock_connected' | 'unconfigured';
  lastSyncAt: string;
  matchedIncidentId?: string;
  matchRationale?: string;
}

export interface WardRiskMetric {
  wardName: string;
  riskScore: number; // 0 - 100
  activeIssues: number;
  criticalIssues: number;
  populationServed: string;
  primaryRiskCategory: IssueCategory;
}

export interface InfrastructureMetric {
  totalReported: number;
  activeWorkOrders: number;
  resolvedThisMonth: number;
  healthIndexScore: number;
  mttrHours: number;
  aiEscalationsCount: number;
  budgetSpentYTD: number;
}

export type NotificationEventType =
  | 'report_submitted'
  | 'status_changed'
  | 'contractor_assigned'
  | 'report_rejected'
  | 'evidence_submitted'
  | 'ai_escalation'
  | 'dumping_event_flagged'
  | 'warning_issued'
  | 'consolidation_performed'
  | 'repair_validated'
  | 'citizen_confirmation'
  | 'hotspot_escalated'
  | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  relatedIncidentId?: string;
  targetRole: UserRole | 'all';
  isRead: boolean;
  eventType: NotificationEventType;
  priority?: 'normal' | 'high' | 'critical';
}
