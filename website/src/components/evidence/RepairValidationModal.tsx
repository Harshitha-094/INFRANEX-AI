import React, { useState } from 'react';
import { ContractorWorkOrder, Incident } from '../../types';
import { useApp } from '../../context/AppContext';
import { IncidentLifecycleTracker } from '../cases/IncidentLifecycleTracker';
import { BeforeAfterEvidenceViewer } from './BeforeAfterEvidenceViewer';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  ShieldCheck,
  HardHat,
  FileText,
  Clock,
  MapPin,
  Check,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface RepairValidationModalProps {
  workOrder: ContractorWorkOrder;
  incident: Incident;
  onClose: () => void;
}

export const RepairValidationModal: React.FC<RepairValidationModalProps> = ({
  workOrder,
  incident,
  onClose,
}) => {
  const { validateRepairSubmission } = useApp();

  const [decision, setDecision] = useState<
    'approved' | 'partially_repaired' | 'rework_required' | 'inspection_required' | 'rejected'
  >('approved');
  const [rationale, setRationale] = useState<string>(
    'Asphalt compaction, edge sealing, and level smoothness verified against municipal engineering standards. No visible structural defect remains.'
  );
  const [remainingDamage, setRemainingDamage] = useState<string>('0% - Defect fully eliminated');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (overrideDecision?: typeof decision, overrideRationale?: string) => {
    const finalDecision = overrideDecision || decision;
    const finalRationale = overrideRationale || rationale;

    if (finalDecision !== 'approved' && (!finalRationale.trim() || finalRationale.trim().length < 8)) {
      setErrorMsg('A meaningful rationale (at least 8 characters) is required when rejecting or requesting rework.');
      return;
    }

    validateRepairSubmission(workOrder.id, finalDecision, finalRationale, remainingDamage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Evidence-Based Municipal Repair Verification
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Work Order <span className="font-mono text-cyan-400">#{workOrder.id}</span> • Incident{' '}
                <span className="font-mono text-cyan-400">#{incident.id}</span> • Inspector #OFF-402 (M. Vance)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Authoritative 8-Stage Lifecycle Tracker */}
          <IncidentLifecycleTracker incident={incident} interactive={true} />

          {/* Side-by-Side Before & After Evidence Inspection */}
          <BeforeAfterEvidenceViewer
            incident={incident}
            workOrder={workOrder}
            validationRecord={incident.repairValidation}
            showInspectionControls={false}
          />

          {/* Contractor Telemetry & Labor Logs */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              Contractor Execution Logs ({workOrder.contractorName})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Materials Applied:</span>
                <div className="text-slate-200 font-medium mt-0.5">
                  {workOrder.materialsUsed || 'Grade-4 Bitumen Emulsion (450kg), M-20 Aggregate (2.4 tons)'}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Labor Deployed:</span>
                <div className="text-slate-200 font-medium mt-0.5">
                  {workOrder.laborHours || '14 crew hours (4 pavers, 1 foreman)'}
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Verification Decision Form */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Officer Quality Audit Verdict
              </h3>
              <span className="text-[10px] text-cyan-400 font-mono">Decision mandatory</span>
            </div>

            {/* Decision options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDecision('approved');
                  setRationale(
                    'Asphalt compaction, edge sealing, and level smoothness verified against municipal engineering standards. No visible structural defect remains.'
                  );
                  setErrorMsg(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  decision === 'approved'
                    ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-300">Approve Repair</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Advances incident to Resolved & sends Citizen Confirmation prompt.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('rework_required');
                  setRationale('Work does not meet density standard. Sub-base compaction uneven; defect persists.');
                  setErrorMsg(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  decision === 'rework_required'
                    ? 'bg-amber-950/50 border-amber-500 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-300">Request Rework</span>
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Returns work order to contractor with actionable remediation items.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('rejected');
                  setRationale('Defect unaddressed or wrong location repaired. Complete re-execution required.');
                  setErrorMsg(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  decision === 'rejected'
                    ? 'bg-rose-950/50 border-rose-500 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-300">Reject Evidence</span>
                  <XCircle className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Rejects submitted evidence. Work order kept in active state.
                </p>
              </button>
            </div>

            {/* Rationale Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Rationale & Engineering Observations <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Log engineering observations: compaction smoothness, edge seal integrity, surface drainage gradient..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={() => handleSubmit()}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 ${
              decision === 'approved'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : decision === 'rework_required'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Submit Official Verdict ({decision.replace('_', ' ').toUpperCase()})
          </button>
        </div>
      </div>
    </div>
  );
};
