import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Shield,
  HardHat,
  UserCheck,
  User,
  PlusCircle,
  Bell,
  Search,
  Sparkles,
  Database,
  Wifi,
  WifiOff,
  BookOpen,
} from 'lucide-react';
import { BrandEmblem } from '../brand/BrandEmblem';
import { NotificationPanel } from './NotificationPanel';

export const Navbar: React.FC = () => {
  const {
    role,
    setRole,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    unreadNotificationCount,
    isBackendConnected,
    isBackendChecking,
    checkBackendConnection,
  } = useApp();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const roles: { id: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'citizen', label: 'Citizen Portal', icon: <User className="w-4 h-4" />, color: 'text-emerald-400' },
    { id: 'officer', label: 'Field Officer', icon: <UserCheck className="w-4 h-4" />, color: 'text-cyan-400' },
    { id: 'contractor', label: 'Contractor Hub', icon: <HardHat className="w-4 h-4" />, color: 'text-amber-400' },
    { id: 'admin', label: 'Admin Command', icon: <Shield className="w-4 h-4" />, color: 'text-purple-400' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#080B12]/85 backdrop-blur-2xl shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group transition-all duration-200 active:scale-95"
          onClick={() => setActiveTab('dashboard')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveTab('dashboard')}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/20 group-hover:ring-cyan-400/80 group-hover:border-cyan-400/70 group-hover:shadow-[0_0_18px_rgba(66,217,245,0.35)] transition-all duration-200 p-0.5">
            <BrandEmblem size={34} className="group-hover:scale-105 transition-transform duration-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-lg text-white font-mono">
                INFRANEX<span className="text-cyan-400">.AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-sm shadow-cyan-900/30">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> CIVIC AI OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Intelligent Infrastructure & Incident Command</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Case ID, street, category, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 text-sm rounded-lg pl-9 pr-4 py-2 border border-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 placeholder-slate-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right Section: Role Switcher & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Report Button (Citizen Only) */}
          {role === 'citizen' && (
            <button
              onClick={() => setActiveTab('report')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all duration-200 transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Issue</span>
            </button>
          )}

          {/* macOS-Inspired ResQ-Vision Style Demo Mode Role Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs shadow-inner shadow-black/40 backdrop-blur-md">
            <div className="flex items-center gap-1.5 px-2 py-0.5 border-r border-slate-700/60 mr-1 hidden sm:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/80">
                DEMO MODE
              </span>
            </div>
            <div className="flex items-center gap-1">
              {roles.map((r) => {
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-b from-slate-700 to-slate-800 text-white shadow-md shadow-black/50 ring-1 ring-white/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                    title={`Switch Demo Role: ${r.label}`}
                  >
                    <span className={isActive ? r.color : 'text-slate-500'}>{r.icon}</span>
                    <span className="hidden xl:inline">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backend Status Indicator */}
          <button
            onClick={checkBackendConnection}
            title={
              isBackendConnected
                ? 'Backend API Connected (FastAPI & DB Active). Click to re-verify.'
                : 'Offline Demo Mode (Browser Storage Active). Click to connect to backend.'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition-all duration-200 active:scale-95 ${
              isBackendConnected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10 hover:border-emerald-400/60'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendChecking
                  ? 'bg-amber-400 animate-ping'
                  : isBackendConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className="hidden md:inline">
              {isBackendChecking
                ? 'Checking...'
                : isBackendConnected
                ? 'Backend API'
                : 'Demo Offline'}
            </span>
          </button>

          {/* User Manual & Help Center Button */}
          <button
            onClick={() => setActiveTab('manual')}
            title="Open INFRANEX AI Interactive User Manual & Help Guide"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-200 active:scale-95 ${
              activeTab === 'manual'
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Manual</span>
          </button>

          {/* Alert Bell & Notification Dropdown Panel */}
          <div className="relative">
            <button
              id="notification-bell-btn"
              type="button"
              aria-label="Toggle notifications panel"
              aria-expanded={isNotificationOpen}
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className={`p-2 rounded-lg border transition-all duration-200 active:scale-95 relative ${
                isNotificationOpen
                  ? 'bg-slate-800 border-cyan-500/50 text-cyan-400 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Bell className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-md shadow-rose-500/30 border border-slate-950">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            <NotificationPanel
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
