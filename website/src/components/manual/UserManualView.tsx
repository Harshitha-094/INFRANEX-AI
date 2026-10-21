import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MANUAL_SECTIONS,
  GLOSSARY_TERMS,
  ManualSection,
  ManualSubSection,
  GlossaryTerm,
} from './userManualData';
import {
  Compass,
  Camera,
  UserCheck,
  HardHat,
  Shield,
  FolderKanban,
  Flame,
  BarChart3,
  AlertTriangle,
  BookOpen,
  Search,
  Printer,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Sliders,
  X,
  FileText,
  MapPin,
  Layers,
  Info,
} from 'lucide-react';
import { FadeContent } from '../animations/FadeContent';
import { ScrollCharacterReveal } from '../animations/ScrollCharacterReveal';

// Helper icon resolver for dynamic icons in manual data
const renderSectionIcon = (iconName: string, className = 'w-5 h-5') => {
  switch (iconName) {
    case 'Compass':
      return <Compass className={className} />;
    case 'Camera':
      return <Camera className={className} />;
    case 'UserCheck':
      return <UserCheck className={className} />;
    case 'HardHat':
      return <HardHat className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'FolderKanban':
      return <FolderKanban className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'BarChart3':
      return <BarChart3 className={className} />;
    case 'AlertTriangle':
      return <AlertTriangle className={className} />;
    case 'BookOpen':
    default:
      return <BookOpen className={className} />;
  }
};

export const UserManualView: React.FC = () => {
  const { setActiveTab, setRole } = useApp();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('getting-started');
  const [selectedGlossaryCategory, setSelectedGlossaryCategory] = useState<string>('All');

  // Accordion Expand / Collapse State
  // Default: first subsection of active section is expanded
  const [expandedSubSections, setExpandedSubSections] = useState<Record<string, boolean>>({
    'launch-and-intro': true,
    'reporting-steps': true,
    'officer-inspection': true,
    'contractor-execution': true,
    'admin-governance': true,
    'case-board-views': true,
    'geospatial-tools': true,
    'metrics-guide': true,
    'camera-troubleshooting': true,
    'glossary-terms': true,
  });

  const toggleSubSection = (id: string) => {
    setExpandedSubSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    MANUAL_SECTIONS.forEach((s) => {
      s.subSections.forEach((sub) => {
        allExpanded[sub.id] = true;
      });
    });
    setExpandedSubSections(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSubSections({});
  };

  // Trigger browser print dialog for Save as PDF / Print
  const handlePrint = () => {
    window.print();
  };

  // Filter sections and subsections based on search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MANUAL_SECTIONS;

    return MANUAL_SECTIONS.map((sec) => {
      const matchSectionTitle = sec.title.toLowerCase().includes(q);
      const matchSectionDesc = sec.description.toLowerCase().includes(q);

      const matchingSubSections = sec.subSections.filter((sub) => {
        const matchSubTitle = sub.title.toLowerCase().includes(q);
        const matchSubSummary = sub.summary.toLowerCase().includes(q);
        const matchSteps = sub.steps?.some(
          (step) =>
            step.title.toLowerCase().includes(q) ||
            step.description.toLowerCase().includes(q) ||
            step.actionHint?.toLowerCase().includes(q) ||
            step.tip?.toLowerCase().includes(q) ||
            step.warning?.toLowerCase().includes(q)
        );
        const matchContent = sub.content?.some((c) => c.toLowerCase().includes(q));
        return matchSubTitle || matchSubSummary || matchSteps || matchContent;
      });

      if (matchSectionTitle || matchSectionDesc || matchingSubSections.length > 0) {
        return {
          ...sec,
          subSections: matchingSubSections.length > 0 ? matchingSubSections : sec.subSections,
        };
      }
      return null;
    }).filter((s): s is ManualSection => s !== null);
  }, [searchQuery]);

  // Filter glossary terms
  const filteredGlossary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GLOSSARY_TERMS.filter((item) => {
      if (selectedGlossaryCategory !== 'All' && item.category !== selectedGlossaryCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.example?.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedGlossaryCategory]);

  // Auto-expand all when a search query is active
  useEffect(() => {
    if (searchQuery.trim()) {
      expandAll();
    }
  }, [searchQuery]);

  // Navigation jump handler
  const handleJumpToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(`manual-sec-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8 print:p-0 print:space-y-4 print:bg-white print:text-black">
      {/* 
        ========================================================================
        PAGE HEADER & UTILITIES TOOLBAR (Print, Search, Jump)
        ========================================================================
      */}
      <FadeContent effect="mist" duration={1.1} ease="power2.out" trigger="mount">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0A1A2F]/80 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden print:border-none print:shadow-none print:bg-none print:p-0">
          {/* Subtle Ambient Light Flare */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none print:hidden" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-800/80 shadow-sm print:hidden">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Official Field Guide & Documentation
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline print:hidden">
                  INFRANEX AI // v1.0.0
                </span>
              </div>

              <ScrollCharacterReveal
                text="INFRANEX AI User Manual"
                highlightText="User Manual"
                as="h1"
                className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans print:text-black"
              />

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed print:text-gray-700">
                A step-by-step guide to reporting, verifying, managing and tracking public
                infrastructure incidents across municipal Bengaluru.
              </p>
            </div>

            {/* Quick Action Utilities */}
            <div className="flex flex-wrap items-center gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all duration-200 shadow-md cursor-pointer active:scale-95"
                title="Print documentation or save as high-quality PDF"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Print / Save as PDF</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Incident</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Expand/Collapse Controls */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search manual sections, workflows, errors, or terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 text-sm rounded-xl pl-10 pr-10 py-2.5 border border-slate-700/80 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-400 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Toggle Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-400 font-mono">
              <button
                onClick={expandAll}
                className="hover:text-cyan-400 underline underline-offset-4 cursor-pointer px-1 py-0.5"
              >
                Expand All
              </button>
              <span>•</span>
              <button
                onClick={collapseAll}
                className="hover:text-cyan-400 underline underline-offset-4 cursor-pointer px-1 py-0.5"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      </FadeContent>

      {/* 
        ========================================================================
        QUICK GETTING STARTED BANNER (Prominent First-Step Guide)
        ========================================================================
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div
          onClick={() => {
            setRole('citizen');
            setActiveTab('report');
          }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-200 cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Citizen Path
            </span>
            <Camera className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-base font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
            Report Physical Hazard
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Use live device camera to capture potholes, flooding, or wire hazards with GPS verification.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <span>Launch Citizen Camera</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => {
            setRole('officer');
            setActiveTab('cases');
          }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-200 cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Field Officer Path
            </span>
            <UserCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
            Triage & Case Review
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Review incoming evidence, assign municipal authorities, and inspect contractor repairs.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
            <span>Open Inspection Queue</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => {
            setRole('contractor');
            setActiveTab('role-view');
          }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/30 border border-amber-500/30 hover:border-amber-400/60 transition-all duration-200 cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              Contractor Path
            </span>
            <HardHat className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-base font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
            Execute Work Orders
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Track SLA clocks, log crew labor and physical materials, and upload post-repair verification.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
            <span>Open Contractor Hub</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        MAIN MANUAL BODY (Table of Contents Sidebar + Content Sections)
        ========================================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Column: Interactive Table of Contents */}
        <aside className="lg:col-span-1 sticky top-20 z-20 space-y-4 print:hidden">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 px-2">
              <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Manual Index
              </span>
              <span>10 Sections</span>
            </div>

            <nav className="space-y-1 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
              {MANUAL_SECTIONS.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => handleJumpToSection(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="font-mono text-[10px] text-slate-500 font-bold">
                        {sec.number}
                      </span>
                      <span className="truncate">{sec.shortTitle}</span>
                    </div>
                    {renderSectionIcon(
                      sec.iconName,
                      `w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Column: Comprehensive Documentation Sections */}
        <div className="lg:col-span-3 space-y-10">
          {filteredSections.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
              <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Matching Topics Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                No manual sections matched your query "{searchQuery}". Try searching for
                keywords like "camera", "pothole", "work order", "GPS", or "triage".
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-semibold hover:bg-cyan-900"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredSections.map((sec) => (
              <section
                key={sec.id}
                id={`manual-sec-${sec.id}`}
                className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-6 scroll-mt-24 print:bg-white print:border-b-2 print:border-gray-300 print:shadow-none print:p-0 print:mb-8"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 print:border-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 flex items-center justify-center shrink-0 shadow-md shadow-cyan-950/50 print:hidden">
                      {renderSectionIcon(sec.iconName, 'w-5 h-5')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                          SECTION {sec.number}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 print:hidden">
                          {sec.badge}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight print:text-black">
                        {sec.title}
                      </h2>
                    </div>
                  </div>

                  {/* Related In-App Navigation Button */}
                  {sec.relatedTab && (
                    <button
                      onClick={() => setActiveTab(sec.relatedTab!)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 hover:text-white transition-all shadow-sm shrink-0 cursor-pointer print:hidden active:scale-95"
                    >
                      <span>{sec.relatedTabLabel || 'Open Module'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  )}
                </div>

                {/* Section Description */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed print:text-gray-700">
                  {sec.description}
                </p>

                {/* Subsections & Step-by-Step Instructions */}
                <div className="space-y-4">
                  {sec.subSections.map((sub) => {
                    const isExpanded = expandedSubSections[sub.id] ?? true;

                    return (
                      <div
                        key={sub.id}
                        className="rounded-2xl bg-slate-950/60 border border-slate-800/80 overflow-hidden print:bg-white print:border-none"
                      >
                        {/* Subsection Accordion Header */}
                        <button
                          onClick={() => toggleSubSection(sub.id)}
                          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors cursor-pointer select-none print:p-0"
                          aria-expanded={isExpanded}
                        >
                          <div className="space-y-0.5 pr-4">
                            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 print:text-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 print:hidden" />
                              {sub.title}
                            </h3>
                            <p className="text-xs text-slate-400 print:text-gray-600">{sub.summary}</p>
                          </div>
                          <div className="text-slate-400 print:hidden shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {/* Subsection Content Body */}
                        {isExpanded && (
                          <div className="px-4 pb-5 sm:px-6 sm:pb-6 border-t border-slate-800/60 pt-4 space-y-4 print:p-0 print:border-none">
                            {/* Numbered Steps */}
                            {sub.steps && sub.steps.length > 0 && (
                              <div className="space-y-3">
                                {sub.steps.map((st) => (
                                  <div
                                    key={st.stepNumber}
                                    className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800/70 flex gap-3.5 print:bg-gray-50 print:border-gray-200"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-cyan-800/60 print:bg-gray-200 print:text-black">
                                      {st.stepNumber}
                                    </div>
                                    <div className="space-y-1.5 flex-1 text-xs">
                                      <h4 className="font-bold text-slate-100 text-xs sm:text-sm print:text-black">
                                        {st.title}
                                      </h4>
                                      <p className="text-slate-300 leading-relaxed print:text-gray-700">
                                        {st.description}
                                      </p>

                                      {/* Action Hints */}
                                      {st.actionHint && (
                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 mt-1 print:bg-gray-100 print:text-black">
                                          <ArrowRight className="w-3 h-3 text-cyan-400" />
                                          <span>{st.actionHint}</span>
                                        </div>
                                      )}

                                      {/* Warnings */}
                                      {st.warning && (
                                        <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-300 text-[11px] mt-2">
                                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                          <span>{st.warning}</span>
                                        </div>
                                      )}

                                      {/* Tips */}
                                      {st.tip && (
                                        <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-[11px] mt-2">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                          <span>{st.tip}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Additional Text Content */}
                            {sub.content && (
                              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                {sub.content.map((p, idx) => (
                                  <p key={idx}>{p}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Section 10: Special Glossary Renderer */}
                {sec.id === 'glossary' && (
                  <div className="space-y-4 pt-2">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap text-xs print:hidden">
                      <span className="text-slate-400 font-mono">Category:</span>
                      {['All', 'System', 'Workflow', 'Role', 'Metric'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedGlossaryCategory(cat)}
                          className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                            selectedGlossaryCategory === cat
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-slate-800/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Glossary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredGlossary.map((g) => (
                        <div
                          key={g.term}
                          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 print:border-gray-300 print:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm font-sans print:text-black">
                              {g.term}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 print:bg-gray-200 print:text-black">
                              {g.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed print:text-gray-700">
                            {g.definition}
                          </p>
                          {g.example && (
                            <p className="text-[11px] text-slate-400 font-mono italic">
                              Example: {g.example}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManualView;
