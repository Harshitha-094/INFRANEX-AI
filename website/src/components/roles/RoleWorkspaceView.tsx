import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Incident, IssueStatus, ContractorWorkOrder, DumpingEvent } from '../../types';
import { IncidentEvidenceViewer } from '../evidence/IncidentEvidenceViewer';
import { ConsolidationModal } from '../cases/ConsolidationModal';
import { RepairValidationModal } from '../evidence/RepairValidationModal';
import { ContractorRepairEvidenceModal } from '../evidence/ContractorRepairEvidenceModal';
import { IncidentLifecycleTracker } from '../cases/IncidentLifecycleTracker';
import { BeforeAfterEvidenceViewer } from '../evidence/BeforeAfterEvidenceViewer';
import { InspectionBriefModal } from '../cases/InspectionBriefModal';
import { InfrastructureHistoryModal } from '../infrastructure/InfrastructureHistoryModal';
import {
  User,
  UserCheck,
  HardHat,
  Shield,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Send,
  PlusCircle,
  Settings,
  Database,
  Sliders,
  DollarSign,
  ChevronRight,
  TrendingUp,
  XCircle,
  Building,
  FileX,
  Camera,
  Layers,
  RotateCcw,
  CheckCircle2,
  Flame,
  FileText,
  Upload,
  RefreshCw,
  Eye,
  ShieldCheck,
  Activity,
  HelpCircle
} from 'lucide-react';
import { FadeContent } from '../animations/FadeContent';
import { ScrollCharacterReveal } from '../animations/ScrollCharacterReveal';

export const RoleWorkspaceView: React.FC = () => {
  const {
    role,
    setRole,
    incidents,
    setSelectedIncident,
    setActiveTab,
    updateIncidentStatus,
    assignContractor,
    dumpingEvents,
    warningRecords,
    confirmDumpingEvent,
    rejectDumpingEvent,
    workOrders,
    submitContractorRepair,
    citizenConfirmOrDisputeRepair,
    thresholds,
    updateThresholdConfig,
    auditLogs,
    isBackendConnected,
    checkBackendConnection,
    infrastructureAssets,
  } = useApp();

  // Citizen tracking state
  const [trackingId, setTrackingId] = useState('');
  const [trackedIncident, setTrackedIncident] = useState<Incident | null>(null);
  const [citizenFeedbackText, setCitizenFeedbackText] = useState('');
  const [disputeIncidentId, setDisputeIncidentId] = useState<string | null>(null);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');

  // Active Modals
  const [consolidatingIncident, setConsolidatingIncident] = useState<Incident | null>(null);
  const [validatingWorkOrder, setValidatingWorkOrder] = useState<{ wo: ContractorWorkOrder; inc: Incident } | null>(null);
  const [submittingRepairWorkOrder, setSubmittingRepairWorkOrder] = useState<{ wo: ContractorWorkOrder; inc: Incident } | null>(null);
  const [briefIncident, setBriefIncident] = useState<Incident | null>(null);
  const [historyAsset, setHistoryAsset] = useState<any | null>(null);

  // Contractor log state per work order
  const [contractorInputs, setContractorInputs] = useState<
    Record<string, { materials: string; labor: string; notes: string; photoUrl: string }>
  >({});

  // Threshold edits
  const [thresholdEdits, setThresholdEdits] = useState<Record<string, number>>({});

  // Officer Reject State
  const [rejectingIncidentId, setRejectingIncidentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Duplicate Report');
  const [customRejectionNote, setCustomRejectionNote] = useState('');

  // Officer Authority Assign State
  const [assigningIncidentId, setAssigningIncidentId] = useState<string | null>(null);
  const [selectedAuthority, setSelectedAuthority] = useState('Dept of Public Works (Roads)');

  const authorities = [
    {
      name: 'Dept of Public Works (Roads & Bridges)',
      contractor: {
        id: 'CTR-04',
        name: 'Apex Paving & Heavy Civils Ltd.',
        role: 'Prime Road Contractor',
        company: 'Apex Civil',
      },
    },
    {
      name: 'Municipal Hydrology & Water Bureau',
      contractor: {
        id: 'CTR-09',
        name: 'AquaTech Municipal Hydrology Group',
        role: 'Emergency Water Response',
        company: 'AquaTech Utilities',
      },
    },
    {
      name: 'CleanCity Solid Waste Logistics',
      contractor: {
        id: 'CTR-03',
        name: 'CleanCity Solid Waste Logistics',
        role: 'Solid Waste & Debris Contractor',
        company: 'CleanCity BBMP Marshal',
      },
    },
    {
      name: 'Metropolitan Energy & Grid Commission',
      contractor: {
        id: 'CTR-07',
        name: 'Lumen Municipal Electrical Services',
        role: 'Power & Grid Contractor',
        company: 'Lumen Energy',
      },
    },
    {
      name: 'Structural Safety & Viaduct Authority',
      contractor: {
        id: 'CTR-02',
        name: 'Vanguard Structural Retrofits',
        role: 'Heavy Structural Engineering',
        company: 'Vanguard Engineering',
      },
    },
  ];

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = incidents.find(
      (i) => i.id.toLowerCase() === trackingId.trim().toLowerCase()
    );
    setTrackedIncident(found || null);
  };

  const handleConfirmRejection = (id: string) => {
    const fullReason = `${rejectionReason}${customRejectionNote ? `: ${customRejectionNote}` : ''}`;
    updateIncidentStatus(id, 'closed', `Rejected by Officer Vance. Reason: ${fullReason}`);
    setRejectingIncidentId(null);
    setCustomRejectionNote('');
  };

  const handleConfirmAuthorityAssign = (id: string) => {
    const auth = authorities.find((a) => a.name === selectedAuthority) || authorities[0];
    assignContractor(id, auth.contractor);
    updateIncidentStatus(id, 'assigned', `Assigned to authority: ${auth.name} (${auth.contractor.name})`);
    setAssigningIncidentId(null);
  };

  const handleContractorSubmit = (wo: ContractorWorkOrder) => {
    const input = contractorInputs[wo.id] || {
      materials: wo.materialsUsed || 'Standard bitumen aggregate & asphalt mix',
      labor: wo.laborHours || '12 crew-hours (3 technicians)',
      notes: wo.progressNotes || 'Completed physical asphalt laying and roller compaction.',
      photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&q=80&w=800',
    };

    submitContractorRepair(wo.id, {
      laborHours: input.labor,
      materialsUsed: input.materials,
      progressNotes: input.notes,
      repairEvidence: [
        {
          url: input.photoUrl,
          caption: `Post-repair verified image submitted by ${wo.contractorName}`,
          isAfterRepair: true,
          sha256Hash: 'sha256-verified-repair-hash-' + wo.id,
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Role Header Banner */}
      <FadeContent effect="mist" duration={0.8}>
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                  role === 'citizen'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : role === 'officer'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : role === 'contractor'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-purple-950 text-purple-300 border border-purple-800'
                }`}
              >
                Active Workspace: {role.toUpperCase()}
              </span>
            </div>
            <ScrollCharacterReveal
              key={`${role}-heading`}
              text={
                role === 'citizen'
                  ? 'Citizen Civic Services & Confirmation Hub'
                  : role === 'officer'
                  ? 'Field Officer Inspection & Quality Signoff'
                  : role === 'contractor'
                  ? 'Contractor Dispatch & Work Order Execution'
                  : 'Municipal Admin Governance & Threshold Engine'
              }
              highlightText={
                role === 'citizen'
                  ? 'Civic'
                  : role === 'officer'
                  ? 'Quality'
                  : role === 'contractor'
                  ? 'Dispatch'
                  : 'Threshold'
              }
              className="text-2xl font-extrabold text-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              Connected end-to-end civic accountability: One physical problem &rarr; multiple evidence sources &rarr; human-validated repair &rarr; citizen confirmation.
            </p>
          </div>

        {/* Quick Role Switcher pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          {(['citizen', 'officer', 'contractor', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                role === r
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      </FadeContent>

      {/* 1. CITIZEN INTERFACE */}
      {role === 'citizen' && (
        <FadeContent effect="mist" duration={0.8} key="citizen-view">
          <div className="space-y-6">
            {/* Post-Repair Citizen Confirmation & Dispute Section */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-950/40 border border-cyan-800/60 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-mono">
                      Citizen Confirmation & Dispute Queue
                    </h2>
                    <p className="text-xs text-slate-400">
                      Municipal authorities verified these repairs. As a local resident, please confirm whether the issue is fully fixed on-site.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {incidents.filter((i) => i.status === 'resolved').length} awaiting citizen sign-off
                </span>
              </div>

              {incidents.filter((i) => i.status === 'resolved').length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center space-y-1">
                  <CheckCircle className="w-6 h-6 mx-auto text-emerald-400 opacity-70 mb-1" />
                  <p className="text-xs font-medium text-slate-300">No pending repairs awaiting confirmation.</p>
                  <p className="text-[11px] text-slate-500">
                    When contractors complete repairs and officers verify them, you will sign off here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents
                    .filter((i) => i.status === 'resolved')
                    .map((inc) => {
                      const wo = workOrders.find((w) => w.incidentId === inc.id);
                      const isDisputingThis = disputeIncidentId === inc.id;

                      return (
                        <div
                          key={inc.id}
                          className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-900/60 space-y-4 shadow-lg"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-cyan-400">#{inc.id}</span>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  Repair Verified by Authority
                                </span>
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  {inc.category}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-white">{inc.title}</h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                {inc.location.address} ({inc.location.ward})
                              </p>
                            </div>
                          </div>

                          {/* Before & After Comparative Evidence */}
                          <BeforeAfterEvidenceViewer
                            incident={inc}
                            workOrder={wo}
                            validationRecord={inc.repairValidation}
                            showInspectionControls={false}
                          />

                          {/* Citizen Confirmation Actions */}
                          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                              <HelpCircle className="w-4 h-4 text-cyan-400" />
                              Has this problem been resolved?
                            </div>

                            {!isDisputingThis ? (
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    citizenConfirmOrDisputeRepair(
                                      inc.id,
                                      true,
                                      'Verified on-site: repair is completely resolved and satisfactory.'
                                    )
                                  }
                                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold tracking-wide uppercase transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  YES — ISSUE RESOLVED
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDisputeIncidentId(inc.id);
                                    setDisputeReasonInput('');
                                  }}
                                  className="px-5 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold tracking-wide uppercase transition-all active:scale-95 flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  NO — ISSUE STILL EXISTS
                                </button>
                              </div>
                            ) : (
                              /* Inline Dispute Form */
                              <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-800 space-y-3 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
                                  <span>Specify why the issue remains unresolved:</span>
                                  <button
                                    type="button"
                                    onClick={() => setDisputeIncidentId(null)}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    ✕ Cancel
                                  </button>
                                </div>
                                <textarea
                                  rows={2}
                                  value={disputeReasonInput}
                                  onChange={(e) => setDisputeReasonInput(e.target.value)}
                                  placeholder="Describe the defect that is still present on-site..."
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                                />
                                <div className="flex justify-end gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => setDisputeIncidentId(null)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!disputeReasonInput.trim()) {
                                        alert('Please enter a dispute reason explaining what defect remains.');
                                        return;
                                      }
                                      citizenConfirmOrDisputeRepair(inc.id, false, disputeReasonInput.trim());
                                      setDisputeIncidentId(null);
                                    }}
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-md"
                                  >
                                    Register Formal Dispute
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Tracking Bar with Quick Incident Chips */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  Track Your Reported Infrastructure Incident
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Follow your reported incident from initial citizen live camera capture through AI triage, assignment, contractor repair, and final resolution.
                </p>
              </div>

              {/* Quick Case Selection Chips */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500 font-mono text-[11px]">Quick Track:</span>
                {incidents.slice(0, 6).map((inc) => (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => {
                      setTrackingId(inc.id);
                      setTrackedIncident(inc);
                    }}
                    className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-all ${
                      trackedIncident?.id === inc.id
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600 ring-1 ring-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    #{inc.id}
                  </button>
                ))}
              </div>

              <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter Tracking ID (e.g. INF-2026-9041)..."
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20"
                >
                  Lookup Case
                </button>
              </form>

              {/* Tracked Result: Comprehensive End-to-End View */}
              {trackedIncident && (
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-800/60 space-y-5 mt-4 shadow-xl animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-emerald-400">{trackedIncident.id}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {trackedIncident.category}
                        </span>
                        <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {trackedIncident.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{trackedIncident.title}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        {trackedIncident.location.address} ({trackedIncident.location.ward})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-400 block">
                        Reported: {new Date(trackedIncident.reportedAt).toLocaleDateString()}
                      </span>
                      {trackedIncident.assignedTo && (
                        <span className="text-xs text-amber-300 font-medium block mt-1">
                          Prime Contractor: {trackedIncident.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 8-Stage Lifecycle Tracker */}
                  <IncidentLifecycleTracker incident={trackedIncident} interactive={true} />

                  {/* Side-by-Side Photographic Evidence (Original vs Repaired) */}
                  <BeforeAfterEvidenceViewer
                    incident={trackedIncident}
                    workOrder={workOrders.find((w) => w.incidentId === trackedIncident.id)}
                    validationRecord={trackedIncident.repairValidation}
                    showInspectionControls={false}
                  />

                  {/* Prompt for citizen confirmation if ready */}
                  {trackedIncident.status === 'resolved' && (
                    <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <HelpCircle className="w-4 h-4 text-cyan-400" />
                        Has this problem been resolved at your location?
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            citizenConfirmOrDisputeRepair(
                              trackedIncident.id,
                              true,
                              'Citizen confirmed repair is completely fixed and verified.'
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase"
                        >
                          YES — ISSUE RESOLVED
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('Please explain what defect remains unresolved:');
                            if (reason) citizenConfirmOrDisputeRepair(trackedIncident.id, false, reason);
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 font-bold text-xs uppercase"
                        >
                          NO — ISSUE STILL EXISTS
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Complete Status Timeline */}
                  <div className="pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Full Incident Audit Timeline
                    </h4>
                    <div className="space-y-2 relative pl-4 border-l border-slate-800">
                      {trackedIncident.timeline.map((entry, idx) => (
                        <div key={idx} className="relative text-xs space-y-0.5">
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-950"></div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{entry.title}</span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{entry.description}</p>
                          <span className="text-[10px] text-cyan-400/80 font-mono">By: {entry.user}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Citizen Community Bulletins & Live Camera Prompt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 backdrop-blur-md">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Live Neighborhood Infrastructure Bulletins
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-0.5">Outer Ring Road (Marathahalli) Advisory</span>
                    Pothole restoration active near Marathahalli Bridge. Service road diversion in effect until 22:00.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-800">
                    <span className="font-semibold text-cyan-300 block mb-0.5">Indiranagar (Ward 74) BWSSB Advisory</span>
                    Emergency water main valve repair on 100 Feet Road completed. Full municipal supply pressure restored.
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3 backdrop-blur-md">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Live Photo Incident Reporting
                  </h3>
                  <p className="text-xs text-slate-400">
                    Citizens capture live on-site photographic evidence directly through the browser camera API. Gallery uploads are disabled to preserve tamper-proof evidence integrity.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('report')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  Open Live Camera & File Report
                </button>
              </div>
            </div>
          </div>
        </FadeContent>
      )}

      {/* 2. OFFICER INTERFACE */}
      {role === 'officer' && (
        <FadeContent effect="mist" duration={0.8} key="officer-view">
          <div className="space-y-6">
          {/* BEHAVIOUR INTELLIGENCE & UNAUTHORIZED DUMPING QUEUE */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">
                    Unauthorized Dumping & Behaviour Intelligence Queue
                  </h2>
                  <p className="text-xs text-slate-400">
                    Review incoming authorized camera and citizen dumping events. Confirming advances the 3-stage warning counter and links chronic accumulation tickets.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-800">
                {dumpingEvents.filter((e) => e.status === 'unverified').length} pending review
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dumpingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400">{evt.id}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        evt.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : evt.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {evt.status}
                      </span>
                    </div>

                    <img
                      src={evt.evidenceUrl}
                      alt={`Event ${evt.id}`}
                      className="w-full h-32 object-cover rounded-lg border border-slate-700"
                    />

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white truncate">{evt.location.address}</p>
                      <p className="text-[11px] text-slate-400">
                        Ward: <span className="text-slate-200">{evt.location.ward}</span> • Coverage: <span className="text-rose-400 font-bold">{evt.coveragePercentage || 15}%</span>
                      </p>
                      <div className="text-[10px] text-slate-500">
                        Source: {evt.sourceType.replace('_', ' ')} • Stage {evt.warningStage || 1} of 3
                      </div>
                    </div>
                  </div>

                  {evt.status === 'unverified' ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => confirmDumpingEvent(evt.id)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                      >
                        ✓ Confirm Event
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('State rejection reason:');
                          if (reason) rejectDumpingEvent(evt.id, reason);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span>Decided by {evt.confirmedBy || 'Officer'}</span>
                      {evt.linkedIncidentId && (
                        <span className="font-mono text-cyan-400">Linked: {evt.linkedIncidentId}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* REPAIR EVIDENCE QUALITY VALIDATION QUEUE */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">
                    Contractor Repair Evidence Review Queue
                  </h2>
                  <p className="text-xs text-slate-400">
                    Compare original defect evidence side-by-side with contractor completion photos. Authorize signoff or demand engineering rework.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                {incidents.filter((i) => i.status === 'review').length} ready for quality signoff
              </span>
            </div>

            {incidents.filter((i) => i.status === 'review').length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No contractor repairs currently awaiting field verification.
              </div>
            ) : (
              <div className="space-y-3">
                {incidents
                  .filter((i) => i.status === 'review')
                  .map((inc) => {
                    const wo = workOrders.find((w) => w.incidentId === inc.id) || {
                      id: 'WO-DEMO-01',
                      incidentId: inc.id,
                      contractorId: 'CTR-04',
                      contractorName: 'Apex Paving & Heavy Civils Ltd.',
                      scopeOfWork: 'Surface excavation and asphalt resurfacing',
                      status: 'repair_submitted' as const,
                      dispatchedAt: new Date().toISOString(),
                      targetCompletionAt: new Date().toISOString(),
                      repairEvidence: [],
                    };

                    return (
                      <div
                        key={inc.id}
                        className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400">#{inc.id}</span>
                            <span className="text-xs font-bold text-white">{inc.title}</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                              Awaiting Signoff
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {inc.location.address} • Contractor: {inc.assignedTo?.name || 'Apex Paving'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setValidatingWorkOrder({ wo, inc })}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                          >
                            Inspect & Validate Repair
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* MAIN FIELD INSPECTION & VERIFICATION QUEUE */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  Field Inspection & Verification Queue
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect submitted citizen photographic evidence, verify incidents, assign to municipal authorities, or consolidate duplicates.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800 hidden sm:inline-block">
                Inspector #OFF-402 (M. Vance)
              </span>
            </div>

            {/* List of unverified or pending cases */}
            <div className="space-y-3">
              {incidents.filter((i) => i.status === 'submitted' || i.status === 'triage').length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 backdrop-blur-md">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
                  <h4 className="text-sm font-bold text-white">Verification Queue Clear</h4>
                  <p className="text-xs text-slate-400 mt-1">All incoming citizen incident reports have been inspected or dispatched.</p>
                </div>
              ) : (
                incidents
                  .filter((i) => i.status === 'submitted' || i.status === 'triage')
                  .map((inc) => (
                    <div
                      key={inc.id}
                      className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-cyan-800/60"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                          <IncidentEvidenceViewer
                            images={inc.images || []}
                            category={inc.category}
                            severity={inc.severity}
                            isDemonstration={inc.isDemonstration}
                            reporterName={inc.reporter.name}
                            isThumbnail={true}
                            onOpenFullView={() => setSelectedIncident(inc)}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-400">{inc.id}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {inc.category}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                inc.severity === 'critical'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {inc.severity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              By: {inc.reporter.name}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white hover:text-cyan-300 cursor-pointer" onClick={() => setSelectedIncident(inc)}>
                            {inc.title}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              {inc.location.address}
                              <span className="font-mono text-[10px] text-cyan-400/90 ml-1">
                                ({inc.location.lat.toFixed(5)}, {inc.location.lng.toFixed(5)})
                              </span>
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(inc.reportedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                        <button
                          onClick={() => setConsolidatingIncident(inc)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                          title="Check spatial duplicates and consolidate reports"
                        >
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          Consolidate Duplicates
                        </button>

                        <button
                          onClick={() => setBriefIncident(inc)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                          title="Generate official inspection brief"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          Brief
                        </button>

                        <button
                          onClick={() => setAssigningIncidentId(inc.id)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-colors"
                        >
                          Assign Authority
                        </button>

                        <button
                          onClick={() => setRejectingIncidentId(inc.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-colors"
                        >
                          Reject Report
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* REJECT MODAL DIALOG */}
          {rejectingIncidentId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="w-full max-w-md bg-slate-900 border border-rose-800/80 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <XCircle className="w-5 h-5" />
                  Reject Incident Report #{rejectingIncidentId}
                </div>
                <p className="text-xs text-slate-300">
                  Please specify the formal reason for rejecting this civic report. This reason will be logged in the immutable audit trail.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Standard Rejection Category</label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="Duplicate Report (Already Dispatched)">Duplicate Report (Already Dispatched)</option>
                      <option value="Inconclusive / Blurry Photographic Evidence">Inconclusive / Blurry Photographic Evidence</option>
                      <option value="Private Property Outside Municipal Jurisdiction">Private Property Outside Municipal Jurisdiction</option>
                      <option value="Normal Cosmetic Wear (Within Tolerances)">Normal Cosmetic Wear (Within Tolerances)</option>
                      <option value="False Alarm / Non-Hazardous Condition">False Alarm / Non-Hazardous Condition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Additional Officer Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Add details for the citizen or internal audit..."
                      value={customRejectionNote}
                      onChange={(e) => setCustomRejectionNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setRejectingIncidentId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmRejection(rejectingIncidentId)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/30"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ASSIGN AUTHORITY MODAL DIALOG */}
          {assigningIncidentId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="w-full max-w-md bg-slate-900 border border-cyan-800/80 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Building className="w-5 h-5" />
                  Assign Authority for Case #{assigningIncidentId}
                </div>
                <p className="text-xs text-slate-300">
                  Select the municipal agency or certified prime contractor responsible for resolving this infrastructure issue:
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Responsible Municipal Authority</label>
                    <select
                      value={selectedAuthority}
                      onChange={(e) => setSelectedAuthority(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {authorities.map((a) => (
                        <option key={a.name} value={a.name}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setAssigningIncidentId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmAuthorityAssign(assigningIncidentId)}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20"
                  >
                    Confirm & Dispatch
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </FadeContent>
      )}

      {/* 3. CONTRACTOR INTERFACE */}
      {role === 'contractor' && (
        <FadeContent effect="mist" duration={0.8} key="contractor-view">
          <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-400" />
                  Assigned Municipal Work Orders
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  View assigned work orders, input materials and labor hours, and submit before/after photographic repair evidence for authority review.
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800 hidden sm:inline-block">
                Apex Paving & Heavy Civils Ltd.
              </span>
            </div>

            <div className="space-y-4">
              {workOrders.map((wo) => {
                const targetInc = incidents.find((i) => i.id === wo.incidentId);
                const originalPhoto = targetInc?.images?.[0]?.url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=600';
                const hasEvidence = (wo.repairEvidence && wo.repairEvidence.length > 0) || targetInc?.status === 'review';
                const latestEvidence = wo.repairEvidence?.[wo.repairEvidence.length - 1];

                return (
                  <div key={wo.id} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Original Incident Snapshot & Metadata */}
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-900 group">
                          <img
                            src={originalPhoto}
                            alt="Original incident"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/85 text-[9px] font-mono text-cyan-300 font-bold">
                            ORIGINAL
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-400">{wo.id}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                              {wo.status.replace('_', ' ')}
                            </span>
                            <span className="font-mono text-xs text-cyan-400 font-bold">
                              Case #{wo.incidentId}
                            </span>
                            {targetInc && (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {targetInc.category}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-white">
                            {targetInc?.title || 'Civil Infrastructure Restoration'}
                          </h4>
                          <p className="text-xs text-slate-300 line-clamp-1">{wo.scopeOfWork}</p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-1">
                            {targetInc && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                {targetInc.location.address}
                              </span>
                            )}
                            {targetInc && (
                              <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                                <Clock className="w-3 h-3 text-slate-500" />
                                Reported: {new Date(targetInc.reportedAt).toLocaleDateString()}
                              </span>
                            )}
                            <span className="font-mono text-[11px] text-amber-400/90">
                              Target SLA: {wo.targetCompletionAt ? new Date(wo.targetCompletionAt).toLocaleDateString() : '72 Hours'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions and Evidence Status */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 justify-start lg:justify-end">
                        {wo.status === 'dispatched' && (
                          <button
                            onClick={() => updateIncidentStatus(wo.incidentId, 'in_progress', 'Contractor crew mobilized on-site')}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-amber-700/50"
                          >
                            Mark On-Site / In-Progress
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (targetInc) {
                              setSubmittingRepairWorkOrder({ wo, inc: targetInc });
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                            hasEvidence
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20'
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          {hasEvidence ? 'UPDATE / VIEW REPAIR EVIDENCE' : 'SUBMIT REPAIR EVIDENCE'}
                        </button>
                      </div>
                    </div>

                    {/* Evidence summary if already submitted */}
                    {hasEvidence && (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          {latestEvidence?.url && (
                            <img
                              src={latestEvidence.url}
                              alt="Repaired Evidence"
                              className="w-12 h-12 rounded-lg object-cover border border-emerald-700 shrink-0"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Repair Evidence Submitted
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-800">
                                AWAITING VERIFICATION
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-0.5">
                              {wo.progressNotes || 'Completed physical repair and photographic proof attached.'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">
                          Labor: {wo.laborHours || 'Logged'} | Mat: {wo.materialsUsed ? 'Documented' : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </FadeContent>
      )}

      {/* 4. ADMIN INTERFACE */}
      {role === 'admin' && (
        <FadeContent effect="mist" duration={0.8} key="admin-view">
          <div className="space-y-6">
          {/* Configurable Thresholds Manager */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">
                    Configurable Municipal Threshold Engine
                  </h2>
                  <p className="text-xs text-slate-400">
                    Administrators can tune real-time thresholds for AI confidence gates, chronic accumulation triggers, duplicate search radiuses, and SLA timers.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-purple-300 bg-purple-950 px-2.5 py-1 rounded-lg border border-purple-800">
                {thresholds.length} rules active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {thresholds.map((t) => {
                const currentVal = thresholdEdits[t.key] ?? t.value;
                return (
                  <div key={t.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{t.label}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{t.unit}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{t.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                      <input
                        type="number"
                        step={t.unit === '%' ? 1 : 0.5}
                        min={t.min}
                        max={t.max}
                        value={currentVal}
                        onChange={(e) =>
                          setThresholdEdits((prev) => ({
                            ...prev,
                            [t.key]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white text-right focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => updateThresholdConfig(t.key, currentVal)}
                        className="flex-1 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-sm"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cryptographic Audit Trail */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">
                    Immutable Audit Log Stream & Cryptographic Hashes
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time append-only ledger recording all status changes, consolidations, AI measurements, and human validation decisions.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800">
                {auditLogs.length} events logged
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold">{log.action}</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                        {log.entityType}:{log.entityId}
                      </span>
                      <span className="text-[10px] text-slate-500">by {log.actor} ({log.actorRole})</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{log.details}</p>
                    {log.contentHash && (
                      <div className="text-[9px] font-mono text-slate-500 truncate">
                        SHA-256: {log.contentHash}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* External Integrations & Backend Connectivity */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">
                    External Civic Integrations & Backend Status
                  </h2>
                  <p className="text-xs text-slate-400">
                    Verified synchronization adapters and municipal camera streams.
                  </p>
                </div>
              </div>
              <button
                onClick={checkBackendConnection}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                Check Connection
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">FastAPI Backend (REST)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isBackendConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {isBackendConnected ? 'CONNECTED' : 'OFFLINE / DEMO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isBackendConnected
                    ? 'Connected to FastAPI server at http://localhost:8000. PostgreSQL/SQLite persistence active.'
                    : 'Running in resilient browser-local offline mode with versioned schema migrations.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">BBMP Sahaya 2.0 Adapter</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                    SANDBOX ADAPTER
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Municipal complaint synchronization adapter in sandbox mode. Live BBMP Sahaya credentials are unconfigured.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Authorized CCTV Streams</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    SIMULATED DEMO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Authorized camera feed interface ready. Transparently labelled simulated feed for development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeContent>
      )}

      {/* Global Modals */}
      {consolidatingIncident && (
        <ConsolidationModal
          primaryIncident={consolidatingIncident}
          onClose={() => setConsolidatingIncident(null)}
        />
      )}

      {validatingWorkOrder && (
        <RepairValidationModal
          workOrder={validatingWorkOrder.wo}
          incident={validatingWorkOrder.inc}
          onClose={() => setValidatingWorkOrder(null)}
        />
      )}

      {submittingRepairWorkOrder && (
        <ContractorRepairEvidenceModal
          workOrder={submittingRepairWorkOrder.wo}
          incident={submittingRepairWorkOrder.inc}
          onClose={() => setSubmittingRepairWorkOrder(null)}
        />
      )}

      {briefIncident && (
        <InspectionBriefModal
          incident={briefIncident}
          onClose={() => setBriefIncident(null)}
        />
      )}

      {historyAsset && (
        <InfrastructureHistoryModal
          asset={historyAsset}
          onClose={() => setHistoryAsset(null)}
        />
      )}
    </div>
  );
};
