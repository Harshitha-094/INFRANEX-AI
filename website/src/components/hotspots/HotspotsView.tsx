import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Hotspot } from '../../types';
import { HotspotDetailModal } from './HotspotDetailModal';
import {
  Flame,
  ShieldAlert,
  RotateCw,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Eye,
  TrendingUp,
  Sparkles,
  Info
} from 'lucide-react';
import { FadeContent } from '../animations/FadeContent';
import { ScrollCharacterReveal } from '../animations/ScrollCharacterReveal';

export const HotspotsView: React.FC = () => {
  const { hotspots, dumpingEvents, incidents, recalculateHotspot } = useApp();
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [filterRecurrence, setFilterRecurrence] = useState<string>('all');
  const [filterWard, setFilterWard] = useState<string>('all');

  const filteredHotspots = hotspots.filter((h) => {
    if (filterRecurrence !== 'all' && h.recurrenceLevel !== filterRecurrence) return false;
    if (filterWard !== 'all' && h.location.ward !== filterWard) return false;
    return true;
  });

  const highCount = hotspots.filter((h) => h.recurrenceLevel === 'high').length;
  const mediumCount = hotspots.filter((h) => h.recurrenceLevel === 'medium').length;
  const totalCleanups = hotspots.reduce((sum, h) => sum + h.cleanupCount, 0);
  const totalConfirmedDumpings = dumpingEvents.filter((e) => e.status === 'confirmed').length;

  const wards = Array.from(new Set(hotspots.map((h) => h.location.ward)));

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <FadeContent effect="mist" duration={1.1} ease="power2.out" trigger="mount">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Flame className="w-5 h-5" />
              </div>
              <ScrollCharacterReveal
                text="Civic Hotspot & Recurrence Intelligence"
                highlightText="Recurrence Intelligence"
                as="h1"
                className="text-xl font-bold text-white tracking-wide font-mono"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Dynamic History
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Correlates verified unauthorized dumping events, chronic waste accumulation thresholds, and post-cleanup operations to dynamically compute localized civic recurrence scores and preventive recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => hotspots.forEach((h) => recalculateHotspot(h.id))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition-all shadow-sm cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recalculate All Sites</span>
            </button>
          </div>
        </div>
      </FadeContent>

      {/* Summary Stat Cards */}
      <FadeContent
        effect="mist"
        duration={1.2}
        ease="power2.out"
        stagger={0.08}
        trigger="mount"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>High Recurrence Sites</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">{highCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Requires official review & enhanced clearing</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Moderate Sites</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">{mediumCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Bi-weekly clearing & RWA outreach</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Confirmed Dumpings</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">{totalConfirmedDumpings}</div>
          <div className="text-[11px] text-slate-500 mt-1">Human-verified event history</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Cleanups Executed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">{totalCleanups}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified work orders completed</div>
        </div>
      </FadeContent>

      {/* Recurrence Formula & Transparency Callout */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-200">
            Dynamic Recurrence Formula (Transparent & Auditable):
          </div>
          <div>
            <code className="text-cyan-300 font-mono text-[11px]">Recurrence Score = (1.5 × Confirmed Dumpings) + (1.0 × Waste Incidents) - (0.8 × Completed Cleanups)</code>.
            Score &ge; 4.0 &rarr; <span className="text-rose-400 font-semibold">HIGH</span>, &ge; 2.0 &rarr; <span className="text-amber-400 font-semibold">MEDIUM</span>, &lt; 2.0 &rarr; <span className="text-emerald-400 font-semibold">LOW</span>.
            Cleanups decrement risk but preserve permanent infrastructure history.
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Filter Sites:</span>

          <select
            value={filterRecurrence}
            onChange={(e) => setFilterRecurrence(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Recurrence Levels</option>
            <option value="high">High Recurrence Only</option>
            <option value="medium">Medium Recurrence</option>
            <option value="low">Low Recurrence</option>
          </select>

          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Bengaluru Wards</option>
            {wards.map((w) => (
              <option key={w} value={w}>
                Ward: {w}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredHotspots.length} of {hotspots.length} mapped civic hotspots
        </div>
      </div>

      {/* Hotspots Card Grid */}
      <FadeContent
        effect="mist"
        duration={1.2}
        ease="power2.out"
        stagger={0.08}
        trigger="scroll"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredHotspots.map((hotspot) => {
          const badgeClass =
            hotspot.recurrenceLevel === 'high'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : hotspot.recurrenceLevel === 'medium'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

          return (
            <div
              key={hotspot.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {hotspot.id}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {hotspot.name}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {hotspot.recurrenceLevel} Recurrence
                  </span>
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{hotspot.location.address}</span>
                </p>

                {/* Score and metrics mini-grid */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">Score</div>
                    <div className="text-sm font-bold text-cyan-400 font-mono">
                      {hotspot.recurrenceScore.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">Dumpings</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">
                      {hotspot.dumpingEventIds.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">Cleanups</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      {hotspot.cleanupCount}
                    </div>
                  </div>
                </div>

                {/* Preventive Recommendation */}
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-cyan-400" /> Recommendation
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                    {hotspot.preventiveRecommendation}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">
                  Unresolved: {hotspot.unresolvedAccumulationEstM3} m³
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => recalculateHotspot(hotspot.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    title="Recalculate metrics"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedHotspot(hotspot)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </FadeContent>

      {/* Hotspot Detail Modal */}
      {selectedHotspot && (
        <HotspotDetailModal
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
        />
      )}
    </div>
  );
};
