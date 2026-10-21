import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  AlertTriangle,
  FolderKanban,
  BarChart3,
  User,
  UserCheck,
  HardHat,
  ShieldAlert,
  Server,
  Zap,
  Camera,
  Flame,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, role, incidents } = useApp();

  const criticalCount = incidents.filter((i) => i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved').length;
  const inProgressCount = incidents.filter((i) => i.status === 'in_progress').length;

  const navigation = [
    {
      id: 'dashboard',
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    ...(role === 'citizen'
      ? [
          {
            id: 'report',
            label: 'Report Incident (Camera)',
            icon: Camera,
            badge: 'Live',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          },
        ]
      : []),
    {
      id: 'cases',
      label: 'Case Management',
      icon: FolderKanban,
      badge: criticalCount > 0 ? `${criticalCount} crit` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'hotspots',
      label: 'Hotspots & Recurrence',
      icon: Flame,
      badge: 'Dynamic',
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'insights',
      label: 'Insights & Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'role-view',
      label:
        role === 'citizen'
          ? 'My Citizen Portal'
          : role === 'officer'
          ? 'Field Inspection Queue'
          : role === 'contractor'
          ? 'Contractor Work Orders'
          : 'Admin Governance',
      icon: role === 'citizen' ? User : role === 'officer' ? UserCheck : role === 'contractor' ? HardHat : ShieldAlert,
      badge: role === 'contractor' ? `${inProgressCount} active` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'manual',
      label: 'User Manual & Docs',
      icon: BookOpen,
      badge: 'Guide',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'hero',
      label: 'Cinematic Intro',
      icon: Sparkles,
      badge: 'Video',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#080B12]/80 backdrop-blur-2xl p-4 flex md:flex-col justify-between gap-4">
      <div className="w-full">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-3 mb-2 hidden md:block">
          Core Workspaces
        </div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900/90 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Health / Micro telemetry widget */}
      <div className="hidden md:block p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <Server className="w-3.5 h-3.5 text-cyan-400" /> System Node
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <div className="space-y-1.5 text-[11px] text-slate-400 font-mono">
          <div className="flex justify-between">
            <span>AI Triage SLA</span>
            <span className="text-emerald-400">99.4%</span>
          </div>
          <div className="flex justify-between">
            <span>Telemetry Ingestion</span>
            <span className="text-cyan-400">42 ms</span>
          </div>
          <div className="flex justify-between">
            <span>PostGIS Cluster</span>
            <span className="text-slate-400">Standby (Ready)</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> v1.0.0-PROD
          </span>
          <span>Bengaluru BBMP</span>
        </div>
      </div>
    </aside>
  );
};
