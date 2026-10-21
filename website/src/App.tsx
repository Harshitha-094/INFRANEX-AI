import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { IssueReportingView } from './components/reporting/IssueReportingView';
import { CaseManagementView } from './components/cases/CaseManagementView';
import { AnalyticsView } from './components/insights/AnalyticsView';
import { RoleWorkspaceView } from './components/roles/RoleWorkspaceView';
import { HotspotsView } from './components/hotspots/HotspotsView';
import { UserManualView } from './components/manual/UserManualView';
import { CaseDetailModal } from './components/cases/CaseDetailModal';
import { CinematicHero } from './components/landing/CinematicHero';
import { LogoIntro } from './components/landing/LogoIntro';
import { InfrastructureCityBackground } from './components/backgrounds/InfrastructureCityBackground';
import { PageTransition } from './components/animations/PageTransition';
import { CinematicClosingModal } from './components/landing/CinematicClosingModal';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, toastMessage, selectedIncident, setSelectedIncident } = useApp();
  const [isClosingOpen, setIsClosingOpen] = React.useState(false);
  const [hasCompletedIntro, setHasCompletedIntro] = React.useState(false);

  // If on hero opening page on fresh load, play animated logo intro before revealing CinematicHero
  if (activeTab === 'hero') {
    return (
      <AnimatePresence mode="wait">
        {!hasCompletedIntro ? (
          <LogoIntro
            key="logo-intro"
            onComplete={() => setHasCompletedIntro(true)}
          />
        ) : (
          <motion.div
            key="cinematic-hero"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-h-screen"
          >
            <CinematicHero onEnter={(targetTab = 'dashboard') => setActiveTab(targetTab)} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-100 relative selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. Persistent Global Infrastructure City Background at z-0 */}
      <InfrastructureCityBackground />

      {/* 2. Higher Stacking Context for All Interactive Application Content at z-10 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar />

        {/* Main Body */}
        <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Content Area with Smooth Page Transition */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <PageTransition activeKey={activeTab}>
              {activeTab === 'dashboard' && <OverviewDashboard />}
              {activeTab === 'report' && <IssueReportingView />}
              {activeTab === 'cases' && <CaseManagementView />}
              {activeTab === 'hotspots' && <HotspotsView />}
              {activeTab === 'insights' && <AnalyticsView />}
              {activeTab === 'role-view' && <RoleWorkspaceView />}
              {activeTab === 'manual' && <UserManualView />}
            </PageTransition>
          </main>
        </div>

        {/* Global Case Detail & Map Inspection Modal */}
        {selectedIncident && (
          <CaseDetailModal
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        )}

        {/* Global Closing Experience Modal */}
        <CinematicClosingModal
          isOpen={isClosingOpen}
          onClose={() => setIsClosingOpen(false)}
          onReturnToHero={() => {
            setIsClosingOpen(false);
            setActiveTab('hero');
          }}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs font-semibold shadow-2xl shadow-cyan-500/20 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modern Footer with Closing Experience Trigger */}
        <footer className="border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md py-4 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-mono">
              INFRANEX AI &copy; 2026 • Intelligent Infrastructure & Incident Management
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsClosingOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all font-mono text-[11px]"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Platform Briefing & Outro</span>
              </button>
              <span className="text-slate-500 hidden md:inline">
                React • TypeScript • Vite • Leaflet OpenStreetMap
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
