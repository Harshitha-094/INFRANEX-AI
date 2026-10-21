import React from 'react';
import { useApp } from '../../context/AppContext';
import { WARD_RISKS } from '../../data/mockData';
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Building2,
  Cpu,
} from 'lucide-react';
import { FadeContent } from '../animations/FadeContent';
import { ScrollCharacterReveal } from '../animations/ScrollCharacterReveal';

export const AnalyticsView: React.FC = () => {
  const { metrics, incidents, workOrders, repairValidations, citizenConfirmations } = useApp();

  const dynamicWardRisks = WARD_RISKS.map((w) => {
    const wardIncidents = incidents.filter((i) =>
      i.location.ward.toLowerCase().includes(w.wardName.split(' ')[0].toLowerCase())
    );
    const activeCount = wardIncidents.filter(
      (i) => !['resolved', 'closed', 'archived', 'consolidated'].includes(i.status)
    ).length;
    const criticalCount = wardIncidents.filter(
      (i) => i.severity === 'critical' && !['resolved', 'closed', 'archived', 'consolidated'].includes(i.status)
    ).length;
    return {
      ...w,
      activeIssues: activeCount > 0 ? activeCount : w.activeIssues,
      criticalIssues: criticalCount > 0 ? criticalCount : w.criticalIssues,
    };
  });

  // Dynamic Contractor Quality Analytics
  const totalAssignedWos = workOrders.length;
  const verifiedRepairs = repairValidations.filter((v) => v.decision === 'approved').length;
  const partialRepairs = repairValidations.filter((v) => v.decision === 'partially_repaired').length;
  const reworkDemanded = repairValidations.filter((v) => v.decision === 'rework_required').length;
  const disputedCount = citizenConfirmations.filter((c) => c.response === 'disputed_unresolved').length;
  const successRate = totalAssignedWos > 0 ? Math.round(((verifiedRepairs - disputedCount) / totalAssignedWos) * 100) : 94;

  const domainMTTR = [
    { name: 'Roads & Pavement', mttr: '14.2h', slaTarget: '24h', compliance: 96, trend: '-2.4h' },
    { name: 'Water & Hydrology', mttr: '8.5h', slaTarget: '12h', compliance: 98, trend: '-1.1h' },
    { name: 'Solid Waste & Sanitation', mttr: '6.0h', slaTarget: '12h', compliance: 97, trend: '-1.5h' },
    { name: 'Electrical & Power Vaults', mttr: '6.2h', slaTarget: '8h', compliance: 99, trend: '-0.8h' },
    { name: 'Street Illumination', mttr: '18.4h', slaTarget: '36h', compliance: 94, trend: '-4.2h' },
    { name: 'Storm Drainage', mttr: '11.0h', slaTarget: '18h', compliance: 95, trend: '-1.8h' },
    { name: 'Bridges & Overpasses', mttr: '48.0h', slaTarget: '72h', compliance: 92, trend: '-6.0h' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeContent effect="mist" duration={1.1} ease="power2.out" trigger="mount">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4" />
              Civic Telemetry & Predictive Analytics
            </div>
            <ScrollCharacterReveal
              text="Infrastructure Intelligence Matrix"
              highlightText="Intelligence Matrix"
              as="h1"
              className="text-2xl font-extrabold text-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              Continuous failure risk indexing, MTTR benchmarks, and municipal budget forecast modeling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              Model: INFRANEX-RiskEngine v4.1
            </span>
          </div>
        </div>
      </FadeContent>

      {/* Ward Risk Index Matrix */}
      <FadeContent effect="mist" duration={1.2} ease="power2.out" trigger="scroll">
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Ward Vulnerability & Deterioration Heat Index
            </h2>
            <p className="text-xs text-slate-400">
              Aggregated composite of citizen density, asset age, and frequency of critical incident clusters
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">BBMP Wards & Zones</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dynamicWardRisks.map((ward) => (
            <div
              key={ward.wardName}
              className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-100">{ward.wardName}</h3>
                  <span className="text-[11px] text-slate-400">Pop: {ward.populationServed} residents</span>
                </div>
                <div
                  className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                    ward.riskScore >= 75
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : ward.riskScore >= 50
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  Risk {ward.riskScore}/100
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    ward.riskScore >= 75 ? 'bg-rose-500' : ward.riskScore >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${ward.riskScore}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Active Cases: <strong className="text-white">{ward.activeIssues}</strong></span>
                <span>Critical: <strong className="text-rose-400">{ward.criticalIssues}</strong></span>
                <span className="capitalize text-cyan-400 font-semibold">{ward.primaryRiskCategory}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </FadeContent>

      {/* Contractor Quality & Verification Analytics */}
      <FadeContent effect="mist" duration={1.2} ease="power2.out" trigger="scroll">
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Contractor Quality, First-Time Fix & Citizen Satisfaction Scorecard
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated directly from verified work orders, authority signoffs, and citizen dispute records.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
            {successRate}% First-Time Fix Rate
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Work Orders</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">{totalAssignedWos}</span>
            <span className="text-[10px] text-slate-500">Total assigned</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Officer Verified</span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">{verifiedRepairs}</span>
            <span className="text-[10px] text-slate-500">Quality signoff</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Partial Repairs</span>
            <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">{partialRepairs}</span>
            <span className="text-[10px] text-slate-500">Follow-up needed</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Rework Ordered</span>
            <span className="text-lg font-bold font-mono text-orange-400 mt-1 block">{reworkDemanded}</span>
            <span className="text-[10px] text-slate-500">Failed initial audit</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Citizen Disputes</span>
            <span className="text-lg font-bold font-mono text-rose-400 mt-1 block">{disputedCount}</span>
            <span className="text-[10px] text-slate-500">Reopened cases</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-1">
          * Calculation basis: Derived from all completed work orders. Contractors are assessed on first-time engineering compliance and absence of post-repair citizen disputes, not simply on gross closed ticket volume.
        </div>
      </div>
      </FadeContent>

      {/* Two Column Grid: MTTR Benchmarks & Predictive Maintenance */}
      <FadeContent effect="mist" duration={1.2} ease="power2.out" trigger="scroll">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: MTTR by Domain */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Departmental MTTR & SLA Compliance
            </h2>
            <span className="text-xs text-emerald-400 font-semibold">96.8% Overall SLA</span>
          </div>

          <div className="space-y-3">
            {domainMTTR.map((item) => (
              <div key={item.name} className="p-3 rounded-xl bg-slate-850/50 border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400 font-mono font-bold">{item.mttr}</span>
                    <span className="text-emerald-400 text-[11px] font-mono">{item.trend}</span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${item.compliance}%` }}></div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Target SLA: {item.slaTarget}</span>
                  <span>Compliance: {item.compliance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Predictive Maintenance & AI Failure Warnings */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            AI Predictive Maintenance Signals
          </h2>
          <p className="text-xs text-slate-400">
            Machine learning forecast models flagging structural, hydraulic, and electrical stress anomalies across Bengaluru before catastrophic failure.
          </p>

          <div className="space-y-3">
            {[
              {
                title: 'Trunk Water Main #7A Micro-Vibration',
                location: 'Cauvery Water Supply Trunk Line, Koramangala 80 Feet Road',
                probability: '84% Failure Likelihood in 45 Days',
                action: 'Preventative ultrasound inspection scheduled for Koramangala Ward 151',
                urgency: 'border-rose-800/60 bg-rose-950/20 text-rose-300',
              },
              {
                title: 'High-Tension Overpass Cable Oscillation',
                location: 'Hebbal Flyover Junction Viaduct Pier 14, Bellary Road',
                probability: '68% Fatigue Threshold Exceeded',
                action: 'Tension damper recalibration work order drafted for BBMP North',
                urgency: 'border-amber-800/60 bg-amber-950/20 text-amber-300',
              },
              {
                title: 'Stormwater Culvert Silt Accumulation',
                location: 'Varthur Rajakaluve Primary Stormwater Drain, Mahadevapura',
                probability: '72% Flood Risk upon 30mm Rainfall',
                action: 'Hydro-jet vacuum cleaning queued for upcoming monsoon window',
                urgency: 'border-cyan-800/60 bg-cyan-950/20 text-cyan-300',
              },
            ].map((pred, i) => (
              <div key={i} className={`p-3.5 rounded-xl border ${pred.urgency} space-y-1.5`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{pred.title}</span>
                  <span className="font-mono text-[11px]">{pred.probability}</span>
                </div>
                <div className="text-[11px] text-slate-400">{pred.location}</div>
                <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="font-semibold text-cyan-300">Action Plan:</span> {pred.action}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-400 flex items-center justify-between">
            <span>Historical Prevention Savings (YTD):</span>
            <span className="font-mono font-bold text-emerald-400">₹2.85 Cr (Preventative Savings)</span>
          </div>
        </div>
      </div>
      </FadeContent>
    </div>
  );
};
