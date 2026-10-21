import React, { useState, useEffect } from 'react';
import { Hotspot } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Flame,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RotateCw
} from 'lucide-react';

interface HotspotDetailModalProps {
  hotspot: Hotspot;
  onClose: () => void;
}

export const HotspotDetailModal: React.FC<HotspotDetailModalProps> = ({ hotspot, onClose }) => {
  const { dumpingEvents, incidents, warningRecords, recalculateHotspot, setSelectedIncident } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await recalculateHotspot(hotspot.id);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const linkedEvents = dumpingEvents.filter(
    (e) => e.location.ward === hotspot.location.ward || hotspot.dumpingEventIds.includes(e.id)
  );

  const linkedIncidents = incidents.filter(
    (inc) => inc.location.ward === hotspot.location.ward && inc.category === 'waste'
  );

  const wardWarnings = warningRecords.filter((w) => w.ward === hotspot.location.ward);

  const recurrenceBadgeColor =
    hotspot.recurrenceLevel === 'high'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : hotspot.recurrenceLevel === 'medium'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">{hotspot.name}</h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${recurrenceBadgeColor}`}>
                  {hotspot.recurrenceLevel} Recurrence
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {hotspot.location.address} • Ward: <span className="font-semibold text-slate-300">{hotspot.location.ward}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50"
              title="Recalculate dynamic recurrence score from live records"
            >
              <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Recurrence Score</div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{hotspot.recurrenceScore.toFixed(1)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Formula: 1.5×Dump + 1.0×Inc - 0.8×Clean</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Confirmed Dumpings</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">{linkedEvents.filter(e => e.status === 'confirmed').length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{linkedEvents.length} total logged events</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Cleanup Ops Completed</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{hotspot.cleanupCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Verified municipal cleanups</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Unresolved Debris</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">{hotspot.unresolvedAccumulationEstM3} m³</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Estimated on-site volume</div>
            </div>
          </div>

          {/* Recurrence Explanation & Preventive Recommendations */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-cyan-800/40 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Automated Behaviour Recurrence Analysis & Recommendation
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {hotspot.preventiveRecommendation}
            </p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
              <span>Coordinates: {hotspot.location.lat.toFixed(4)}, {hotspot.location.lng.toFixed(4)} (Radius: {hotspot.radiusMeters}m)</span>
              <span>Last Event: {hotspot.lastEventAt ? new Date(hotspot.lastEventAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          {/* Warning History */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              3-Stage Warning & Authority Escalation History
            </h3>
            {wardWarnings.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No formal warnings recorded yet for this location.
              </div>
            ) : (
              <div className="space-y-2">
                {wardWarnings.map((warn) => (
                  <div key={warn.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          warn.stage === 3
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : warn.stage === 2
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}>
                          Warning Stage {warn.stage} of 3
                        </span>
                        <span className="text-xs font-mono text-slate-300">{warn.id}</span>
                        <span className="text-[11px] text-slate-500">Issued by {warn.issuedBy}</span>
                      </div>
                      <p className="text-xs text-slate-300">{warn.authorityAction}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(warn.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Dumping Events */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Associated Dumping Events & Evidence Stream
            </h3>
            {linkedEvents.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No specific dumping events associated with this hotspot.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedEvents.map((evt) => (
                  <div key={evt.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
                    <img
                      src={evt.evidenceUrl}
                      alt={`Event ${evt.id}`}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">{evt.id}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          evt.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' : evt.status === 'rejected' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {evt.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{evt.location.address}</p>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Coverage: {evt.coveragePercentage || 15}%</span>
                        <span>{new Date(evt.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Waste Incidents */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Associated Municipal Waste Tickets ({linkedIncidents.length})
            </h3>
            {linkedIncidents.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No municipal waste tickets logged in this ward.
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
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-cyan-300">{inc.id}</span>
                        <span className="text-xs text-white font-medium">{inc.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{inc.location.address} • Status: <span className="text-cyan-400 uppercase font-semibold">{inc.status}</span></p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
