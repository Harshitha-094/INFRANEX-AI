import React, { useState } from 'react';
import { Incident, IncidentImage, ContractorWorkOrder, RepairValidationRecord } from '../../types';
import {
  Clock,
  MapPin,
  User,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HardHat,
  Eye,
  Maximize2,
  FileText
} from 'lucide-react';

interface BeforeAfterEvidenceViewerProps {
  incident: Incident;
  workOrder?: ContractorWorkOrder;
  validationRecord?: RepairValidationRecord;
  showInspectionControls?: boolean;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onRequestMoreWork?: (reason: string) => void;
}

export const BeforeAfterEvidenceViewer: React.FC<BeforeAfterEvidenceViewerProps> = ({
  incident,
  workOrder,
  validationRecord,
  showInspectionControls = false,
  onApprove,
  onReject,
  onRequestMoreWork,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [activeAction, setActiveAction] = useState<'reject' | 'rework' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Original Evidence
  const originalImage: IncidentImage | null =
    incident.images?.find((img) => !img.isAfterRepair) ||
    (incident.images && incident.images.length > 0 ? incident.images[0] : null);

  // Repaired Evidence
  const repairImage: IncidentImage | null =
    incident.images?.slice().reverse().find((img) => img.isAfterRepair) ||
    (workOrder?.repairEvidence && workOrder.repairEvidence.length > 0
      ? workOrder.repairEvidence[workOrder.repairEvidence.length - 1]
      : null);

  const handleActionClick = (action: 'reject' | 'rework') => {
    setActiveAction(action);
    setShowRejectForm(true);
    setFormError(null);
  };

  const handleConfirmAction = () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 8) {
      setFormError('Please provide a meaningful reason (at least 8 characters) explaining the deficiency or additional work needed.');
      return;
    }

    if (activeAction === 'reject' && onReject) {
      onReject(rejectReason.trim());
    } else if (activeAction === 'rework' && onRequestMoreWork) {
      onRequestMoreWork(rejectReason.trim());
    }

    setShowRejectForm(false);
    setRejectReason('');
    setActiveAction(null);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Before & After Photographic Evidence Inspection
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Side-by-side comparative inspection between original citizen report and contractor repair evidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {repairImage ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Repair Evidence Submitted
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
              Awaiting Repair Submission
            </span>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparison Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: ORIGINAL INCIDENT EVIDENCE */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-950/80 shadow-md space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Original Incident Defect
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {originalImage?.isCitizenCapture ? 'Citizen Live Camera' : 'Initial Observation'}
              </span>
            </div>

            {/* Original Image */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group h-56 flex items-center justify-center">
              {originalImage ? (
                <img
                  src={originalImage.url}
                  alt="Original Incident Hazard"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-center p-4 text-slate-500 text-xs">
                  No initial photograph recorded
                </div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 text-rose-300 text-[10px] font-bold border border-rose-800/60">
                BEFORE REPAIR
              </div>
            </div>
          </div>

          {/* Original Metadata */}
          <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Report Date: <strong className="text-slate-200">{new Date(incident.reportedAt).toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{incident.location.address} ({incident.location.ward})</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Reporter: <strong className="text-slate-200">{incident.reporter.isAnonymous ? 'Anonymous Citizen' : incident.reporter.name}</strong></span>
            </div>
            {originalImage?.sha256Hash && (
              <div className="text-[10px] font-mono text-slate-500 truncate pt-0.5">
                Hash: {originalImage.sha256Hash}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: SUBMITTED REPAIR EVIDENCE */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-950/80 shadow-md space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Submitted Repair Evidence
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {repairImage?.timestamp ? new Date(repairImage.timestamp).toLocaleDateString() : 'Awaiting Proof'}
              </span>
            </div>

            {/* Repaired Image */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group h-56 flex items-center justify-center">
              {repairImage ? (
                <img
                  src={repairImage.url}
                  alt="Post-Repair Infrastructure"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-center p-4 text-slate-500 text-xs space-y-1">
                  <HardHat className="w-6 h-6 mx-auto text-amber-400/60 mb-1" />
                  <p className="font-semibold text-slate-300">Contractor photo not yet uploaded</p>
                  <p className="text-[11px] text-slate-500">
                    Repair is dispatched/in progress. Completion image will appear once submitted.
                  </p>
                </div>
              )}
              {repairImage && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 text-[10px] font-bold border border-emerald-800/60">
                  AFTER REPAIR
                </div>
              )}
            </div>
          </div>

          {/* Repair Metadata */}
          <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
            {repairImage ? (
              <>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Upload Time:{' '}
                    <strong className="text-slate-200">
                      {repairImage.timestamp ? new Date(repairImage.timestamp).toLocaleString() : 'Recently recorded'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Submitter:{' '}
                    <strong className="text-slate-200">
                      {workOrder?.contractorName || incident.assignedTo?.name || 'Assigned Prime Contractor'}
                    </strong>
                  </span>
                </div>
                {workOrder?.progressNotes && (
                  <div className="text-[11px] text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <strong className="text-white">Contractor Notes:</strong> {workOrder.progressNotes}
                  </div>
                )}
                {repairImage.sha256Hash && (
                  <div className="text-[10px] font-mono text-slate-500 truncate pt-0.5">
                    Hash: {repairImage.sha256Hash}
                  </div>
                )}
              </>
            ) : (
              <div className="text-[11px] text-slate-500 italic">
                Awaiting contractor field execution and photographic verification submission.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviewer / Inspection Comments Banner (If existing) */}
      {validationRecord && (
        <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
          validationRecord.decision === 'approved'
            ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
            : 'bg-amber-950/30 border-amber-800 text-amber-200'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Official Municipal Quality Audit Decision: {validationRecord.decision.replace('_', ' ').toUpperCase()}
            </span>
            <span className="font-mono text-[10px] opacity-80">
              {new Date(validationRecord.validatedAt).toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            <strong>Rationale:</strong> {validationRecord.rationale}
          </p>
          <div className="text-[10px] opacity-75">
            Inspected by: {validationRecord.officerName} (Municipal Quality Auditor)
          </div>
        </div>
      )}

      {/* Optional Inspection Controls for Officer */}
      {showInspectionControls && repairImage && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Officer Quality Audit Actions
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Role: Municipal Field Inspector
            </span>
          </div>

          {!showRejectForm ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {onApprove && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Repair Evidence
                </button>
              )}
              {onRequestMoreWork && (
                <button
                  type="button"
                  onClick={() => handleActionClick('rework')}
                  className="px-4 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  Request Additional Work
                </button>
              )}
              {onReject && (
                <button
                  type="button"
                  onClick={() => handleActionClick('reject')}
                  className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Repair Evidence
                </button>
              )}
            </div>
          ) : (
            /* Mandatory Reason Form for Rejection / Rework */
            <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
                <span>
                  {activeAction === 'reject' ? 'Reject Repair Evidence' : 'Request Additional Work'} — Mandatory Rationale
                </span>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕ Cancel
                </button>
              </div>

              {formError && (
                <div className="text-[11px] text-rose-400 bg-rose-950/50 p-2 rounded border border-rose-900/60">
                  {formError}
                </div>
              )}

              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why repair does not meet standard (e.g. edge void unsealed, grade depression persists)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-md"
                >
                  Confirm {activeAction === 'reject' ? 'Rejection' : 'Rework Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
