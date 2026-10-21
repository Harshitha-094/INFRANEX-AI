import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InfrastructureMap } from '../map/InfrastructureMap';
import { Incident, IssueCategory } from '../../types';
import {
  AlertCircle,
  Clock,
  Activity,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Calendar,
  Server,
  Cpu,
  Video,
  Building2,
  ShieldCheck,
  Info
} from 'lucide-react';
import { FadeContent } from '../animations/FadeContent';
import { ScrollCharacterReveal } from '../animations/ScrollCharacterReveal';
import { AnimatedCounter } from '../animations/AnimatedCounter';

export const OverviewDashboard: React.FC = () => {
  const { incidents, metrics, workOrders, isBackendConnected, setSelectedIncident, setActiveTab, role } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedCategory !== 'all' && inc.category !== selectedCategory) return false;
    return true;
  });

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All Hazards', icon: '🌐' },
    { id: 'roads', label: 'Roads & Bridges', icon: '🚧' },
    { id: 'water', label: 'Water Mains', icon: '💧' },
    { id: 'electrical', label: 'Electrical Grid', icon: '⚡' },
    { id: 'lighting', label: 'Street Lighting', icon: '💡' },
    { id: 'drainage', label: 'Storm Drainage', icon: '🌊' },
    { id: 'structural', label: 'Structural Overpasses', icon: '🏗️' },
  ];

  const criticalIncidents = incidents.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed'
  );

  const closedIncidents = incidents.filter(
    (i) => i.status === 'resolved' || i.status === 'closed'
  );

  const activeWorkOrdersList = (workOrders || []).filter(
    (w) => w.status === 'dispatched' || w.status === 'in_progress' || w.status === 'repair_submitted'
  );
  const activeWorkOrdersCount = activeWorkOrdersList.length;

  // Calculate real MTTR if completed lifecycle records exist in current incident timelines
  const resolvedDurations = closedIncidents
    .map((inc) => {
      const reportTime = new Date(inc.reportedAt).getTime();
      const resolveEntry = inc.timeline
        ?.slice()
        .reverse()
        .find(
          (t) =>
            t.title.toLowerCase().includes('resolved') ||
            t.title.toLowerCase().includes('validated') ||
            t.description.toLowerCase().includes('resolved')
        );
      const resolveTime = resolveEntry ? new Date(resolveEntry.timestamp).getTime() : 0;
      if (resolveTime > reportTime) {
        return (resolveTime - reportTime) / (1000 * 3600);
      }
      return null;
    })
    .filter((d): d is number => d !== null && !isNaN(d) && d > 0);

  const calculatedMttr =
    resolvedDurations.length > 0
      ? +(resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <FadeContent
        effect="fade"
        duration={0.35}
        ease="power2.out"
        threshold={0.1}
        trigger="mount"
      >
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl relative overflow-hidden space-y-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-cyan-300 border border-cyan-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Municipal Civic Platform
                </span>
                <span className="text-xs text-slate-400">Bengaluru Metropolitan Operations • BBMP Service Boundary</span>
              </div>
              <ScrollCharacterReveal
                text="INFRANEX Operations Control"
                highlightText="Operations Control"
                as="h1"
                className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              />
              <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                AI-assisted civic infrastructure monitoring, incident verification, and accountable repair management.
              </p>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              {role === 'citizen' && (
                <button
                  onClick={() => setActiveTab('report')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                >
                  Capture Live Report
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setActiveTab('cases')}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 active:scale-95"
              >
                Open Case Board
              </button>
            </div>
          </div>

          {/* Operational Readiness Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-4 border-t border-slate-800/80 relative z-10 text-xs">
            {/* Status 1: Backend API */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                <Server className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Backend API</span>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${isBackendConnected ? 'text-emerald-300' : 'text-amber-300'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'}`}></span>
                  {isBackendConnected ? 'Connected (FastAPI v1.0)' : 'Offline / Standalone'}
                </span>
              </div>
            </div>

            {/* Status 2: AI Model Availability */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">AI Inference</span>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5" title="Neural model weights unconfigured; rule-based triage active">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Heuristic (Weights Unconfigured)
                </span>
              </div>
            </div>

            {/* Status 3: Camera Feed Availability */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-purple-400">
                <Video className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Camera Feeds</span>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5" title="Simulated prototype feeds; live municipal CCTV not configured">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  Simulated Feeds (CCTV Offline)
                </span>
              </div>
            </div>

            {/* Status 4: Government Integration */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Govt Integration</span>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5" title="Sandbox adapter active; production BBMP Sahaya not configured">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Sandbox (Live BBMP Unconfigured)
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeContent>

      {/* KPI Stat Cards */}
      <FadeContent
        effect="fade"
        duration={0.35}
        ease="power2.out"
        stagger={0.06}
        threshold={0.1}
        trigger="mount"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Active Work Orders */}
        <div className="macos-card p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/30 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Work Orders</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-800/60 shadow-sm shadow-cyan-900/30">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                <AnimatedCounter value={activeWorkOrdersCount} />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                {(workOrders || []).length} Total
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60">
            <p className="text-xs text-slate-400">
              Dispatched to contractors • <span className="text-slate-500 font-mono">Current Application Store</span>
            </p>
          </div>
        </div>

        {/* Card 2: Critical Incidents */}
        <div className="macos-card p-5 rounded-2xl bg-slate-900/80 border border-rose-900/40 backdrop-blur-xl shadow-lg shadow-black/30 hover:border-rose-700/60 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-rose-300">Critical Incidents</span>
              <div className="w-8 h-8 rounded-lg bg-rose-950/80 text-rose-400 flex items-center justify-center border border-rose-800/60 animate-pulse shadow-sm shadow-rose-900/40">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-400 font-mono">
                <AnimatedCounter value={criticalIncidents.length} />
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                Immediate SLA
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60">
            <p className="text-xs text-slate-400">
              Unresolved severe hazards • <span className="text-slate-500 font-mono">{incidents.length} total in registry</span>
            </p>
          </div>
        </div>

        {/* Card 3: Avg Resolution Time (MTTR) */}
        <div className="macos-card p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/30 hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Resolution (MTTR)</span>
              <div className="w-8 h-8 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center border border-amber-800/60 shadow-sm shadow-amber-900/30">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              {calculatedMttr !== null ? (
                <>
                  <span className="text-3xl font-extrabold text-white font-mono">
                    <AnimatedCounter value={calculatedMttr} decimals={1} suffix="h" />
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    Live Calc
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-extrabold text-white font-mono">
                    <AnimatedCounter value={metrics.mttrHours} decimals={1} suffix="h" />
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-mono">
                    Demo Baseline
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60">
            <p className="text-xs text-slate-400">
              {calculatedMttr !== null
                ? `Averaged across ${resolvedDurations.length} closed cases`
                : 'Seeded baseline (Insufficient completed lifecycle cycles)'}
            </p>
          </div>
        </div>

        {/* Card 4: Infrastructure Health & Closed Incidents */}
        <div className="macos-card p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/30 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Infrastructure Health</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-800/60 shadow-sm shadow-emerald-900/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                <AnimatedCounter value={metrics.healthIndexScore} suffix="/100" />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                Demo Index
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60">
            <p className="text-xs text-slate-400">
              <strong className="text-white font-mono">{closedIncidents.length}</strong> incidents closed in database • Target: 80+
            </p>
          </div>
        </div>
      </FadeContent>

      {/* Main Map & Incident Filter Section */}
      <FadeContent
        effect="fade"
        duration={0.35}
        ease="power2.out"
        threshold={0.1}
        trigger="scroll"
      >
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Geospatial Incident Intelligence Map
              </h2>
              <p className="text-xs text-slate-400">
                OpenStreetMap spatial GIS layers • Verified citizen reports & baseline civic records
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                    selectedCategory === c.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet Map */}
          <InfrastructureMap
            incidents={filteredIncidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            height="520px"
          />

          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/60">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-semibold text-slate-300">Severity Pins:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse"></span>
                Critical / Emergency
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                High Priority
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                Medium
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Low / Scheduled
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-400">
              {filteredIncidents.length} pinned records (Citizen & Seeded Data • Live CCTV Not Configured)
            </div>
          </div>
        </div>
      </FadeContent>

      {/* Two Column Grid: Critical Alerts Feed & Category Analytics */}
      <FadeContent
        effect="mist"
        duration={1.2}
        ease="power2.out"
        stagger={0.15}
        threshold={0.1}
        trigger="scroll"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Column: Recent Active Incidents */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Incident Stream
            </h3>
            <button
              onClick={() => setActiveTab('cases')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View All Cases →
            </button>
          </div>

          <div className="space-y-3">
            {incidents.slice(0, 4).map((inc) => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all duration-200 active:scale-[0.99] hover:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border text-base ${
                      inc.severity === 'critical'
                        ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                        : inc.severity === 'high'
                        ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                        : 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
                    }`}
                  >
                    {inc.category === 'roads'
                      ? '🚧'
                      : inc.category === 'water'
                      ? '💧'
                      : inc.category === 'electrical'
                      ? '⚡'
                      : inc.category === 'lighting'
                      ? '💡'
                      : inc.category === 'drainage'
                      ? '🌊'
                      : '🏗️'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyan-400 font-bold">{inc.id}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          inc.severity === 'critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span className="text-[10px] uppercase font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {inc.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {inc.title}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {inc.location.address}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto text-xs">
                  <span className="text-cyan-400 font-mono font-semibold">
                    Est. ${(inc.aiAnalysis.estimatedCostUsd).toLocaleString()}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1 text-[11px] mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(inc.reportedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Triage & Telemetry Transparency */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                AI Triage Engine Status
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Heuristic Provider
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Model Weight Status</span>
                <span className="text-amber-400 font-mono">Unconfigured (Demo Mode)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400/70 h-full rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Triage operates via rule-based severity rubrics and metadata heuristics. Local edge neural weights (<code className="text-cyan-300 text-[10px]">AI_MODEL_WEIGHTS_PATH</code>) are unconfigured.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-400 uppercase tracking-wider">
                  Baseline Incident Distribution
                </span>
                <span className="text-[10px] font-mono text-slate-500">Seeded Dataset</span>
              </div>
              {[
                { name: 'Roadways & Pavements', count: 48, pct: 34, color: 'bg-amber-400' },
                { name: 'Water & Sewer Conduits', count: 32, pct: 22, color: 'bg-cyan-400' },
                { name: 'Electrical & Power Vaults', count: 24, pct: 17, color: 'bg-purple-400' },
                { name: 'Bridges & Elevated Viaducts', count: 18, pct: 13, color: 'bg-rose-400' },
                { name: 'Street Illumination', count: 20, pct: 14, color: 'bg-emerald-400' },
              ].map((domain) => (
                <div key={domain.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{domain.name}</span>
                    <span className="text-slate-400 font-mono">{domain.count} ({domain.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`${domain.color} h-full rounded-full`} style={{ width: `${domain.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300">
            <span className="font-semibold text-cyan-300 block mb-1">Human-in-the-Loop Safeguard:</span>
            Severe hazards alert the Officer Verification Queue for authorized manual contractor dispatch. Autonomous dispatch without human validation is disabled by municipal policy.
          </div>
        </div>
      </FadeContent>
    </div>
  );
};
