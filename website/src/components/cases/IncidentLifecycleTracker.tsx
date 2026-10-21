import React, { useState } from 'react';
import { Incident, IssueStatus } from '../../types';
import {
  Eye,
  Sparkles,
  ShieldCheck,
  HardHat,
  Wrench,
  Camera,
  CheckCircle2,
  Archive,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  AlertTriangle,
  FileText,
  MapPin,
  Check,
  XCircle,
  HelpCircle
} from 'lucide-react';

export type LifecycleStageId =
  | 'detection'
  | 'ai_assessment'
  | 'verification'
  | 'assignment'
  | 'repair'
  | 'repair_evidence'
  | 'confirmation'
  | 'closure';

export type StageState = 'complete' | 'active' | 'waiting' | 'failed' | 'not_started';

export interface StageInfo {
  id: LifecycleStageId;
  order: number;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  state: StageState;
  stateLabel: string;
  summary: string;
  timestamp?: string;
  actor?: string;
  details?: string;
  evidenceUrl?: string;
}

interface IncidentLifecycleTrackerProps {
  incident: Incident;
  interactive?: boolean;
  onSelectStage?: (stage: StageInfo) => void;
  className?: string;
  compact?: boolean;
}

export const calculateLifecycleStages = (incident: Incident): StageInfo[] => {
  const status = incident.status;
  const timeline = incident.timeline || [];
  const workOrder = incident.workOrder;
  const repairValidation = incident.repairValidation;
  const citizenConfirmation = incident.citizenConfirmation;

  // Evidence checks
  const originalPhoto = incident.images && incident.images.length > 0 ? incident.images[0] : null;
  const repairEvidencePhoto =
    incident.images?.find((img) => img.isAfterRepair) ||
    workOrder?.repairEvidence?.[0];

  // Timeline helpers
  const findTimelineEvent = (types: string[]) =>
    timeline.find((t) => types.includes(t.type));

  const reportEvent = findTimelineEvent(['report']);
  const triageEvent = findTimelineEvent(['ai_triage']);
  const assignmentEvent = findTimelineEvent(['assignment']);
  const repairSubmitEvent = findTimelineEvent(['repair_submission']);
  const validationEvent = findTimelineEvent(['repair_validation']);
  const confirmationEvent = findTimelineEvent(['citizen_confirmation']);
  const disputeEvent = findTimelineEvent(['citizen_dispute']);

  // 1. DETECTION
  const stage1: StageInfo = {
    id: 'detection',
    order: 1,
    label: 'DETECTION',
    shortLabel: '1. Detect',
    icon: Eye,
    state: 'complete',
    stateLabel: 'Complete',
    summary: originalPhoto?.isCitizenCapture
      ? 'Citizen live-camera capture recorded.'
      : 'Incident detected & geo-stamped.',
    timestamp: incident.reportedAt,
    actor: incident.reporter.isAnonymous ? 'Anonymous Citizen' : incident.reporter.name,
    details: `${incident.location.address} (${incident.location.ward})`,
    evidenceUrl: originalPhoto?.url,
  };

  // 2. AI ASSESSMENT
  const hasAi = Boolean(incident.aiAnalysis && incident.aiAnalysis.confidenceScore > 0);
  let stage2State: StageState = 'not_started';
  let stage2Summary = 'AI assessment pending.';

  if (hasAi) {
    stage2State = 'complete';
    stage2Summary = `${(incident.aiAnalysis.confidenceScore * 100).toFixed(0)}% confidence • ${incident.aiAnalysis.detectedAnomaly}`;
  } else if (status === 'submitted') {
    stage2State = 'active';
    stage2Summary = 'Analyzing optical telemetry and depth profile...';
  }

  const stage2: StageInfo = {
    id: 'ai_assessment',
    order: 2,
    label: 'AI ASSESSMENT',
    shortLabel: '2. AI Scan',
    icon: Sparkles,
    state: stage2State,
    stateLabel: stage2State === 'complete' ? 'Assessed' : stage2State === 'active' ? 'Scanning' : 'Pending',
    summary: stage2Summary,
    timestamp: triageEvent?.timestamp || incident.reportedAt,
    actor: 'INFRANEX Core Vision AI',
    details: `Estimated repair cost: $${incident.aiAnalysis?.estimatedCostUsd || 0} • Est. Time: ~${incident.aiAnalysis?.estimatedRepairHours || 0}h`,
  };

  // 3. HUMAN VERIFICATION
  let stage3State: StageState = 'not_started';
  let stage3Summary = 'Awaiting municipal officer review.';

  if (status === 'closed' && (incident.description?.toLowerCase().includes('reject') || timeline.some(t => t.title.toLowerCase().includes('reject')))) {
    stage3State = 'failed';
    stage3Summary = 'Rejected by officer (invalid or duplicate report).';
  } else if (['assigned', 'in_progress', 'review', 'resolved', 'closed', 'archived'].includes(status)) {
    stage3State = 'complete';
    stage3Summary = 'Verified by civil inspection officer.';
  } else if (status === 'triage') {
    stage3State = 'waiting';
    stage3Summary = 'In inspection queue awaiting officer verification.';
  } else if (status === 'submitted') {
    stage3State = 'waiting';
    stage3Summary = 'Pending preliminary officer triage.';
  }

  const stage3: StageInfo = {
    id: 'verification',
    order: 3,
    label: 'VERIFICATION',
    shortLabel: '3. Verify',
    icon: ShieldCheck,
    state: stage3State,
    stateLabel: stage3State === 'complete' ? 'Verified' : stage3State === 'waiting' ? 'Awaiting Review' : stage3State === 'failed' ? 'Rejected' : 'Pending',
    summary: stage3Summary,
    timestamp: assignmentEvent?.timestamp || triageEvent?.timestamp,
    actor: 'Civil Inspection Officer',
    details: 'Human inspection verification is mandatory before work order dispatch.',
  };

  // 4. AUTHORITY ASSIGNMENT
  let stage4State: StageState = 'not_started';
  let stage4Summary = 'No authority or contractor dispatched.';

  if (incident.assignedTo || ['assigned', 'in_progress', 'review', 'resolved', 'closed', 'archived'].includes(status)) {
    stage4State = 'complete';
    stage4Summary = `Dispatched to ${incident.assignedTo?.company || incident.assignedTo?.name || 'Contractor'}.`;
  } else if (stage3State === 'complete' && !incident.assignedTo) {
    stage4State = 'waiting';
    stage4Summary = 'Awaiting contractor selection and work order dispatch.';
  }

  const stage4: StageInfo = {
    id: 'assignment',
    order: 4,
    label: 'ASSIGNMENT',
    shortLabel: '4. Assign',
    icon: HardHat,
    state: stage4State,
    stateLabel: stage4State === 'complete' ? 'Assigned' : stage4State === 'waiting' ? 'Awaiting Dispatch' : 'Not Started',
    summary: stage4Summary,
    timestamp: assignmentEvent?.timestamp,
    actor: 'Civil Dispatch Officer',
    details: incident.assignedTo ? `Prime Contractor: ${incident.assignedTo.name} (${incident.assignedTo.role})` : undefined,
  };

  // 5. REPAIR
  const isRepairSubmitted = Boolean(repairEvidencePhoto || workOrder?.status === 'repair_submitted' || ['review', 'resolved', 'closed', 'archived'].includes(status));
  const isRework = workOrder?.status === 'rework_required' || status === 'inspection_required';
  let stage5State: StageState = 'not_started';
  let stage5Summary = 'Awaiting contractor crew mobilization.';

  if (isRepairSubmitted) {
    stage5State = 'complete';
    stage5Summary = 'Civil repair executed on-site by contractor crew.';
  } else if (isRework) {
    stage5State = 'failed';
    stage5Summary = 'Rework required: previous repair did not meet municipal standards.';
  } else if (status === 'in_progress') {
    stage5State = 'active';
    stage5Summary = 'Contractor crew mobilized on-site; work in progress.';
  } else if (status === 'assigned') {
    stage5State = 'waiting';
    stage5Summary = 'Work order received; crew dispatching to location.';
  }

  const stage5: StageInfo = {
    id: 'repair',
    order: 5,
    label: 'REPAIR',
    shortLabel: '5. Repair',
    icon: Wrench,
    state: stage5State,
    stateLabel: stage5State === 'complete' ? 'Repaired' : stage5State === 'active' ? 'In Progress' : stage5State === 'failed' ? 'Rework Required' : stage5State === 'waiting' ? 'Mobilizing' : 'Not Started',
    summary: stage5Summary,
    timestamp: workOrder?.startedAt || assignmentEvent?.timestamp,
    actor: incident.assignedTo?.name || 'Assigned Prime Contractor',
    details: workOrder?.scopeOfWork || 'On-site physical infrastructure restoration.',
  };

  // 6. REPAIR EVIDENCE
  let stage6State: StageState = 'not_started';
  let stage6Summary = 'Awaiting post-repair photographic evidence.';

  if (repairEvidencePhoto || workOrder?.status === 'repair_submitted' || ['review', 'resolved', 'closed', 'archived'].includes(status)) {
    stage6State = 'complete';
    stage6Summary = 'Repaired image & material logs submitted for inspection.';
  } else if (stage5State === 'active') {
    stage6State = 'waiting';
    stage6Summary = 'Repair underway; post-repair photo submission pending.';
  }

  const stage6: StageInfo = {
    id: 'repair_evidence',
    order: 6,
    label: 'REPAIR EVIDENCE',
    shortLabel: '6. Evidence',
    icon: Camera,
    state: stage6State,
    stateLabel: stage6State === 'complete' ? 'Submitted' : stage6State === 'waiting' ? 'Awaiting Upload' : 'Not Started',
    summary: stage6Summary,
    timestamp: repairSubmitEvent?.timestamp || workOrder?.submittedAt,
    actor: incident.assignedTo?.name || 'Contractor Quality Lead',
    details: workOrder ? `Materials: ${workOrder.materialsUsed || 'Standard bitumen mix'} • Labor: ${workOrder.laborHours || 'On-site crew'}` : undefined,
    evidenceUrl: repairEvidencePhoto?.url,
  };

  // 7. CONFIRMATION (Officer Inspection + Citizen Confirmation)
  let stage7State: StageState = 'not_started';
  let stage7Summary = 'Pending repair completion.';

  const isDisputed = status === 'disputed' || disputeEvent !== undefined || citizenConfirmation?.response === 'disputed_unresolved';
  const isCitizenConfirmed = citizenConfirmation?.response === 'confirmed_fixed' || confirmationEvent !== undefined;

  if (isDisputed) {
    stage7State = 'failed';
    stage7Summary = `Citizen Dispute: Problem reported unresolved ("${citizenConfirmation?.notes || 'Defect remains visible'}").`;
  } else if (isCitizenConfirmed || status === 'closed' || status === 'archived') {
    stage7State = 'complete';
    stage7Summary = 'Officer verified & citizen confirmed issue resolved.';
  } else if (status === 'resolved') {
    stage7State = 'waiting';
    stage7Summary = 'Officer approved repair. "Has this problem been resolved?" prompt sent to citizen.';
  } else if (status === 'review') {
    stage7State = 'active';
    stage7Summary = 'Repair evidence under official engineering quality review.';
  }

  const stage7: StageInfo = {
    id: 'confirmation',
    order: 7,
    label: 'CONFIRMATION',
    shortLabel: '7. Confirm',
    icon: CheckCircle2,
    state: stage7State,
    stateLabel: stage7State === 'complete' ? 'Confirmed' : stage7State === 'active' ? 'Officer Review' : stage7State === 'waiting' ? 'Citizen Sign-Off' : stage7State === 'failed' ? 'Disputed' : 'Pending',
    summary: stage7Summary,
    timestamp: confirmationEvent?.timestamp || validationEvent?.timestamp || repairSubmitEvent?.timestamp,
    actor: isCitizenConfirmed ? 'Verified Citizen Reporter' : 'Municipal Field Officer',
    details: citizenConfirmation?.notes ? `Citizen Feedback: "${citizenConfirmation.notes}"` : repairValidation?.rationale ? `Officer Note: ${repairValidation.rationale}` : undefined,
  };

  // 8. CLOSURE
  let stage8State: StageState = 'not_started';
  let stage8Summary = 'Case remains active in municipal workflow.';

  if (status === 'closed' || status === 'archived') {
    if (stage3State === 'failed') {
      stage8State = 'failed';
      stage8Summary = 'Closed as rejected / out of scope.';
    } else {
      stage8State = 'complete';
      stage8Summary = 'Closed & verified in permanent municipal ledger.';
    }
  } else if (isDisputed) {
    stage8State = 'failed';
    stage8Summary = 'Closure blocked: Citizen dispute requires re-inspection.';
  } else if (status === 'resolved') {
    stage8State = 'waiting';
    stage8Summary = 'Awaiting citizen sign-off before permanent closure.';
  }

  const stage8: StageInfo = {
    id: 'closure',
    order: 8,
    label: 'CLOSURE',
    shortLabel: '8. Closed',
    icon: Archive,
    state: stage8State,
    stateLabel: stage8State === 'complete' ? 'Verified Closed' : stage8State === 'waiting' ? 'Pending Sign-Off' : stage8State === 'failed' ? 'Blocked / Reopened' : 'In Progress',
    summary: stage8Summary,
    timestamp: confirmationEvent?.timestamp,
    actor: 'Metropolitan Municipal Authority',
    details: 'Permanently logged with cryptographic tamper-evident SHA-256 audit entry.',
  };

  return [stage1, stage2, stage3, stage4, stage5, stage6, stage7, stage8];
};

export const IncidentLifecycleTracker: React.FC<IncidentLifecycleTrackerProps> = ({
  incident,
  interactive = true,
  onSelectStage,
  className = '',
  compact = false,
}) => {
  const stages = calculateLifecycleStages(incident);
  const [activeStageId, setActiveStageId] = useState<LifecycleStageId | null>(null);

  const selectedStage = stages.find((s) => s.id === activeStageId) || null;

  const handleStageClick = (stage: StageInfo) => {
    if (!interactive) return;
    setActiveStageId((prev) => (prev === stage.id ? null : stage.id));
    if (onSelectStage) {
      onSelectStage(stage);
    }
  };

  const getStateClasses = (state: StageState) => {
    switch (state) {
      case 'complete':
        return {
          pill: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25',
          circle: 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          text: 'text-emerald-400',
          line: 'bg-emerald-500',
        };
      case 'active':
        return {
          pill: 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/25 ring-1 ring-cyan-500/30',
          circle: 'bg-cyan-400 text-slate-950 animate-pulse shadow-sm shadow-cyan-400/50',
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
          text: 'text-cyan-400',
          line: 'bg-cyan-400',
        };
      case 'waiting':
        return {
          pill: 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25',
          circle: 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/50',
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          text: 'text-amber-400',
          line: 'bg-amber-400',
        };
      case 'failed':
        return {
          pill: 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25',
          circle: 'bg-rose-500 text-white shadow-sm shadow-rose-500/50',
          badge: 'bg-rose-950 text-rose-300 border-rose-800',
          text: 'text-rose-400',
          line: 'bg-rose-500',
        };
      case 'not_started':
      default:
        return {
          pill: 'bg-slate-900/60 border-slate-800 text-slate-500 hover:bg-slate-850 hover:text-slate-400',
          circle: 'bg-slate-800 text-slate-500 border border-slate-700',
          badge: 'bg-slate-900 text-slate-500 border-slate-800',
          text: 'text-slate-500',
          line: 'bg-slate-800',
        };
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header bar indicating authoritative 8-stage lifecycle */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
            Authoritative Incident Lifecycle (8 Stages)
          </span>
          <span className="hidden sm:inline text-slate-500 font-mono text-[10px]">
            • Case #{incident.id}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Complete
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Waiting
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Disputed/Failed
          </span>
        </div>
      </div>

      {/* DESKTOP 8-COLUMN GRID TRACKER */}
      <div className="hidden lg:grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
        {stages.map((stage, idx) => {
          const classes = getStateClasses(stage.state);
          const Icon = stage.icon;
          const isSelected = activeStageId === stage.id;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => handleStageClick(stage)}
              className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                classes.pill
              } ${isSelected ? 'ring-2 ring-cyan-400 scale-[1.02] bg-slate-900 shadow-lg' : ''}`}
              title={`${stage.label}: ${stage.stateLabel} - Click to inspect stage audit details`}
            >
              {/* Top step badge & icon */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${classes.circle}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide truncate w-full text-slate-200">
                  {stage.shortLabel}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="mt-2 w-full">
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border block truncate ${classes.badge}`}
                >
                  {stage.stateLabel}
                </span>
              </div>

              {/* Selection indicator arrow */}
              {isSelected && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* MOBILE / TABLET RESPONSIVE HORIZONTAL SCROLL OR STACK */}
      <div className="lg:hidden overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex items-center gap-2 min-w-[760px] p-2 rounded-2xl bg-slate-950/80 border border-slate-800">
          {stages.map((stage) => {
            const classes = getStateClasses(stage.state);
            const Icon = stage.icon;
            const isSelected = activeStageId === stage.id;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageClick(stage)}
                className={`flex-1 min-w-[85px] p-2 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                  classes.pill
                } ${isSelected ? 'ring-2 ring-cyan-400 bg-slate-900' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${classes.circle}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className="text-[9px] font-bold uppercase mt-1 text-slate-200 truncate w-full">
                  {stage.shortLabel}
                </span>
                <span className={`text-[8px] font-bold uppercase px-1 py-0.2 rounded mt-1 border ${classes.badge}`}>
                  {stage.stateLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE STAGE DETAIL DRAWER (When a stage is selected) */}
      {selectedStage && (
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-800/60 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  getStateClasses(selectedStage.state).circle
                }`}
              >
                <selectedStage.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    Stage {selectedStage.order} / 8: {selectedStage.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      getStateClasses(selectedStage.state).badge
                    }`}
                  >
                    {selectedStage.stateLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium mt-0.5">{selectedStage.summary}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveStageId(null)}
              className="text-xs text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-xs">
            {selectedStage.timestamp && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">
                  {new Date(selectedStage.timestamp).toLocaleString()}
                </span>
              </div>
            )}
            {selectedStage.actor && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{selectedStage.actor}</span>
              </div>
            )}
            {selectedStage.details && (
              <div className="sm:col-span-3 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                {selectedStage.details}
              </div>
            )}
          </div>

          {selectedStage.evidenceUrl && (
            <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
              <img
                src={selectedStage.evidenceUrl}
                alt="Stage Evidence"
                className="w-16 h-12 object-cover rounded-lg border border-slate-700"
              />
              <div className="text-xs text-slate-400">
                <span className="font-bold text-slate-300 block">Photographic Stage Evidence</span>
                {selectedStage.id === 'detection' ? 'Original live-capture report photograph.' : 'Post-repair verified image.'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
