import { AuditLogEntry } from '../types';

const AUDIT_STORAGE_KEY = 'infranex_audit_logs_v1';

export const loadStoredAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load audit logs from storage:', err);
  }

  // Initial demonstration audit logs
  return [
    {
      id: 'AUD-001',
      timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      actor: 'system',
      actorRole: 'admin',
      action: 'SYSTEM_BOOT',
      entityType: 'platform',
      entityId: 'SYS-CORE',
      details: 'INFRANEX AI core platform engine started with schema version 5.',
      contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      id: 'AUD-002',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      actor: 'Officer Suresh Kumar',
      actorRole: 'officer',
      action: 'DUMPING_EVENT_VERIFIED',
      entityType: 'dumping_event',
      entityId: 'DMP-BLR-002',
      details: 'Confirmed illegal construction debris dumping at K.R. Market. Warning Stage 2 issued.',
      contentHash: 'a7c5b1613589b2160b7fc239b5fa0884d8f8f2e29388147d345a0b73c43be977',
    },
  ];
};

export const saveStoredAuditLogs = (logs: AuditLogEntry[]): void => {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn('Failed to persist audit logs:', err);
  }
};

/**
 * Creates an append-only audit log entry with simulated or crypto hash.
 */
export const createAuditLog = (params: {
  actor: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  previousState?: string;
  newState?: string;
}): AuditLogEntry => {
  const nowIso = new Date().toISOString();
  const id = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;
  const payload = `${nowIso}|${params.actor}|${params.action}|${params.entityType}|${params.entityId}|${params.details}`;

  // Simple string hash for demo/offline integrity simulation
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const contentHash = Math.abs(hash).toString(16).padStart(16, '0') + 'sha256';

  return {
    id,
    timestamp: nowIso,
    actor: params.actor,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    previousState: params.previousState,
    newState: params.newState,
    contentHash,
  };
};
