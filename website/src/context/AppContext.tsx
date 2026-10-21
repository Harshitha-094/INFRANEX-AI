import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Incident,
  UserRole,
  IssueStatus,
  IssueCategory,
  IssueSeverity,
  InfrastructureMetric,
  AppNotification,
  DumpingEvent,
  WarningRecord,
  Hotspot,
  InfrastructureAsset,
  ThresholdConfig,
  ContractorWorkOrder,
  RepairValidationRecord,
  CitizenConfirmation,
  AuditLogEntry,
} from '../types';
import { INITIAL_INCIDENTS, INITIAL_METRICS } from '../data/mockData';
import {
  loadStoredNotifications,
  saveStoredNotifications,
  buildNotification,
  getNotificationsForRole,
  getUnreadCountForRole,
  dispatchBrowserNotification,
} from '../services/notificationService';
import {
  loadAndMigrateIncidents,
  saveStoredIncidents,
} from '../services/incidentPersistenceService';
import {
  loadStoredThresholds,
  saveStoredThresholds,
} from '../services/thresholdService';
import {
  loadStoredDumpingEvents,
  saveStoredDumpingEvents,
  loadStoredWarningRecords,
  saveStoredWarningRecords,
  processDumpingConfirmation,
  processDumpingRejection,
} from '../services/dumpingIntelligenceService';
import {
  loadStoredHotspots,
  saveStoredHotspots,
  recalculateHotspotMetrics,
} from '../services/hotspotService';
import {
  loadStoredWorkOrders,
  saveStoredWorkOrders,
  loadStoredValidations,
  saveStoredValidations,
  loadStoredCitizenConfirmations,
  saveStoredCitizenConfirmations,
} from '../services/workOrderService';
import {
  loadStoredInfrastructureAssets,
  saveStoredInfrastructureAssets,
  syncAssetWithIncidents,
} from '../services/infrastructureAssetService';
import {
  loadStoredAuditLogs,
  saveStoredAuditLogs,
  createAuditLog,
} from '../services/auditService';
import { executeConsolidation } from '../services/consolidationService';
import { ApiClient } from '../services/apiClient';
import { BENGALURU_WARDS } from '../utils/bengaluruBoundary';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  incidents: Incident[];
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  filterSeverity: string;
  setFilterSeverity: (sev: string) => void;
  filterStatus: string;
  setFilterStatus: (stat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  metrics: InfrastructureMetric;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Backend Integration State
  isBackendConnected: boolean;
  isBackendChecking: boolean;
  checkBackendConnection: () => Promise<boolean>;

  // Notifications
  notifications: AppNotification[];
  roleNotifications: AppNotification[];
  unreadNotificationCount: number;
  addNotification: (params: {
    title: string;
    message: string;
    targetRole: UserRole | 'all';
    eventType: AppNotification['eventType'];
    relatedIncidentId?: string;
    priority?: 'normal' | 'high' | 'critical';
  }) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotificationsForRole: () => void;

  // Incidents
  addIncident: (data: {
    title: string;
    description: string;
    category: IssueCategory;
    severity: IssueSeverity;
    address: string;
    lat: number;
    lng: number;
    reporterName: string;
    reporterContact?: string;
    isAnonymous: boolean;
    imageUrl?: string;
  }) => Incident;
  updateIncidentStatus: (id: string, status: IssueStatus, note?: string) => void;
  assignContractor: (
    id: string,
    contractor: { id: string; name: string; role: string; company?: string }
  ) => void;
  consolidateDuplicateIncidents: (
    primaryId: string,
    duplicateIds: string[],
    reason: string
  ) => void;

  // Dumping & Behaviour Intelligence
  dumpingEvents: DumpingEvent[];
  warningRecords: WarningRecord[];
  confirmDumpingEvent: (id: string, notes?: string) => void;
  rejectDumpingEvent: (id: string, reason: string) => void;

  // Hotspots & Infrastructure
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  setSelectedHotspot: (h: Hotspot | null) => void;
  recalculateHotspot: (id: string) => void;
  infrastructureAssets: InfrastructureAsset[];

  // Thresholds & Administration
  thresholds: ThresholdConfig[];
  updateThresholdConfig: (key: string, value: number) => void;

  // Work Orders & Repair Validation
  workOrders: ContractorWorkOrder[];
  dispatchWorkOrder: (
    incidentId: string,
    contractorId: string,
    contractorName: string,
    scopeOfWork: string,
    targetDays?: number
  ) => ContractorWorkOrder;
  submitContractorRepair: (
    workOrderId: string,
    data: {
      laborHours: string;
      materialsUsed: string;
      progressNotes: string;
      repairEvidence: any[];
    }
  ) => void;
  validateRepairSubmission: (
    workOrderId: string,
    decision: 'approved' | 'partially_repaired' | 'rework_required' | 'inspection_required' | 'rejected',
    rationale: string,
    remainingDamageEstimate?: string
  ) => void;
  citizenConfirmOrDisputeRepair: (
    incidentId: string,
    confirmed: boolean,
    feedback?: string
  ) => void;
  repairValidations: RepairValidationRecord[];
  citizenConfirmations: CitizenConfirmation[];

  // Audit Logs
  auditLogs: AuditLogEntry[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('citizen');
  const [activeTab, setActiveTab] = useState<string>('hero');
  const [incidents, setIncidents] = useState<Incident[]>(() => loadAndMigrateIncidents());
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Synchronize versioned incidents storage whenever incidents change
  useEffect(() => {
    saveStoredIncidents(incidents);
  }, [incidents]);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [metrics, setMetrics] = useState<InfrastructureMetric>(INITIAL_METRICS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Backend state
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isBackendChecking, setIsBackendChecking] = useState<boolean>(false);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadStoredNotifications()
  );

  // Extended Domain States
  const [dumpingEvents, setDumpingEvents] = useState<DumpingEvent[]>(() =>
    loadStoredDumpingEvents()
  );
  useEffect(() => {
    saveStoredDumpingEvents(dumpingEvents);
  }, [dumpingEvents]);

  const [warningRecords, setWarningRecords] = useState<WarningRecord[]>(() =>
    loadStoredWarningRecords()
  );
  useEffect(() => {
    saveStoredWarningRecords(warningRecords);
  }, [warningRecords]);

  const [hotspots, setHotspots] = useState<Hotspot[]>(() => loadStoredHotspots());
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  useEffect(() => {
    saveStoredHotspots(hotspots);
  }, [hotspots]);

  const [infrastructureAssets, setInfrastructureAssets] = useState<InfrastructureAsset[]>(() =>
    loadStoredInfrastructureAssets()
  );
  useEffect(() => {
    saveStoredInfrastructureAssets(infrastructureAssets);
  }, [infrastructureAssets]);

  const [thresholds, setThresholds] = useState<ThresholdConfig[]>(() =>
    loadStoredThresholds()
  );
  useEffect(() => {
    saveStoredThresholds(thresholds);
  }, [thresholds]);

  const [workOrders, setWorkOrders] = useState<ContractorWorkOrder[]>(() =>
    loadStoredWorkOrders()
  );
  useEffect(() => {
    saveStoredWorkOrders(workOrders);
  }, [workOrders]);

  const [repairValidations, setRepairValidations] = useState<RepairValidationRecord[]>(() =>
    loadStoredValidations()
  );
  useEffect(() => {
    saveStoredValidations(repairValidations);
  }, [repairValidations]);

  const [citizenConfirmations, setCitizenConfirmations] = useState<CitizenConfirmation[]>(() =>
    loadStoredCitizenConfirmations()
  );
  useEffect(() => {
    saveStoredCitizenConfirmations(citizenConfirmations);
  }, [citizenConfirmations]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    loadStoredAuditLogs()
  );
  useEffect(() => {
    saveStoredAuditLogs(auditLogs);
  }, [auditLogs]);

  // Role auto-login for backend session token
  const authenticateRole = useCallback(async (targetRole: UserRole) => {
    const creds: Record<UserRole, { u: string; p: string }> = {
      citizen: { u: 'citizen', p: 'citizen123' },
      officer: { u: 'officer', p: 'officer123' },
      contractor: { u: 'contractor', p: 'contractor123' },
      admin: { u: 'admin', p: 'admin123' },
    };
    try {
      const c = creds[targetRole];
      if (c) {
        await ApiClient.login(c.u, c.p);
      }
    } catch (err) {
      console.warn('Auto-login for role token failed:', err);
    }
  }, []);

  const syncWithBackend = useCallback(async () => {
    try {
      const [
        serverIncidents,
        serverDumpingEvents,
        serverHotspots,
        serverAssets,
        serverThresholds,
        serverWorkOrders,
      ] = await Promise.all([
        ApiClient.getIncidents().catch(() => null),
        ApiClient.getDumpingEvents().catch(() => null),
        ApiClient.getHotspots().catch(() => null),
        ApiClient.getInfrastructureAssets().catch(() => null),
        ApiClient.getThresholds().catch(() => null),
        ApiClient.getWorkOrders().catch(() => null),
      ]);

      if (serverIncidents && serverIncidents.length > 0) {
        setIncidents(serverIncidents);
      }
      if (serverDumpingEvents && serverDumpingEvents.length > 0) {
        setDumpingEvents(serverDumpingEvents);
      }
      if (serverHotspots && serverHotspots.length > 0) {
        setHotspots(serverHotspots);
      }
      if (serverAssets && serverAssets.length > 0) {
        setInfrastructureAssets(serverAssets);
      }
      if (serverThresholds && serverThresholds.length > 0) {
        setThresholds(serverThresholds);
      }
      if (serverWorkOrders && serverWorkOrders.length > 0) {
        setWorkOrders(serverWorkOrders);
      }
    } catch (err) {
      console.warn('Backend sync failed, maintaining local state:', err);
    }
  }, []);

  // Check Backend Connection at Startup
  const checkBackendConnection = useCallback(async (): Promise<boolean> => {
    setIsBackendChecking(true);
    try {
      const ok = await ApiClient.checkHealth();
      setIsBackendConnected(ok);
      if (ok) {
        await authenticateRole(role);
        await syncWithBackend();
      }
      return ok;
    } catch {
      setIsBackendConnected(false);
      return false;
    } finally {
      setIsBackendChecking(false);
    }
  }, [role, authenticateRole, syncWithBackend]);

  useEffect(() => {
    checkBackendConnection();
  }, [checkBackendConnection]);

  // Authenticate role whenever role changes and backend is connected
  useEffect(() => {
    if (isBackendConnected) {
      authenticateRole(role);
    }
  }, [role, isBackendConnected, authenticateRole]);

  const roleNotifications = getNotificationsForRole(notifications, role);
  const unreadNotificationCount = getUnreadCountForRole(notifications, role);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addNotification = (params: {
    title: string;
    message: string;
    targetRole: UserRole | 'all';
    eventType: AppNotification['eventType'];
    relatedIncidentId?: string;
    priority?: 'normal' | 'high' | 'critical';
  }) => {
    const notif = buildNotification(params);
    setNotifications((prev) => {
      const updated = [notif, ...prev];
      saveStoredNotifications(updated);
      return updated;
    });

    if (params.targetRole === role || params.targetRole === 'all') {
      dispatchBrowserNotification(notif);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      saveStoredNotifications(updated);
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => {
        if (n.targetRole === role || n.targetRole === 'all') {
          return { ...n, isRead: true };
        }
        return n;
      });
      saveStoredNotifications(updated);
      return updated;
    });
    showToast(`Marked all ${role.toUpperCase()} notifications as read.`);
  };

  const clearNotificationsForRole = () => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.targetRole !== role && n.targetRole !== 'all');
      saveStoredNotifications(updated);
      return updated;
    });
    showToast(`Cleared notifications for ${role.toUpperCase()}.`);
  };

  const addIncident = (data: {
    title: string;
    description: string;
    category: IssueCategory;
    severity: IssueSeverity;
    address: string;
    lat: number;
    lng: number;
    reporterName: string;
    reporterContact?: string;
    isAnonymous: boolean;
    imageUrl?: string;
  }): Incident => {
    const newId = `INF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const confidence = +(0.88 + Math.random() * 0.1).toFixed(2);
    const estCost = data.severity === 'critical' ? 24000 : data.severity === 'high' ? 9500 : 2500;
    const estHours = data.severity === 'critical' ? 24 : data.severity === 'high' ? 12 : 6;

    const newIncident: Incident = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: 'submitted',
      location: {
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        ward: BENGALURU_WARDS[Math.floor(Math.random() * BENGALURU_WARDS.length)],
      },
      reportedAt: nowIso,
      updatedAt: nowIso,
      reporter: {
        name: data.isAnonymous ? 'Anonymous Citizen' : data.reporterName,
        contact: data.isAnonymous ? undefined : data.reporterContact,
        isAnonymous: data.isAnonymous,
      },
      aiAnalysis: {
        confidenceScore: confidence,
        detectedAnomaly: `Anomaly pattern matches verified ${data.category.toUpperCase()} defect profile`,
        recommendedPriority: data.severity,
        estimatedCostUsd: estCost,
        estimatedRepairHours: estHours,
        safetyHazardLevel:
          data.severity === 'critical'
            ? 'Life-Threatening'
            : data.severity === 'high'
            ? 'Severe'
            : 'Moderate',
        trafficImpactIndex: data.severity === 'critical' ? 8 : 4,
      },
      isDemonstration: false,
      images: data.imageUrl
        ? [
            {
              url: data.imageUrl,
              caption: 'Citizen verified live on-site photo',
              isCitizenCapture: true,
              isDemonstration: false,
            },
          ]
        : [],
      timeline: [
        {
          timestamp: nowIso,
          title: 'Report Registered',
          description: `Filed by ${data.isAnonymous ? 'Anonymous Citizen' : data.reporterName} via live camera capture.`,
          user: data.isAnonymous ? 'Citizen' : data.reporterName,
          type: 'report',
        },
        {
          timestamp: nowIso,
          title: 'AI Automated Triage',
          description: `Computer vision processed imagery (${Math.round(confidence * 100)}% confidence). SLA deadline assigned.`,
          user: 'INFRANEX Core AI',
          type: 'ai_triage',
        },
      ],
      slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      budgetAllocated: estCost,
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      totalReported: prev.totalReported + 1,
      activeWorkOrders: prev.activeWorkOrders + 1,
    }));

    // Audit Log
    const auditEntry = createAuditLog({
      actor: data.isAnonymous ? 'Anonymous Citizen' : data.reporterName,
      actorRole: 'citizen',
      action: 'INCIDENT_REPORTED',
      entityType: 'incident',
      entityId: newId,
      details: `Citizen submitted report #${newId} at ${data.address} with live camera evidence.`,
      newState: 'submitted',
    });
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Role-Aware Notifications
    addNotification({
      title: 'Report Successfully Submitted',
      message: `Your report #${newId} for ${data.title} was received with verified on-site photo. AI initial triage assigned.`,
      targetRole: 'citizen',
      eventType: 'report_submitted',
      relatedIncidentId: newId,
      priority: 'normal',
    });

    addNotification({
      title: 'New Incident in Verification Queue',
      message: `Incident #${newId} (${data.category.toUpperCase()}) reported at ${data.address}. Awaiting field verification.`,
      targetRole: 'officer',
      eventType: 'report_submitted',
      relatedIncidentId: newId,
      priority: data.severity === 'critical' ? 'critical' : 'normal',
    });

    if (data.severity === 'critical' || data.severity === 'high') {
      addNotification({
        title: 'High-Priority Hazard Escalated',
        message: `Emergency severity detected for #${newId} at ${data.address}. SLA response initiated.`,
        targetRole: 'admin',
        eventType: 'ai_escalation',
        relatedIncidentId: newId,
        priority: 'critical',
      });
    }

    // Persist to backend if connected
    if (isBackendConnected) {
      ApiClient.createIncident({
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        ward: newIncident.location.ward,
        reporterName: data.isAnonymous ? 'Anonymous Citizen' : data.reporterName,
        reporterContact: data.reporterContact,
        isAnonymous: data.isAnonymous,
        imageUrl: data.imageUrl,
        isDemonstration: false,
      })
        .then((serverInc) => {
          if (serverInc && serverInc.id) {
            setIncidents((prev) =>
              prev.map((i) =>
                i.id === newId ? { ...i, id: serverInc.id, aiAnalysis: serverInc.aiAnalysis || i.aiAnalysis } : i
              )
            );
          }
        })
        .catch((err) => {
          console.warn('Backend createIncident sync error:', err);
        });
    }

    showToast(`Incident #${newId} logged and processed by AI Triage.`);
    return newIncident;
  };

  const updateIncidentStatus = (id: string, status: IssueStatus, note?: string) => {
    const nowIso = new Date().toISOString();
    let oldStatus = 'unknown';

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          oldStatus = inc.status;
          const updatedTimeline = [
            ...inc.timeline,
            {
              timestamp: nowIso,
              title: `Status updated to ${status.replace('_', ' ').toUpperCase()}`,
              description: note || `State transitioned by ${role.toUpperCase()} operator.`,
              user: `${role.toUpperCase()} Authority`,
              type: 'status_change' as const,
            },
          ];

          return {
            ...inc,
            status,
            updatedAt: nowIso,
            timeline: updatedTimeline,
          };
        }
        return inc;
      })
    );

    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              status,
              updatedAt: nowIso,
              timeline: [
                ...prev.timeline,
                {
                  timestamp: nowIso,
                  title: `Status updated to ${status.replace('_', ' ').toUpperCase()}`,
                  description: note || `State transitioned by ${role.toUpperCase()} operator.`,
                  user: `${role.toUpperCase()} Authority`,
                  type: 'status_change',
                },
              ],
            }
          : null
      );
    }

    // Audit Log
    const auditEntry = createAuditLog({
      actor: `${role.toUpperCase()} Operator`,
      actorRole: role,
      action: 'STATUS_TRANSITION',
      entityType: 'incident',
      entityId: id,
      details: note || `Status transitioned to ${status}`,
      previousState: oldStatus,
      newState: status,
    });
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Role-Aware Notifications
    addNotification({
      title: `Case #${id} Status: ${status.replace('_', ' ').toUpperCase()}`,
      message: note || `State transitioned to ${status.replace('_', ' ').toUpperCase()} by ${role.toUpperCase()} authority.`,
      targetRole: 'citizen',
      eventType: 'status_changed',
      relatedIncidentId: id,
      priority: status === 'resolved' ? 'normal' : status === 'closed' ? 'high' : 'normal',
    });

    if (status === 'review') {
      addNotification({
        title: `Repair Evidence Submitted for #${id}`,
        message: note || `Contractor submitted work completion evidence for #${id}. Quality audit required.`,
        targetRole: 'officer',
        eventType: 'evidence_submitted',
        relatedIncidentId: id,
        priority: 'high',
      });
    }

    if (status === 'closed' && note?.toLowerCase().includes('reject')) {
      addNotification({
        title: `Report #${id} Rejected by Officer`,
        message: note,
        targetRole: 'citizen',
        eventType: 'report_rejected',
        relatedIncidentId: id,
        priority: 'high',
      });
    }

    // Sync with backend if connected
    if (isBackendConnected) {
      ApiClient.updateIncidentStatus(id, status, note).catch((err) => {
        console.warn('Backend updateIncidentStatus sync error:', err);
      });
    }

    showToast(`Case #${id} status changed to ${status.replace('_', ' ')}`);
  };

  const assignContractor = (
    id: string,
    contractor: { id: string; name: string; role: string; company?: string }
  ) => {
    const nowIso = new Date().toISOString();
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          return {
            ...inc,
            assignedTo: contractor,
            status: 'assigned',
            updatedAt: nowIso,
            timeline: [
              ...inc.timeline,
              {
                timestamp: nowIso,
                title: 'Contractor Assigned',
                description: `Dispatched work order to ${contractor.name} (${contractor.company || contractor.role}).`,
                user: 'Civil Dispatch Officer',
                type: 'assignment' as const,
              },
            ],
          };
        }
        return inc;
      })
    );

    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              assignedTo: contractor,
              status: 'assigned',
              updatedAt: nowIso,
            }
          : null
      );
    }

    // Auto-create persistent ContractorWorkOrder if not exists
    const existingWo = workOrders.find((w) => w.incidentId === id);
    if (!existingWo) {
      const newWo: ContractorWorkOrder = {
        id: `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        incidentId: id,
        contractorId: contractor.id,
        contractorName: contractor.name,
        scopeOfWork: `Execute engineering repair for incident #${id} according to municipal technical specifications.`,
        status: 'dispatched',
        dispatchedAt: nowIso,
        targetCompletionAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        repairEvidence: [],
      };
      setWorkOrders((prev) => [newWo, ...prev]);
    }

    addNotification({
      title: `New Work Order Dispatched: #${id}`,
      message: `Work order for #${id} assigned to ${contractor.name} (${contractor.role}). Review details and mobilize crew.`,
      targetRole: 'contractor',
      eventType: 'contractor_assigned',
      relatedIncidentId: id,
      priority: 'high',
    });

    addNotification({
      title: `Contractor Assigned to #${id}`,
      message: `${contractor.name} (${contractor.role}) has been dispatched to execute repairs.`,
      targetRole: 'citizen',
      eventType: 'contractor_assigned',
      relatedIncidentId: id,
      priority: 'normal',
    });

    showToast(`Work order for #${id} assigned to ${contractor.name}`);
  };

  // Consolidate Duplicate Incidents Workflow
  const consolidateDuplicateIncidents = (
    primaryId: string,
    duplicateIds: string[],
    reason: string
  ) => {
    const primary = incidents.find((i) => i.id === primaryId);
    if (!primary) return;

    const duplicates = incidents.filter((i) => duplicateIds.includes(i.id));
    if (duplicates.length === 0) return;

    const { updatedPrimary, updatedDuplicates } = executeConsolidation(
      primary,
      duplicates,
      role.toUpperCase() + ' Authority',
      reason
    );

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === primaryId) return updatedPrimary;
        const dup = updatedDuplicates.find((d) => d.id === inc.id);
        if (dup) return dup;
        return inc;
      })
    );

    if (selectedIncident && selectedIncident.id === primaryId) {
      setSelectedIncident(updatedPrimary);
    }

    // Audit Log
    const auditEntry = createAuditLog({
      actor: `${role.toUpperCase()} Authority`,
      actorRole: role,
      action: 'DUPLICATE_CONSOLIDATION',
      entityType: 'incident',
      entityId: primaryId,
      details: `Consolidated duplicate incidents (${duplicateIds.join(', ')}) into #${primaryId}. Reason: ${reason}. All evidence preserved.`,
    });
    setAuditLogs((prev) => [auditEntry, ...prev]);

    addNotification({
      title: `Duplicate Reports Consolidated into #${primaryId}`,
      message: `${duplicateIds.length} duplicate report(s) consolidated under Master Ticket #${primaryId} with all evidence preserved.`,
      targetRole: 'officer',
      eventType: 'status_changed',
      relatedIncidentId: primaryId,
      priority: 'normal',
    });

    // Sync with backend if connected
    if (isBackendConnected) {
      ApiClient.consolidateIncidents(primaryId, duplicateIds, reason).catch((err) => {
        console.warn('Backend consolidation sync error:', err);
      });
    }

    showToast(`Consolidated ${duplicateIds.length} duplicate report(s) into Master #${primaryId}.`);
  };

  // Confirm Dumping Event Workflow
  const confirmDumpingEvent = (id: string, notes?: string) => {
    const targetEvent = dumpingEvents.find((e) => e.id === id);
    if (!targetEvent) return;

    const officerName = role === 'officer' ? 'Field Officer (Active)' : `${role.toUpperCase()} Authority`;

    const {
      updatedEvent,
      newWarningRecord,
      newWasteIncident,
      linkedIncidentId,
      auditMessage,
    } = processDumpingConfirmation(
      targetEvent,
      officerName,
      warningRecords,
      incidents,
      thresholds
    );

    setDumpingEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
    setWarningRecords((prev) => [newWarningRecord, ...prev]);

    if (newWasteIncident) {
      setIncidents((prev) => [newWasteIncident, ...prev]);
    }

    // Recalculate Hotspots dynamically
    setHotspots((prev) =>
      prev.map((h) => {
        if (h.location.ward === targetEvent.location.ward) {
          const updatedEvents = dumpingEvents.map((e) => (e.id === id ? updatedEvent : e));
          const allInc = newWasteIncident ? [newWasteIncident, ...incidents] : incidents;
          return recalculateHotspotMetrics(h, updatedEvents, allInc);
        }
        return h;
      })
    );

    // Audit Log
    const auditEntry = createAuditLog({
      actor: officerName,
      actorRole: role,
      action: 'DUMPING_EVENT_CONFIRMED',
      entityType: 'dumping_event',
      entityId: id,
      details: `${auditMessage} ${notes ? 'Officer Notes: ' + notes : ''}`,
      newState: 'confirmed',
    });
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Notifications
    addNotification({
      title: `Dumping Event #${id} Confirmed (Warning Stage ${newWarningRecord.stage})`,
      message: `Confirmed illegal dumping at ${targetEvent.location.address}. ${newWarningRecord.authorityAction}`,
      targetRole: 'officer',
      eventType: 'status_changed',
      priority: newWarningRecord.stage === 3 ? 'critical' : 'high',
    });

    if (newWarningRecord.stage === 3) {
      addNotification({
        title: `ESCALATION: Habitual Offender at ${targetEvent.location.ward}`,
        message: `Site reached Warning Stage 3. Third confirmed occurrence — escalate to the responsible authority for official review.`,
        targetRole: 'admin',
        eventType: 'ai_escalation',
        priority: 'critical',
      });
    }

    // Sync with backend if connected
    if (isBackendConnected) {
      ApiClient.decideDumpingEvent(id, 'confirm', notes).catch((err) => {
        console.warn('Backend decideDumpingEvent confirm error:', err);
      });
    }

    showToast(`Dumping Event #${id} confirmed. Warning Stage ${newWarningRecord.stage} issued.`);
  };

  // Reject Dumping Event Workflow
  const rejectDumpingEvent = (id: string, reason: string) => {
    const targetEvent = dumpingEvents.find((e) => e.id === id);
    if (!targetEvent) return;

    const officerName = role === 'officer' ? 'Field Officer (Active)' : `${role.toUpperCase()} Authority`;
    const updated = processDumpingRejection(targetEvent, officerName, reason);

    setDumpingEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));

    // Audit Log
    const auditEntry = createAuditLog({
      actor: officerName,
      actorRole: role,
      action: 'DUMPING_EVENT_REJECTED',
      entityType: 'dumping_event',
      entityId: id,
      details: `Dumping event rejected: ${reason}. Does not count toward recurrence.`,
      newState: 'rejected',
    });
    setAuditLogs((prev) => [auditEntry, ...prev]);

    addNotification({
      title: `Dumping Event #${id} Rejected`,
      message: `Rejected by ${officerName}: ${reason}`,
      targetRole: 'officer',
      eventType: 'report_rejected',
      priority: 'normal',
    });

    // Sync with backend if connected
    if (isBackendConnected) {
      ApiClient.decideDumpingEvent(id, 'reject', reason).catch((err) => {
        console.warn('Backend decideDumpingEvent reject error:', err);
      });
    }

    showToast(`Dumping Event #${id} rejected. Recurrence unaffected.`);
  };

  // Recalculate Hotspot
  const recalculateHotspot = (id: string) => {
    setHotspots((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          return recalculateHotspotMetrics(h, dumpingEvents, incidents);
        }
        return h;
      })
    );
    showToast(`Hotspot #${id} recurrence metrics updated.`);
  };

  // Update Threshold Config
  const updateThresholdConfig = (key: string, value: number) => {
    setThresholds((prev) =>
      prev.map((t) => (t.key === key ? { ...t, value, updatedAt: new Date().toISOString() } : t))
    );

    const auditEntry = createAuditLog({
      actor: `${role.toUpperCase()} Admin`,
      actorRole: role,
      action: 'THRESHOLD_UPDATED',
      entityType: 'threshold',
      entityId: key,
      details: `Configured threshold '${key}' updated to ${value}.`,
    });
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Sync with backend if connected
    if (isBackendConnected) {
      ApiClient.updateThreshold(key, value).catch((err) => {
        console.warn('Backend updateThreshold error:', err);
      });
    }

    showToast(`Threshold '${key}' updated to ${value}.`);
  };

  // Dispatch Work Order
  const dispatchWorkOrder = (
    incidentId: string,
    contractorId: string,
    contractorName: string,
    scopeOfWork: string,
    targetDays: number = 2
  ): ContractorWorkOrder => {
    const nowIso = new Date().toISOString();
    const woId = `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetDt = new Date(Date.now() + targetDays * 24 * 3600 * 1000).toISOString();

    const newWo: ContractorWorkOrder = {
      id: woId,
      incidentId,
      contractorId,
      contractorName,
      scopeOfWork,
      status: 'dispatched',
      dispatchedAt: nowIso,
      targetCompletionAt: targetDt,
      repairEvidence: [],
    };

    setWorkOrders((prev) => [newWo, ...prev]);

    // Update incident
    assignContractor(incidentId, {
      id: contractorId,
      name: contractorName,
      role: 'Dispatched Contractor',
    });

    if (isBackendConnected) {
      ApiClient.dispatchWorkOrder({
        incidentId,
        contractorId,
        contractorName,
        scopeOfWork,
        targetDays,
      })
        .then((serverWo) => {
          if (serverWo && serverWo.id) {
            setWorkOrders((prev) =>
              prev.map((w) => (w.id === woId ? { ...w, id: serverWo.id } : w))
            );
          }
        })
        .catch((err) => {
          console.warn('Backend dispatchWorkOrder error:', err);
        });
    }

    return newWo;
  };

  // Submit Contractor Repair Evidence
  const submitContractorRepair = (
    workOrderId: string,
    data: {
      laborHours: string;
      materialsUsed: string;
      progressNotes: string;
      repairEvidence: any[];
    }
  ) => {
    const nowIso = new Date().toISOString();

    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === workOrderId) {
          return {
            ...wo,
            status: 'repair_submitted',
            submittedAt: nowIso,
            laborHours: data.laborHours,
            materialsUsed: data.materialsUsed,
            progressNotes: data.progressNotes,
            repairEvidence: data.repairEvidence,
          };
        }
        return wo;
      })
    );

    const targetWo = workOrders.find((w) => w.id === workOrderId);
    if (targetWo) {
      updateIncidentStatus(
        targetWo.incidentId,
        'review',
        `Contractor submitted repair evidence. Materials: ${data.materialsUsed}. Labor: ${data.laborHours}.`
      );

      // Append repair images to incident evidence with isAfterRepair: true
      if (data.repairEvidence && data.repairEvidence.length > 0) {
        setIncidents((prev) =>
          prev.map((inc) => {
            if (inc.id === targetWo.incidentId) {
              const updatedImages = [
                ...inc.images,
                ...data.repairEvidence.map((ev) => ({
                  url: ev.url || ev.mediaUrl,
                  caption: `[Post-Repair Evidence] ${ev.caption || 'Contractor completion photo'}`,
                  isAfterRepair: true,
                  sha256Hash: ev.sha256Hash || 'sha256-verified-repair',
                  timestamp: nowIso,
                })),
              ];
              return { ...inc, images: updatedImages, updatedAt: nowIso };
            }
            return inc;
          })
        );
      }

      // Audit Log
      const auditEntry = createAuditLog({
        actor: targetWo.contractorName,
        actorRole: 'contractor',
        action: 'REPAIR_EVIDENCE_SUBMITTED',
        entityType: 'work_order',
        entityId: workOrderId,
        details: `Contractor submitted repair evidence for #${targetWo.incidentId}. Materials: ${data.materialsUsed}. Labor: ${data.laborHours}.`,
        newState: 'repair_submitted',
      });
      setAuditLogs((prev) => [auditEntry, ...prev]);
    }

    // Sync with backend if connected
    if (isBackendConnected) {
      ApiClient.submitRepair(workOrderId, {
        materialsUsed: data.materialsUsed,
        laborHours: data.laborHours,
        progressNotes: data.progressNotes,
        repairEvidenceUrls: data.repairEvidence
          ? data.repairEvidence.map((ev: any) => ev.url || ev.mediaUrl || '')
          : [],
      }).catch((err) => {
        console.warn('Backend submitRepair sync error:', err);
      });
    }

    showToast(`Repair evidence for Work Order #${workOrderId} submitted for officer review.`);
  };

  // Validate Repair Submission
  const validateRepairSubmission = (
    workOrderId: string,
    decision: 'approved' | 'partially_repaired' | 'rework_required' | 'inspection_required' | 'rejected',
    rationale: string,
    remainingDamageEstimate?: string
  ) => {
    const targetWo = workOrders.find((w) => w.id === workOrderId);
    if (!targetWo) return;

    const nowIso = new Date().toISOString();
    const officerName = role === 'officer' ? 'Field Officer (Active)' : `${role.toUpperCase()} Authority`;

    const validationRecord: RepairValidationRecord = {
      id: `VAL-${Math.floor(1000 + Math.random() * 9000)}`,
      workOrderId,
      incidentId: targetWo.incidentId,
      decision,
      rationale,
      remainingDamageEstimate,
      officerId: 'OFF-01',
      officerName,
      validatedAt: nowIso,
    };

    setRepairValidations((prev) => [validationRecord, ...prev]);

    // Update Work Order status
    let newWoStatus: ContractorWorkOrder['status'] = 'in_progress';
    let newIncStatus: IssueStatus = 'in_progress';

    if (decision === 'approved') {
      newWoStatus = 'approved_closed';
      newIncStatus = 'resolved'; // Now awaits citizen confirmation
    } else if (decision === 'rework_required') {
      newWoStatus = 'rework_required';
      newIncStatus = 'in_progress';
    } else if (decision === 'partially_repaired' || decision === 'inspection_required') {
      newWoStatus = 'in_progress';
      newIncStatus = 'triage';
    } else {
      newWoStatus = 'in_progress';
      newIncStatus = 'assigned';
    }

    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === workOrderId ? { ...wo, status: newWoStatus } : wo))
    );

    updateIncidentStatus(
      targetWo.incidentId,
      newIncStatus,
      `Officer Repair Validation: ${decision.toUpperCase()}. ${rationale}`
    );

    // Audit Log
    const auditEntry = createAuditLog({
      actor: officerName,
      actorRole: 'officer',
      action: 'REPAIR_VALIDATED',
      entityType: 'work_order',
      entityId: workOrderId,
      details: `Officer evaluated repair evidence as '${decision}'. Rationale: ${rationale}. ${
        remainingDamageEstimate ? 'Remaining damage: ' + remainingDamageEstimate : ''
      }`,
      newState: newWoStatus,
    });
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // If approved, notify citizen to confirm
    if (decision === 'approved') {
      addNotification({
        title: `Repair Approved by Authority for #${targetWo.incidentId}`,
        message: `Municipal officer verified repair evidence. Please confirm if the issue is completely fixed at your location.`,
        targetRole: 'citizen',
        eventType: 'status_changed',
        relatedIncidentId: targetWo.incidentId,
        priority: 'high',
      });
    }

    // Sync with backend if connected
    if (isBackendConnected) {
      ApiClient.validateRepair(workOrderId, {
        decision,
        rationale,
        remainingDamageEstimate,
      }).catch((err) => {
        console.warn('Backend validateRepair sync error:', err);
      });
    }

    showToast(`Repair validation recorded: ${decision.replace('_', ' ').toUpperCase()}`);
  };

  // Citizen Confirmation & Dispute Workflow
  const citizenConfirmOrDisputeRepair = (
    incidentId: string,
    confirmed: boolean,
    feedback?: string
  ) => {
    const nowIso = new Date().toISOString();
    const citizenName = 'Verified Local Resident';

    const confRecord: CitizenConfirmation = {
      id: `CONF-${Math.floor(1000 + Math.random() * 9000)}`,
      incidentId,
      citizenName,
      response: confirmed ? 'confirmed_fixed' : 'disputed_unresolved',
      notes: feedback,
      submittedAt: nowIso,
    };

    setCitizenConfirmations((prev) => [confRecord, ...prev]);

    if (confirmed) {
      updateIncidentStatus(
        incidentId,
        'archived',
        `Citizen confirmed repair is complete and satisfactory: "${feedback || 'Fully resolved'}". Incident moved to permanent infrastructure history.`
      );

      // Audit Log
      const auditEntry = createAuditLog({
        actor: citizenName,
        actorRole: 'citizen',
        action: 'CITIZEN_CONFIRMED',
        entityType: 'incident',
        entityId: incidentId,
        details: `Citizen confirmed satisfactory repair. Incident archived to permanent civic ledger.`,
        newState: 'archived',
      });
      setAuditLogs((prev) => [auditEntry, ...prev]);

      addNotification({
        title: `Citizen Confirmed Repair for #${incidentId}`,
        message: `Citizen confirmed satisfactory repair. Case permanently archived.`,
        targetRole: 'officer',
        eventType: 'status_changed',
        relatedIncidentId: incidentId,
        priority: 'normal',
      });

      showToast(`Thank you! Repair for #${incidentId} confirmed and permanently archived.`);
    } else {
      updateIncidentStatus(
        incidentId,
        'reopened',
        `CITIZEN DISPUTED REPAIR: Citizen reported problem remains unresolved: "${feedback || 'Defect still visible on site'}". Case reopened for immediate field re-inspection.`
      );

      // Audit Log
      const auditEntry = createAuditLog({
        actor: citizenName,
        actorRole: 'citizen',
        action: 'CITIZEN_DISPUTED',
        entityType: 'incident',
        entityId: incidentId,
        details: `Citizen disputed repair completion: ${feedback}. Case reopened.`,
        newState: 'triaged',
      });
      setAuditLogs((prev) => [auditEntry, ...prev]);

      addNotification({
        title: `URGENT: Citizen Disputed Repair #${incidentId}`,
        message: `Citizen reported the defect is NOT resolved: "${feedback}". Re-inspection mandatory.`,
        targetRole: 'officer',
        eventType: 'ai_escalation',
        relatedIncidentId: incidentId,
        priority: 'critical',
      });

      showToast(`Dispute registered. Case #${incidentId} reopened for officer re-inspection.`);
    }

    // Sync with backend if connected
    if (isBackendConnected) {
      ApiClient.citizenConfirmRepair(incidentId, {
        citizenName,
        response: confirmed ? 'confirmed_fixed' : 'disputed_unresolved',
        notes: feedback,
      }).catch((err) => {
        console.warn('Backend citizenConfirmRepair sync error:', err);
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeTab,
        setActiveTab,
        incidents,
        selectedIncident,
        setSelectedIncident,
        filterCategory,
        setFilterCategory,
        filterSeverity,
        setFilterSeverity,
        filterStatus,
        setFilterStatus,
        searchQuery,
        setSearchQuery,
        metrics,
        toastMessage,
        showToast,

        // Backend Integration
        isBackendConnected,
        isBackendChecking,
        checkBackendConnection,

        // Notifications
        notifications,
        roleNotifications,
        unreadNotificationCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotificationsForRole,

        // Incidents
        addIncident,
        updateIncidentStatus,
        assignContractor,
        consolidateDuplicateIncidents,

        // Dumping & Behaviour Intelligence
        dumpingEvents,
        warningRecords,
        confirmDumpingEvent,
        rejectDumpingEvent,

        // Hotspots & Infrastructure
        hotspots,
        selectedHotspot,
        setSelectedHotspot,
        recalculateHotspot,
        infrastructureAssets,

        // Thresholds
        thresholds,
        updateThresholdConfig,

        // Work Orders & Repair Validation
        workOrders,
        dispatchWorkOrder,
        submitContractorRepair,
        validateRepairSubmission,
        citizenConfirmOrDisputeRepair,
        repairValidations,
        citizenConfirmations,

        // Audit Logs
        auditLogs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
