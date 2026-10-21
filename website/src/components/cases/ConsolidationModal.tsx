import React, { useState } from 'react';
import { Incident } from '../../types';
import { useApp } from '../../context/AppContext';
import { findDuplicateCandidates } from '../../services/consolidationService';
import {
  X,
  Layers,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';

interface ConsolidationModalProps {
  primaryIncident: Incident;
  onClose: () => void;
}

export const ConsolidationModal: React.FC<ConsolidationModalProps> = ({ primaryIncident, onClose }) => {
  const { incidents, consolidateDuplicateIncidents, thresholds } = useApp();

  const radiusConfig = thresholds.find((t) => t.key === 'DUPLICATE_SEARCH_RADIUS_METERS')?.value || 60;
  const candidates = findDuplicateCandidates(primaryIncident, incidents, radiusConfig);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rationale, setRationale] = useState<string>(
    'Multiple commuter reports confirming the exact same defect location and physical dimensions.'
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleConsolidate = () => {
    if (selectedIds.length === 0) return;
    consolidateDuplicateIncidents(primaryIncident.id, selectedIds, rationale);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">Consolidate Duplicate Reports</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Merge duplicate records under Master Ticket <span className="font-mono text-cyan-400">#{primaryIncident.id}</span>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Transparency / Non-destructive Guarantee Notice */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-3 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-cyan-300">Evidence Preservation Guarantee:</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Consolidation does not delete or truncate reports. All original photographs, citizen timestamps, and location metadata are preserved under the primary actionable master ticket to avoid redundant contractor dispatching.
              </p>
            </div>
          </div>

          {/* Master Incident Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Primary Master Incident
              </span>
              <span className="text-xs font-mono font-bold text-white">#{primaryIncident.id}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-100">{primaryIncident.title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {primaryIncident.location.address} ({primaryIncident.location.ward})
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {new Date(primaryIncident.reportedAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Spatial Match Candidates List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Candidate Duplicates Found (within {radiusConfig}m radius)
              </h4>
              <span className="text-xs font-mono text-slate-400">{candidates.length} candidate(s)</span>
            </div>

            {candidates.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center space-y-1">
                <p className="text-xs text-slate-400">No spatial duplicate candidates found within {radiusConfig} meters.</p>
                <p className="text-[11px] text-slate-500">Other active incidents are either too far away or belong to different physical assets.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.map((cand) => {
                  const isChecked = selectedIds.includes(cand.candidateIncidentId);
                  const candidateInc = incidents.find((i) => i.id === cand.candidateIncidentId);

                  return (
                    <div
                      key={cand.candidateIncidentId}
                      onClick={() => toggleSelect(cand.candidateIncidentId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isChecked
                          ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-900/20'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-cyan-500"
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-white">
                            #{cand.candidateIncidentId}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {cand.distanceMeters}m away
                            </span>
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                              {Math.round(cand.confidenceScore * 100)}% match
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 font-medium">
                          {candidateInc?.title || 'Civic Incident'}
                        </p>
                        <p className="text-[11px] text-slate-400">{cand.matchReason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rationale Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Authorized Consolidation Decision Rationale:
            </label>
            <textarea
              rows={2}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="Explain why these reports represent the exact same physical hazard..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs text-slate-400">
            Selected: <span className="font-bold text-white">{selectedIds.length}</span> duplicate report(s)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConsolidate}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              Confirm Consolidation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
