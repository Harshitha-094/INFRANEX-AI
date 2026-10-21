import {
  ContractorWorkOrder,
  RepairValidationRecord,
  CitizenConfirmation,
  Incident
} from '../types';

const WORK_ORDERS_STORAGE_KEY = 'infranex_work_orders_v1';
const VALIDATIONS_STORAGE_KEY = 'infranex_repair_validations_v1';
const CONFIRMATIONS_STORAGE_KEY = 'infranex_citizen_confirmations_v1';

export const loadStoredWorkOrders = (): ContractorWorkOrder[] => {
  try {
    const raw = localStorage.getItem(WORK_ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load work orders from storage:', err);
  }

  // Initial seed work order for demonstrability
  return [
    {
      id: 'WO-2026-0081',
      incidentId: 'INF-2026-9041',
      contractorId: 'CTR-001',
      contractorName: 'Apex Paving & Heavy Civils',
      scopeOfWork: 'Cold-milling, deep bitumen compaction, and high-traction thermoplastic top-layer paving.',
      status: 'in_progress',
      dispatchedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      targetCompletionAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      materialsUsed: 'Grade-4 Bitumen Emulsion (450kg), M-20 Aggregate (2.4 tons)',
      laborHours: '14 crew hours (4 pavers, 1 foreman)',
      progressNotes: 'Sub-base layer excavated and compacted. Ready for final asphalt wear course.',
      repairEvidence: [],
    },
    {
      id: 'WO-2026-0082',
      incidentId: 'INF-2026-9048',
      contractorId: 'CTR-003',
      contractorName: 'CleanCity Solid Waste Logistics',
      scopeOfWork: 'Heavy machinery mechanized solid waste clearing, deodorization spraying, and installation of anti-dumping signboards.',
      status: 'dispatched',
      dispatchedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      targetCompletionAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
      repairEvidence: [],
    },
  ];
};

export const saveStoredWorkOrders = (orders: ContractorWorkOrder[]): void => {
  try {
    localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.warn('Failed to persist work orders:', err);
  }
};

export const loadStoredValidations = (): RepairValidationRecord[] => {
  try {
    const raw = localStorage.getItem(VALIDATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load validations from storage:', err);
  }
  return [];
};

export const saveStoredValidations = (validations: RepairValidationRecord[]): void => {
  try {
    localStorage.setItem(VALIDATIONS_STORAGE_KEY, JSON.stringify(validations));
  } catch (err) {
    console.warn('Failed to persist repair validations:', err);
  }
};

export const loadStoredCitizenConfirmations = (): CitizenConfirmation[] => {
  try {
    const raw = localStorage.getItem(CONFIRMATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load citizen confirmations:', err);
  }
  return [];
};

export const saveStoredCitizenConfirmations = (confirmations: CitizenConfirmation[]): void => {
  try {
    localStorage.setItem(CONFIRMATIONS_STORAGE_KEY, JSON.stringify(confirmations));
  } catch (err) {
    console.warn('Failed to persist citizen confirmations:', err);
  }
};
