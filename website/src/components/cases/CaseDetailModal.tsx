import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Incident, IssueStatus } from '../../types';
import { InfrastructureMap } from '../map/InfrastructureMap';
import { IncidentLifecycleTracker } from './IncidentLifecycleTracker';
import { BeforeAfterEvidenceViewer } from '../evidence/BeforeAfterEvidenceViewer';
import { ConsolidationModal } from './ConsolidationModal';
import { InspectionBriefModal } from './InspectionBriefModal';
import { InfrastructureHistoryModal } from '../infrastructure/InfrastructureHistoryModal';
import {
  X,
  MapPin,
  Clock,
  Sparkles,
  User,
  HardHat,
  Send,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertOctagon,
  FileText,
  Layers,
  Database,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Check,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface CaseDetailModalProps {
  incident: Incident;
  onClose: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ incident, onClose }) => {
  const {
    updateIncidentStatus,
    assignContractor,
    role,
    infrastructureAssets,
    workOrders,
    validateRepairSubmission,
    citizenConfirmOrDisputeRepair
  } = useApp();

  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(incident.status);
  const [statusNote, setStatusNote] = useState('');
  const [selectedContractorId, setSelectedContractorId] = useState(incident.assignedTo?.id || '');

  const [showBrief, setShowBrief] = useState(false);
  const [showConsolidate, setShowConsolidate] = useState(false);
  const [showHistoryAsset, setShowHistoryAsset] = useState<any | null>(null);

  // Citizen dispute prompt state
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const matchedAsset =
    infrastructureAssets.find((a) => a.id === incident.infrastructureAssetId) ||
    infrastructureAssets.find((a) => a.linkedIncidentIds.includes(incident.id));

  const matchedWorkOrder =
    incident.workOrder || workOrders.find((w) => w.incidentId === incident.id);

  const hasRepairEvidence = Boolean(
    incident.images?.some((img) => img.isAfterRepair) ||
    matchedWorkOrder?.repairEvidence?.length ||
    incident.status === 'review' ||
    incident.status === 'resolved' ||
    incident.status === 'closed' ||
    incident.status === 'archived'
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const availableContractors = [
    { id: 'CTR-04', name: 'Apex Paving & Heavy Civils Ltd.', role: 'Roads & Bridges Specialist', company: 'Apex Civil' },
    { id: 'CTR-09', name: 'AquaTech Municipal Hydrology Group', role: 'Emergency Water Response', company: 'AquaTech Utilities' },
    { id: 'CTR-03', name: 'CleanCity Solid Waste Logistics', role: 'Solid Waste & Debris Contractor', company: 'CleanCity BBMP Marshal' },
    { id: 'CTR-07', name: 'Lumen Municipal Electrical Services', role: 'Power & Grid Contractor', company: 'Lumen Energy' },
    { id: 'CTR-02', name: 'Vanguard Structural Retrofits', role: 'Heavy Structural Engineering', company: 'Vanguard' },
  ];

  const handleStatusUpdate = () => {
    updateIncidentStatus(incident.id, selectedStatus, statusNote);
    setStatusNote('');
  };

  const handleContractorAssign = (ctrId: string) => {
    setSelectedContractorId(ctrId);
    const chosen = availableContractors.find((c) => c.id === ctrId);
    if (chosen) {
      assignContractor(incident.id, chosen);
    }
  };

  // Officer review actions
  const handleOfficerApprove = () => {
    if (matchedWorkOrder) {
      validateRepairSubmission(
        matchedWorkOrder.id,
        'approved',
        'Asphalt compaction, edge sealing, and level smoothness verified against municipal engineering standards. No visible structural defect remains.'
      );
    } else {
      updateIncidentStatus(
        incident.id,
        'resolved',
        'Officer verified repair evidence on-site. Approved for citizen confirmation.'
      );
    }
  };

  const handleOfficerRework = (reason: string) => {
    if (matchedWorkOrder) {
      validateRepairSubmission(matchedWorkOrder.id, 'rework_required', reason);
    } else {
      updateIncidentStatus(incident.id, 'in_progress', `Rework requested by officer: ${reason}`);
    }
  };

  const handleOfficerReject = (reason: string) => {
    if (matchedWorkOrder) {
      validateRepairSubmission(matchedWorkOrder.id, 'rejected', reason);
    } else {
      updateIncidentStatus(incident.id, 'in_progress', `Repair rejected by officer: ${reason}`);
    }
  };

  const statusOptions: { id: IssueStatus; label: string }[] = [
    { id: 'submitted', label: 'Submitted' },
    { id: 'triage', label: 'AI Triage & Verified' },
    { id: 'assigned', label: 'Work Order Assigned' },
    { id: 'in_progress', label: 'Repair In Progress' },
    { id: 'review', label: 'Awaiting Repair Verification' },
    { id: 'resolved', label: 'Resolved (Awaiting Citizen Confirmation)' },
    { id: 'disputed', label: 'Disputed by Citizen' },
    { id: 'closed', label: 'Closed & Archived' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              {incident.id}
            </span>
            <span
              className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                incident.severity === 'critical'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                  : incident.severity === 'high'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}
            >
              {incident.severity}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
              {incident.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBrief(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1 transition-all"
              title="Official Municipal Inspection Brief"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Brief</span>
            </button>

            {incident.status !== 'consolidated' && (
              <button
                onClick={() => setShowConsolidate(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 flex items-center gap-1 transition-all"
                title="Consolidate duplicate reports under this master incident"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Consolidate</span>
              </button>
            )}

            {matchedAsset && (
              <button
                onClick={() => setShowHistoryAsset(matchedAsset)}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/80 text-xs font-semibold text-cyan-300 flex items-center gap-1 transition-all"
                title={`Inspect Asset ${matchedAsset.id} History`}
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Asset History</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Authoritative 8-Stage Lifecycle Tracker */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
            <IncidentLifecycleTracker incident={incident} interactive={true} />
          </div>

          {/* Title & Location Header */}
          <div>
            <h2 className="text-xl font-bold text-white mb-1.5">{incident.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {incident.location.address} ({incident.location.ward})
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Reported {new Date(incident.reportedAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Reporter: <strong>{incident.reporter.isAnonymous ? 'Anonymous Citizen' : incident.reporter.name}</strong>
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              {incident.description}
            </p>
          </div>

          {/* CITIZEN CONFIRMATION SECTION (When awaiting citizen sign-off) */}
          {incident.status === 'resolved' && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-950/50 border-2 border-cyan-500/80 shadow-2xl space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Has this problem been resolved?</h3>
                  <p className="text-xs text-slate-300">
                    Municipal inspectors have approved the contractor's repair. Please confirm whether the hazard is completely resolved on-site.
                  </p>
                </div>
              </div>

              {!isDisputing ? (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      citizenConfirmOrDisputeRepair(
                        incident.id,
                        true,
                        'Citizen confirmed repair is completely fixed and verified.'
                      )
                    }
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    YES — ISSUE RESOLVED
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDisputing(true)}
                    className="px-5 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    NO — ISSUE STILL EXISTS
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-rose-800 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
                    <span>Describe why the problem is still unresolved:</span>
                    <button
                      type="button"
                      onClick={() => setIsDisputing(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Describe specific defect remaining (e.g. trench still concave, debris on pedestrian walkway)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsDisputing(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!disputeReason.trim()) {
                          alert('Please enter a dispute reason.');
                          return;
                        }
                        citizenConfirmOrDisputeRepair(incident.id, false, disputeReason.trim());
                        setIsDisputing(false);
                      }}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-md"
                    >
                      Submit Dispute
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Geospatial Map Inspection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Geospatial Incident Map Inspection
              </span>
              <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800">
                GPS: {incident.location.lat.toFixed(5)}, {incident.location.lng.toFixed(5)}
              </span>
            </div>
            <InfrastructureMap
              incidents={[incident]}
              selectedIncidentId={incident.id}
              center={[incident.location.lat, incident.location.lng]}
              zoom={15}
              height="200px"
              showBadge={false}
            />
          </div>

          {/* AI Vision & Risk Diagnostics */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                INFRANEX Core AI Diagnostics (Assistive Analysis)
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {(incident.aiAnalysis.confidenceScore * 100).toFixed(0)}% Confidence Match
              </span>
            </div>

            <p className="text-xs text-slate-300">
              <strong className="text-white">Detected Anomaly:</strong> {incident.aiAnalysis.detectedAnomaly}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block font-semibold">Hazard Class</span>
                <span className="font-bold text-rose-400 flex items-center gap-1 mt-0.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  {incident.aiAnalysis.safetyHazardLevel}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block font-semibold">Traffic Impact</span>
                <span className="font-bold text-amber-400 mt-0.5 block font-mono">
                  {incident.aiAnalysis.trafficImpactIndex} / 10 Index
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block font-semibold">Estimated Repair</span>
                <span className="font-bold text-white mt-0.5 block font-mono">
                  ~{incident.aiAnalysis.estimatedRepairHours} Hours
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block font-semibold">Budget Est.</span>
                <span className="font-bold text-emerald-400 mt-0.5 flex items-center font-mono">
                  <DollarSign className="w-3 h-3" />
                  {incident.aiAnalysis.estimatedCostUsd.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* BEFORE-AND-AFTER PHOTOGRAPHIC EVIDENCE COMPARISON */}
          <BeforeAfterEvidenceViewer
            incident={incident}
            workOrder={matchedWorkOrder}
            validationRecord={incident.repairValidation}
            showInspectionControls={role === 'officer' && incident.status === 'review'}
            onApprove={handleOfficerApprove}
            onRequestMoreWork={handleOfficerRework}
            onReject={handleOfficerReject}
          />

          {/* Workflow & Assignment Controls (for Officer, Contractor, Admin) */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HardHat className="w-4 h-4 text-cyan-400" />
              Lifecycle State & Contractor Dispatch Control
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Transition Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Update Case Status</label>
                <div className="flex gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as IssueStatus)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assign Contractor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assigned Prime Contractor
                </label>
                <select
                  value={selectedContractorId}
                  onChange={(e) => handleContractorAssign(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select Certified Contractor --</option>
                  {availableContractors.map((ctr) => (
                    <option key={ctr.id} value={ctr.id}>
                      {ctr.name} ({ctr.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Log dispatch notes, crew arrival ETA, or completion remarks..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
              >
                Apply Update
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Audit Trail & Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Immutable Case Audit Trail & Timeline
            </h3>
            <div className="space-y-3 relative pl-4 border-l border-slate-800">
              {incident.timeline.map((entry, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-900"></div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{entry.title}</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{entry.description}</p>
                  <span className="text-[10px] text-cyan-400/80 font-mono">By: {entry.user}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Reporter: {incident.reporter.name}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Close Window
          </button>
        </div>
      </div>

      {showBrief && (
        <InspectionBriefModal
          incident={incident}
          onClose={() => setShowBrief(false)}
        />
      )}

      {showConsolidate && (
        <ConsolidationModal
          primaryIncident={incident}
          onClose={() => setShowConsolidate(false)}
        />
      )}

      {showHistoryAsset && (
        <InfrastructureHistoryModal
          asset={showHistoryAsset}
          onClose={() => setShowHistoryAsset(null)}
        />
      )}
    </div>
  );
};
