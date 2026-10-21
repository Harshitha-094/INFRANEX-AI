import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Incident, IssueStatus, IssueSeverity, IssueCategory } from '../../types';
import {
  FolderKanban,
  Table as TableIcon,
  Search,
  Filter,
  Eye,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  HardHat,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Camera,
  Archive,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { FadeContent } from '../animations/FadeContent';
import { ScrollCharacterReveal } from '../animations/ScrollCharacterReveal';
import { calculateLifecycleStages } from './IncidentLifecycleTracker';

export const CaseManagementView: React.FC = () => {
  const {
    incidents,
    selectedIncident,
    setSelectedIncident,
    filterCategory,
    setFilterCategory,
    filterSeverity,
    setFilterSeverity,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const filtered = incidents.filter((inc) => {
    if (filterCategory !== 'all' && inc.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && inc.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = inc.id.toLowerCase().includes(q);
      const matchTitle = inc.title.toLowerCase().includes(q);
      const matchDesc = inc.description.toLowerCase().includes(q);
      const matchAddr = inc.location.address.toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchDesc && !matchAddr) return false;
    }
    return true;
  });

  // Canonical Kanban Columns corresponding to authoritative workflow stages
  const kanbanColumns: { id: IssueStatus; label: string; sublabel: string; color: string; badgeColor: string }[] = [
    {
      id: 'submitted',
      label: '1. Detected',
      sublabel: 'Ingestion & Citizen Camera',
      color: 'border-slate-700 bg-slate-900/90',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'triage',
      label: '2. Triage & Verify',
      sublabel: 'AI Scan & Officer Review',
      color: 'border-cyan-800/80 bg-slate-900/90',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    },
    {
      id: 'assigned',
      label: '3. Assigned',
      sublabel: 'Work Order Dispatched',
      color: 'border-blue-800/80 bg-slate-900/90',
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
    },
    {
      id: 'in_progress',
      label: '4. Repair Active',
      sublabel: 'On-Site Contractor Crew',
      color: 'border-amber-800/80 bg-slate-900/90',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      id: 'review',
      label: '5. Repair Submitted',
      sublabel: 'Awaiting Officer Inspection',
      color: 'border-purple-800/80 bg-slate-900/90',
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    },
    {
      id: 'resolved',
      label: '6. Citizen Sign-Off',
      sublabel: 'Awaiting Confirmation',
      color: 'border-teal-800/80 bg-slate-900/90',
      badgeColor: 'bg-teal-950 text-teal-300 border-teal-800',
    },
    {
      id: 'closed',
      label: '7. Closed — Verified',
      sublabel: 'Permanent Civic Archive',
      color: 'border-emerald-800/80 bg-slate-900/90',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
  ];

  // Global counts across 8 lifecycle stages for the top alignment tracker
  const stageCounts = {
    detection: incidents.length,
    ai_assessment: incidents.filter((i) => i.aiAnalysis && i.aiAnalysis.confidenceScore > 0).length,
    verification: incidents.filter((i) => ['assigned', 'in_progress', 'review', 'resolved', 'closed', 'archived'].includes(i.status)).length,
    assignment: incidents.filter((i) => i.assignedTo || ['assigned', 'in_progress', 'review', 'resolved', 'closed', 'archived'].includes(i.status)).length,
    repair: incidents.filter((i) => ['in_progress', 'review', 'resolved', 'closed', 'archived'].includes(i.status)).length,
    repair_evidence: incidents.filter((i) => i.images?.some((img) => img.isAfterRepair) || ['review', 'resolved', 'closed', 'archived'].includes(i.status)).length,
    confirmation: incidents.filter((i) => i.status === 'resolved' || i.citizenConfirmation || i.status === 'closed' || i.status === 'archived').length,
    closure: incidents.filter((i) => i.status === 'closed' || i.status === 'archived').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Toolbar */}
      <FadeContent effect="mist" duration={1.1} ease="power2.out" trigger="mount">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <FolderKanban className="w-4 h-4" />
                Civic Operations & Lifecycle Dispatch
              </div>
              <ScrollCharacterReveal
                text="Case Management Master Board"
                highlightText="Master Board"
                as="h1"
                className="text-2xl font-extrabold text-white"
              />
              <p className="text-xs text-slate-400 mt-1">
                Showing {filtered.length} of {incidents.length} recorded incidents across municipal zones with unified 8-stage verification tracking.
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                  viewMode === 'table' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" /> Table Grid
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" /> Lifecycle Kanban
              </button>
            </div>
          </div>

          {/* TOP 8-STAGE LIFECYCLE SUMMARY GRID (Fixed Width, Perfectly Aligned) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Authoritative Workflow Lifecycle Summary</span>
              <span className="font-mono text-cyan-400">{incidents.length} Active Records Across Zones</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { label: '1. Detection', count: stageCounts.detection, color: 'text-emerald-400', border: 'border-emerald-800/60' },
                { label: '2. AI Scan', count: stageCounts.ai_assessment, color: 'text-cyan-400', border: 'border-cyan-800/60' },
                { label: '3. Verified', count: stageCounts.verification, color: 'text-blue-400', border: 'border-blue-800/60' },
                { label: '4. Assigned', count: stageCounts.assignment, color: 'text-indigo-400', border: 'border-indigo-800/60' },
                { label: '5. Repair', count: stageCounts.repair, color: 'text-amber-400', border: 'border-amber-800/60' },
                { label: '6. Evidence', count: stageCounts.repair_evidence, color: 'text-purple-400', border: 'border-purple-800/60' },
                { label: '7. Confirm', count: stageCounts.confirmation, color: 'text-teal-400', border: 'border-teal-800/60' },
                { label: '8. Closed', count: stageCounts.closure, color: 'text-emerald-400', border: 'border-emerald-800/60' },
              ].map((stage, sIdx) => (
                <div
                  key={sIdx}
                  className={`p-2.5 rounded-xl bg-slate-900/90 border ${stage.border} flex flex-col justify-between`}
                >
                  <span className="text-[10px] uppercase font-semibold text-slate-400 truncate">
                    {stage.label}
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-lg font-mono font-extrabold ${stage.color}`}>
                      {stage.count}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {Math.round((stage.count / (incidents.length || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="p-4 rounded-xl bg-slate-900/95 border border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search cases by ID, address, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Domains</option>
                <option value="roads">Roads & Pavement</option>
                <option value="water">Water & Hydrology</option>
                <option value="electrical">Power & Grid</option>
                <option value="lighting">Street Lighting</option>
                <option value="drainage">Storm Drainage</option>
                <option value="structural">Bridges & Overpasses</option>
                <option value="waste">Solid Waste</option>
              </select>

              {/* Severity Filter */}
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical / Emergency</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="triage">AI Triage</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Awaiting Repair Verification</option>
                <option value="resolved">Resolved (Awaiting Citizen Confirmation)</option>
                <option value="disputed">Disputed</option>
                <option value="closed">Closed</option>
              </select>

              {(filterCategory !== 'all' || filterSeverity !== 'all' || filterStatus !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterCategory('all');
                    setFilterSeverity('all');
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="text-cyan-400 hover:underline px-2 py-1 font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </FadeContent>

      {/* Main View: Table Grid vs Kanban Board */}
      <FadeContent effect="mist" duration={1.2} ease="power2.out" trigger="scroll">
        {viewMode === 'table' ? (
          /* Semantic HTML Table with Strict Fixed-Width Columns for Perfect Alignment */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 table-fixed border-collapse">
                <colgroup>
                  <col className="w-[110px]" />
                  <col className="w-[140px]" />
                  <col className="w-[280px]" />
                  <col className="w-[110px]" />
                  <col className="w-[200px]" />
                  <col className="w-[180px]" />
                  <col className="w-[110px]" />
                  <col className="w-[90px]" />
                </colgroup>
                <thead className="bg-slate-950/95 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Case ID</th>
                    <th className="px-4 py-3.5">Domain</th>
                    <th className="px-4 py-3.5">Incident Summary</th>
                    <th className="px-4 py-3.5">Severity</th>
                    <th className="px-4 py-3.5">Lifecycle Status</th>
                    <th className="px-4 py-3.5">Assigned Entity</th>
                    <th className="px-4 py-3.5">AI Confidence</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        No incidents matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inc) => {
                      const stages = calculateLifecycleStages(inc);
                      const activeStage = stages.slice().reverse().find((s) => s.state === 'complete' || s.state === 'active') || stages[0];

                      return (
                        <tr
                          key={inc.id}
                          onClick={() => setSelectedIncident(inc)}
                          className="hover:bg-slate-800/50 cursor-pointer transition-colors group h-16"
                        >
                          {/* Case ID */}
                          <td className="px-4 py-3.5 font-mono font-bold text-cyan-400 truncate">
                            {inc.id}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3.5 truncate">
                            <span className="flex items-center gap-1.5 font-medium text-slate-200">
                              <span>
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
                                  : inc.category === 'waste'
                                  ? '🗑️'
                                  : '🏗️'}
                              </span>
                              <span className="capitalize">{inc.category}</span>
                            </span>
                          </td>

                          {/* Summary */}
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                              {inc.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{inc.location.address}</span>
                            </div>
                          </td>

                          {/* Severity */}
                          <td className="px-4 py-3.5 truncate">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block ${
                                inc.severity === 'critical'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                                  : inc.severity === 'high'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              }`}
                            >
                              {inc.severity}
                            </span>
                          </td>

                          {/* Lifecycle Status + Mini Progress Bar */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`text-[11px] font-medium capitalize truncate px-2 py-0.5 rounded-md inline-block w-fit ${
                                  inc.status === 'review'
                                    ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                                    : inc.status === 'resolved'
                                    ? 'bg-teal-950/80 text-teal-300 border border-teal-800'
                                    : inc.status === 'disputed'
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                    : inc.status === 'closed'
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {inc.status === 'review'
                                  ? 'Repair Submitted'
                                  : inc.status === 'resolved'
                                  ? 'Citizen Sign-Off'
                                  : inc.status.replace('_', ' ')}
                              </span>

                              {/* 8-stage mini dot indicators */}
                              <div className="flex items-center gap-1 pt-0.5">
                                {stages.map((st) => (
                                  <span
                                    key={st.id}
                                    title={`${st.shortLabel}: ${st.stateLabel}`}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      st.state === 'complete'
                                        ? 'bg-emerald-400'
                                        : st.state === 'active'
                                        ? 'bg-cyan-400 animate-pulse'
                                        : st.state === 'waiting'
                                        ? 'bg-amber-400'
                                        : st.state === 'failed'
                                        ? 'bg-rose-400'
                                        : 'bg-slate-800'
                                    }`}
                                  ></span>
                                ))}
                              </div>
                            </div>
                          </td>

                          {/* Assigned Entity */}
                          <td className="px-4 py-3.5 text-slate-300 text-[11px] truncate">
                            {inc.assignedTo ? (
                              <span className="flex items-center gap-1 text-slate-200 font-medium truncate">
                                <HardHat className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="truncate">{inc.assignedTo.company || inc.assignedTo.name}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">Unassigned</span>
                            )}
                          </td>

                          {/* AI Confidence */}
                          <td className="px-4 py-3.5 font-mono font-semibold text-cyan-400 truncate">
                            {(inc.aiAnalysis.confidenceScore * 100).toFixed(0)}%
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3.5 text-right truncate">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIncident(inc);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-all inline-flex items-center gap-1"
                              title="Inspect Full Incident Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Kanban Board Across Canonical Workflow Stages */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 overflow-x-auto pb-4">
            {kanbanColumns.map((col) => {
              const colIncidents = filtered.filter((i) => i.status === col.id);
              return (
                <div
                  key={col.id}
                  className={`p-3 rounded-2xl border ${col.color} flex flex-col justify-between min-h-[480px] shadow-lg`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1 pb-2 border-b border-slate-800">
                      <div>
                        <span className="font-bold text-xs text-white uppercase tracking-wider block">
                          {col.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{col.sublabel}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${col.badgeColor}`}>
                        {colIncidents.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 mt-3">
                      {colIncidents.length === 0 ? (
                        <div className="py-6 text-center text-[11px] text-slate-500 italic">
                          No cases in this stage
                        </div>
                      ) : (
                        colIncidents.map((inc) => (
                          <div
                            key={inc.id}
                            onClick={() => setSelectedIncident(inc)}
                            className="p-3 rounded-xl bg-slate-850/90 border border-slate-800 hover:border-cyan-600/60 cursor-pointer shadow-md transition-all hover:scale-[1.02] space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-cyan-400">{inc.id}</span>
                              <span
                                className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                  inc.severity === 'critical'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {inc.severity}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-100 line-clamp-2">{inc.title}</h4>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              {inc.location.address}
                            </div>
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                              <span>AI Est: ${inc.aiAnalysis.estimatedCostUsd}</span>
                              <span className="text-cyan-400 font-semibold flex items-center">
                                Open <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 text-center text-[11px] text-slate-500 border-t border-slate-800/40 mt-3 font-mono">
                    {colIncidents.length} cases
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FadeContent>
    </div>
  );
};
