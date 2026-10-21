import { DumpingEvent, WarningRecord, Incident, ThresholdConfig } from '../types';
import { INITIAL_DUMPING_EVENTS, INITIAL_WARNING_RECORDS } from '../data/mockData';
import { evaluateThresholdRule } from './thresholdService';

const DUMPING_EVENTS_STORAGE_KEY = 'infranex_dumping_events_v1';
const WARNING_RECORDS_STORAGE_KEY = 'infranex_warning_records_v1';

export const loadStoredDumpingEvents = (): DumpingEvent[] => {
  try {
    const raw = localStorage.getItem(DUMPING_EVENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load dumping events from storage, falling back to defaults:', err);
  }
  return INITIAL_DUMPING_EVENTS;
};

export const saveStoredDumpingEvents = (events: DumpingEvent[]): void => {
  try {
    localStorage.setItem(DUMPING_EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn('Failed to persist dumping events:', err);
  }
};

export const loadStoredWarningRecords = (): WarningRecord[] => {
  try {
    const raw = localStorage.getItem(WARNING_RECORDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load warning records from storage:', err);
  }
  return INITIAL_WARNING_RECORDS;
};

export const saveStoredWarningRecords = (records: WarningRecord[]): void => {
  try {
    localStorage.setItem(WARNING_RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Failed to persist warning records:', err);
  }
};

export interface ProcessDumpingConfirmationResult {
  updatedEvent: DumpingEvent;
  newWarningRecord: WarningRecord;
  newWasteIncident?: Incident;
  linkedIncidentId?: string;
  auditMessage: string;
}

/**
 * Confirms a dumping event:
 * 1. Sets status to 'confirmed', assigns confirmedBy and confirmedAt
 * 2. Increments 3-stage warning counter for the specific location/ward
 * 3. Evaluates accumulation threshold
 * 4. Links to existing active waste incident or generates a consolidated waste ticket
 */
export const processDumpingConfirmation = (
  event: DumpingEvent,
  officerName: string,
  existingWarnings: WarningRecord[],
  activeIncidents: Incident[],
  thresholds: ThresholdConfig[]
): ProcessDumpingConfirmationResult => {
  const nowIso = new Date().toISOString();
  const locationKey = `${event.location.ward}_${event.location.address.substring(0, 30)}`;

  // Determine warning stage (1, 2, or 3) based on prior confirmed warnings at this location
  // Determine warning stage (1, 2, 3, or 4: Proposed Penalty Notice)
  const priorWarnings = existingWarnings.filter(
    (w) => w.locationKey === locationKey || w.ward === event.location.ward
  );
  const nextStage = Math.min(4, priorWarnings.length + 1) as 1 | 2 | 3 | 4;

  let authorityAction = 'Warning 1: First confirmed occurrence — formal municipal warning notice issued.';
  let proposedPenalty: string | undefined = undefined;
  const ruleReference = 'BBMP Solid Waste Management By-laws 2020 Sec 14(a)';
  let enforcementReviewStatus: 'pending_authority_review' | 'approved' | 'dismissed' | undefined = undefined;

  if (nextStage === 2) {
    authorityAction = 'Warning 2: Second confirmed occurrence — progressive infraction warning preserved.';
  } else if (nextStage === 3) {
    authorityAction = 'Warning 3: Final warning — continued infractions create a formal penalty notice and enforcement review.';
  } else if (nextStage === 4) {
    authorityAction = 'After three warnings: Proposed penalty notice created with official enforcement-review task.';
    proposedPenalty = 'PENDING AUTHORITY REVIEW';
    enforcementReviewStatus = 'pending_authority_review';
  }

  const newWarningRecord: WarningRecord = {
    id: `WARN-BLR-${Math.floor(1000 + Math.random() * 9000)}`,
    locationKey,
    ward: event.location.ward,
    eventId: event.id,
    stage: nextStage,
    issuedAt: nowIso,
    issuedBy: officerName,
    authorityAction,
    proposedPenaltyAmount: proposedPenalty,
    ruleReference,
    enforcementReviewStatus,
    status: nextStage === 4 ? 'escalated_to_authority' : 'active',
  };

  // Evaluate accumulation threshold
  const evalResult = evaluateThresholdRule(
    thresholds,
    'GARBAGE_ACCUMULATION_COVERAGE_PCT',
    event.coveragePercentage ?? 0
  );

  let newWasteIncident: Incident | undefined;
  let linkedIncidentId = event.linkedIncidentId;

  if (evalResult.isExceeded) {
    // Check if an active waste incident exists in this ward
    const activeWaste = activeIncidents.find(
      (inc) =>
        inc.category === 'waste' &&
        inc.location.ward === event.location.ward &&
        ['submitted', 'triage', 'assigned', 'in_progress'].includes(inc.status)
    );

    if (activeWaste) {
      linkedIncidentId = activeWaste.id;
    } else {
      // Create a consolidated municipal waste ticket
      const newIncId = `INF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      newWasteIncident = {
        id: newIncId,
        title: `Chronic Solid Waste & Debris Accumulation (${event.location.ward})`,
        description: `Automated municipal ticket triggered after verified dumping event #${event.id} exceeded ${evalResult.thresholdValue}% coverage threshold. ${evalResult.recommendedAction}`,
        category: 'waste',
        severity: 'high',
        status: 'triage',
        location: {
          address: event.location.address,
          lat: event.location.lat,
          lng: event.location.lng,
          ward: event.location.ward,
        },
        reportedAt: nowIso,
        updatedAt: nowIso,
        reporter: {
          name: 'INFRANEX Recurrence Intelligence',
          contact: 'Automated Threshold System',
          isAnonymous: false,
        },
        aiAnalysis: {
          confidenceScore: 0.94,
          detectedAnomaly: 'Solid waste volume threshold exceeded via confirmed dumping event',
          recommendedPriority: 'high',
          estimatedCostUsd: 1400.0,
          estimatedRepairHours: 8.0,
          safetyHazardLevel: 'Severe',
          trafficImpactIndex: 5,
          estimatedDimensions: {
            areaSqMeters: 25.0,
            volumeCuMeters: event.estimatedVolumeM3,
            coveragePercentage: event.coveragePercentage,
          },
        },
        images: [
          {
            url: event.evidenceUrl,
            caption: `Verified Dumping Evidence Event #${event.id}`,
            isCitizenCapture: false,
            isDemonstration: false,
          },
        ],
        timeline: [
          {
            timestamp: nowIso,
            title: 'Consolidated Waste Incident Generated',
            description: `Triggered by confirmed dumping event #${event.id}. ${evalResult.explanation}`,
            user: 'Threshold Engine',
            type: 'report',
          },
        ],
        slaDeadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        budgetAllocated: 1400.0,
        isDemonstration: false,
        isConsolidatedMaster: true,
      };
      linkedIncidentId = newIncId;
    }
  }

  const updatedEvent: DumpingEvent = {
    ...event,
    status: 'confirmed',
    confirmedBy: officerName,
    confirmedAt: nowIso,
    warningStage: nextStage,
    linkedIncidentId,
    auditHistory: [
      ...(event.auditHistory || []),
      {
        timestamp: nowIso,
        action: 'CONFIRMED',
        actor: officerName,
        notes: `Confirmed event at ${event.location.address}. Warning Stage ${nextStage} applied. ${
          linkedIncidentId ? `Linked to incident #${linkedIncidentId}.` : ''
        }`,
      },
    ],
  };

  const auditMessage = `Dumping event #${event.id} confirmed by ${officerName}. Warning Stage: ${nextStage}. Accumulation rule evaluated: ${evalResult.explanation}`;

  return {
    updatedEvent,
    newWarningRecord,
    newWasteIncident,
    linkedIncidentId,
    auditMessage,
  };
};

/**
 * Rejects a dumping event.
 * IMPORTANT: Rejected events DO NOT advance warning stages or count toward recurrence.
 */
export const processDumpingRejection = (
  event: DumpingEvent,
  officerName: string,
  rejectionReason: string
): DumpingEvent => {
  const nowIso = new Date().toISOString();
  return {
    ...event,
    status: 'rejected',
    rejectionReason,
    auditHistory: [
      ...(event.auditHistory || []),
      {
        timestamp: nowIso,
        action: 'REJECTED',
        actor: officerName,
        notes: `Event rejected: ${rejectionReason}. Will not count towards warning stages or hotspot recurrence.`,
      },
    ],
  };
};
