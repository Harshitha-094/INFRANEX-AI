import React from 'react';
import { InfrastructureAsset } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RotateCw,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface InfrastructureHistoryModalProps {
  asset: InfrastructureAsset;
  onClose: () => void;
}

export const InfrastructureHistoryModal: React.FC<InfrastructureHistoryModalProps> = ({
  asset,
  onClose,
}) => {
  const { incidents, setSelectedIncident } = useApp();

  const linkedIncidents = incidents.filter(
    (i) => i.infrastructureAssetId === asset.id || asset.linkedIncidentIds.includes(i.id)
  );

  const recurrenceClass =
    asset.recurrenceLevel === 'high'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : asset.recurrenceLevel === 'medium'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  {asset.id}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${recurrenceClass}`}>
                  {asset.recurrenceLevel} Failure Recurrence
                </span>
              </div>
              <h2 className="text-base font-bold text-white font-mono mt-0.5">{asset.name}</h2>
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
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Asset Type</div>
              <div className="text-xs font-bold text-white uppercase mt-1">
                {asset.type.replace('_', ' ')}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Historical Failures</div>
              <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
                {asset.damageHistoryCount} cycle(s)
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Completed Repairs</div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                {asset.repairHistoryCount} repair(s)
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Last Repaired</div>
              <div className="text-xs font-mono text-slate-300 mt-1">
                {asset.lastRepairedAt ? new Date(asset.lastRepairedAt).toLocaleDateString() : 'Active/Open'}
              </div>
            </div>
          </div>

          {/* Location & Ward */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{asset.location.address} (Ward: <strong>{asset.location.ward}</strong>)</span>
            </div>
            <span className="font-mono text-slate-500">
              {asset.location.lat.toFixed(5)}, {asset.location.lng.toFixed(5)}
            </span>
          </div>

          {/* Preventive Engineering Recommendation */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-cyan-800/40 space-y-1.5">
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Structural Maintenance & Life-Cycle Recommendation
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {asset.maintenanceRecommendation}
            </p>
          </div>

          {/* Linked Incidents Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Lifecycle Defect History on this Asset ({linkedIncidents.length})
            </h3>

            {linkedIncidents.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No active defect reports linked to this asset ID.
              </div>
            ) : (
              <div className="space-y-2">
                {linkedIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncident(inc);
                      onClose();
                    }}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">#{inc.id}</span>
                        <span className="text-xs font-semibold text-white">{inc.title}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                          {inc.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>Status: <strong className="text-cyan-400 uppercase">{inc.status}</strong></span>
                        <span>Severity: <strong className="text-rose-400 uppercase">{inc.severity}</strong></span>
                        <span>Reported: {new Date(inc.reportedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit History */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Asset Modification & Repair Audit Trail
            </h4>
            <div className="space-y-1.5">
              {asset.auditTrail.map((at, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{at.event}</span>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>{at.actor}</span>
                    <span>•</span>
                    <span>{new Date(at.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Digital Infrastructure Asset Ledger • INFRANEX AI</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
