import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

export interface LogoIntroProps {
  onComplete: () => void;
  autoPlayDuration?: number; // total duration in milliseconds, default ~4800ms
}

/**
 * INFRANEX AI — Cinematic Animated Logo Introduction
 * 
 * Phase 1 (0.0s - 0.5s): Dark Midnight Opening & Blueprint Grid
 * Phase 2 (0.4s - 1.5s): Elevated Highway & Roads Draw Themselves
 * Phase 3 (0.8s - 2.0s): Futuristic Buildings Rise & Green Infrastructure Layer
 * Phase 4 (1.5s - 3.0s): Letters Assemble (INFRANEX + AI Brand Gradient)
 * Phase 5 (2.6s - 3.5s): Kannada Tagline (ಜನಸ್ಪಂದನ) & Horizontal Accents
 * Phase 6 (3.5s - 4.8s): Final Light Sweep & Cinematic Zoom-through to Hero
 */
export const LogoIntro: React.FC<LogoIntroProps> = ({
  onComplete,
  autoPlayDuration = 4800,
}) => {
  const [isSkipping, setIsSkipping] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user preference for reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  // Handle completion and trigger exit
  const handleTriggerComplete = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    // Smooth transition buffer before handing off to CinematicHero
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  // Keyboard accessibility: ESC or Space or Enter to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleTriggerComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSkipping]);

  // Main animation timer: automatically complete after autoPlayDuration
  useEffect(() => {
    const duration = prefersReducedMotion ? 2200 : autoPlayDuration;
    const timer = setTimeout(() => {
      handleTriggerComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [autoPlayDuration, prefersReducedMotion]);

  // Wordmark letters for individual animation
  const infranexLetters = useMemo(() => 'INFRANEX'.split(''), []);

  // Generate atmospheric background dust particles
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        x: (i * 37) % 100,
        y: (i * 43) % 100,
        size: (i % 3) + 1.2,
        duration: 3 + (i % 4),
        delay: (i * 0.15) % 2,
      })),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: prefersReducedMotion ? 1 : 2.05,
        filter: prefersReducedMotion ? 'none' : 'blur(10px)',
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
      }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 overflow-hidden bg-[#080B12] flex flex-col items-center justify-center select-none text-white"
      role="region"
      aria-label="INFRANEX AI Cinematic Logo Introduction"
    >
      {/* 
        ========================================================================
        PHASE 1: ATMOSPHERE, AMBIENT GLOW & BLUEPRINT GRID
        ========================================================================
      */}
      {/* Radial Ambient Core Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(66, 217, 245, 0.12) 0%, rgba(13, 18, 27, 0.8) 52%, #080B12 100%)',
        }}
      />

      {/* Blueprint Grid Lines */}
      <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: prefersReducedMotion ? 0.25 : [0, 0.35, 0.22] }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full pointer-events-none stroke-cyan-500/10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="introGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="60" cy="0" r="1.5" fill="rgba(66, 217, 245, 0.3)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#introGrid)" />
      </motion.svg>

      {/* Subtle Coordinate Blueprint Crosshairs */}
      <div className="absolute inset-0 pointer-events-none flex justify-between p-6 sm:p-10 text-[10px] font-mono text-cyan-400/30">
        <div className="flex flex-col gap-1">
          <span>SYS.GRID // 12.9716° N</span>
          <span>DATUM // 77.5946° E</span>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-right">
          <span>INFRANEX CIVIC AI</span>
          <span>BENGALURU METROPOLITAN MATRIX</span>
        </div>
      </div>

      {/* Atmospheric Floating Data Particles */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{
                opacity: [0, 0.6, 0.1],
                y: [-5, -25],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                backgroundColor: p.id % 2 === 0 ? '#42D9F5' : '#27C6B8',
                boxShadow: '0 0 6px rgba(66, 217, 245, 0.7)',
              }}
            />
          ))}
        </div>
      )}

      {/* 
        ========================================================================
        SKIP INTRO CONTROL (Accessible, unobtrusive, sleek liquid-glass)
        ========================================================================
      */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-30">
        <motion.button
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          onClick={handleTriggerComplete}
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/60 hover:border-cyan-400/50 text-slate-300 hover:text-white text-xs font-mono tracking-wider transition-all duration-200 backdrop-blur-md shadow-lg shadow-black/40 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          title="Skip animated intro directly to platform opening"
        >
          <span>Skip intro</span>
          <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          <span className="hidden md:inline-block text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 ml-1">
            ESC
          </span>
        </motion.button>
      </div>

      {/* 
        ========================================================================
        MAIN LOGO COMPOSITION CONTAINER
        (Phases 2 through 6: Roads, Buildings, Wordmark, Tagline, Final Zoom)
        ========================================================================
      */}
      <motion.div
        initial={{ scale: 0.94 }}
        animate={{
          scale: prefersReducedMotion ? 1 : [0.94, 0.98, 1, 1.05],
        }}
        transition={{
          duration: autoPlayDuration / 1000,
          times: [0, 0.4, 0.8, 1],
          ease: 'easeInOut',
        }}
        className="relative z-20 flex flex-col items-center justify-center max-w-4xl w-full px-4"
      >
        {/* Shimmer Light Sweep across assembled logo (Phases 5-6) */}
        {!prefersReducedMotion && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '200%', opacity: [0, 0.45, 0] }}
            transition={{
              delay: 3.4,
              duration: 1.1,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 pointer-events-none w-1/3 h-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent skew-x-[-25deg] z-40"
          />
        )}

        {/* 
          ======================================================================
          MINIATURE INFRASTRUCTURE CITY & ELEVATED HIGHWAYS SVG EMBLEM
          (Phase 2: Roads, Phase 3: Buildings, Green Infra, Map Plane, Markers)
          ======================================================================
        */}
        <div className="relative w-full max-w-[540px] aspect-[540/320] flex items-center justify-center">
          <svg
            viewBox="0 0 540 320"
            className="w-full h-full drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Road Gradient */}
              <linearGradient id="roadGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#27C6B8" />
                <stop offset="50%" stopColor="#42D9F5" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>

              {/* Road Bed Surface Gradient */}
              <linearGradient id="roadDeck" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0B1323" stopOpacity="0.95" />
              </linearGradient>

              {/* Central Spire Gradient */}
              <linearGradient id="spireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#42D9F5" />
                <stop offset="35%" stopColor="#1E2E4A" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              {/* High-Rise Facet Gradients */}
              <linearGradient id="buildingLit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="buildingDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#080F1E" stopOpacity="0.95" />
              </linearGradient>

              {/* Green Infrastructure Gradient */}
              <linearGradient id="greenEcoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.75" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#34D399" stopOpacity="0.75" />
              </linearGradient>

              {/* Digital Map Plane Gradient */}
              <linearGradient id="mapPlaneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0F172A" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#080E1A" stopOpacity="0.9" />
              </linearGradient>

              {/* Soft Radial Core for City Base */}
              <radialGradient id="cityAura" cx="50%" cy="60%" r="50%">
                <stop offset="0%" stopColor="#42D9F5" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#42D9F5" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* City Base Atmospheric Glow */}
            <circle cx="270" cy="180" r="140" fill="url(#cityAura)" />

            {/* 
              ------------------------------------------------------------------
              PHASE 3: LAYERED DIGITAL MAP PLANE (Base Grid & Ground Matrix)
              ------------------------------------------------------------------
            */}
            <g id="digitalMapBase">
              {/* Isometric / Perspective Ground Diamond */}
              <motion.polygon
                points="70,230 270,290 470,230 270,185"
                fill="url(#mapPlaneGrad)"
                stroke="#42D9F5"
                strokeWidth="1.2"
                strokeOpacity="0.3"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
              />

              {/* Internal Map Grid Coordinates & Concentric Contour Rings */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                stroke="#42D9F5"
                strokeWidth="0.7"
                strokeDasharray="3 3"
              >
                <line x1="120" y1="218" x2="320" y2="275" strokeOpacity="0.3" />
                <line x1="170" y1="208" x2="370" y2="265" strokeOpacity="0.3" />
                <line x1="220" y1="198" x2="420" y2="255" strokeOpacity="0.3" />

                <line x1="220" y1="275" x2="420" y2="218" strokeOpacity="0.3" />
                <line x1="170" y1="260" x2="370" y2="205" strokeOpacity="0.3" />
                <line x1="120" y1="245" x2="320" y2="192" strokeOpacity="0.3" />

                {/* Digital Civic Boundary Contour Circle */}
                <ellipse
                  cx="270"
                  cy="238"
                  rx="95"
                  ry="28"
                  fill="none"
                  stroke="#27C6B8"
                  strokeWidth="0.8"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                />
              </motion.g>
            </g>

            {/* 
              ------------------------------------------------------------------
              PHASE 3: FUTURISTIC BUILDINGS (Skyline Rising from Bottom Up)
              ------------------------------------------------------------------
            */}
            <g id="skylineBuildings">
              {/* Far West Tower (Building 1) */}
              <motion.g
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.85, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: '145px 230px' }}
              >
                <rect x="130" y="165" width="28" height="65" rx="1" fill="url(#buildingDark)" stroke="#38BDF8" strokeWidth="0.9" strokeOpacity="0.4" />
                {/* Horizontal Neon Floor Strips */}
                <line x1="133" y1="180" x2="155" y2="180" stroke="#42D9F5" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="133" y1="195" x2="155" y2="195" stroke="#42D9F5" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="133" y1="210" x2="155" y2="210" stroke="#42D9F5" strokeWidth="0.8" strokeOpacity="0.5" />
              </motion.g>

              {/* West Modern Commercial Tower (Building 2) */}
              <motion.g
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.95, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: '185px 225px' }}
              >
                {/* Main Body */}
                <polygon points="168,225 168,135 204,122 204,225" fill="url(#buildingLit)" stroke="#42D9F5" strokeWidth="1" strokeOpacity="0.6" />
                {/* Side Shadow Facet */}
                <polygon points="204,122 216,132 216,220 204,225" fill="url(#buildingDark)" stroke="#27C6B8" strokeWidth="0.8" strokeOpacity="0.4" />
                {/* Vertical illuminated glass channel */}
                <line x1="186" y1="130" x2="186" y2="225" stroke="#42D9F5" strokeWidth="0.9" strokeOpacity="0.65" />
              </motion.g>

              {/* Mid-West Tiered Hub (Building 3) */}
              <motion.g
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 1.05, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: '228px 218px' }}
              >
                <rect x="212" y="115" width="34" height="103" rx="2" fill="url(#buildingDark)" stroke="#27C6B8" strokeWidth="0.9" strokeOpacity="0.5" />
                <polygon points="212,115 229,98 246,115" fill="#1E293B" stroke="#42D9F5" strokeWidth="0.8" strokeOpacity="0.6" />
                {/* Glowing Floor Windows */}
                {[130, 145, 160, 175, 190, 205].map((yVal) => (
                  <line key={yVal} x1="216" y1={yVal} x2="242" y2={yVal} stroke="#27C6B8" strokeWidth="0.7" strokeOpacity="0.45" />
                ))}
              </motion.g>

              {/* CENTRAL SOVEREIGN SPIRE — Bengaluru Civic Landmark (Building 4, Tallest) */}
              <motion.g
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 1.15, duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: '270px 220px' }}
              >
                {/* Tower Base & Core */}
                <polygon points="250,220 250,92 270,68 290,92 290,220" fill="url(#spireGrad)" stroke="#42D9F5" strokeWidth="1.2" strokeOpacity="0.8" />
                {/* Front Reflective Edge */}
                <line x1="270" y1="68" x2="270" y2="220" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.75" />
                
                {/* Futuristic Antenna Spire */}
                <line x1="270" y1="68" x2="270" y2="35" stroke="#42D9F5" strokeWidth="1.6" />
                {/* Pulsing Beacon Sphere at Pinnacle */}
                <circle cx="270" cy="35" r="2.8" fill="#42D9F5">
                  {!prefersReducedMotion && (
                    <animate
                      attributeName="r"
                      values="2.5;4.5;2.5"
                      dur="1.6s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
                <circle cx="270" cy="35" r="7" stroke="#42D9F5" strokeWidth="0.6" strokeOpacity="0.5">
                  {!prefersReducedMotion && (
                    <animate
                      attributeName="r"
                      values="4;12;4"
                      dur="1.6s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              </motion.g>

              {/* Mid-East High-Tech Tower (Building 5) */}
              <motion.g
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: '315px 218px' }}
              >
                <polygon points="296,218 296,118 328,102 328,218" fill="url(#buildingLit)" stroke="#42D9F5" strokeWidth="1" strokeOpacity="0.6" />
                <polygon points="328,102 340,112 340,215 328,218" fill="url(#buildingDark)" stroke="#27C6B8" strokeWidth="0.8" strokeOpacity="0.4" />
                {/* Floor Bars */}
                {[122, 138, 154, 170, 186, 202].map((yVal) => (
                  <line key={yVal} x1="300" y1={yVal} x2="324" y2={yVal} stroke="#42D9F5" strokeWidth="0.7" strokeOpacity="0.5" />
                ))}
              </motion.g>

              {/* East Civic Infrastructure Tower (Building 6) */}
              <motion.g
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: '358px 225px' }}
              >
                <rect x="344" y="138" width="30" height="87" rx="1.5" fill="url(#buildingDark)" stroke="#27C6B8" strokeWidth="0.9" strokeOpacity="0.5" />
                <line x1="359" y1="138" x2="359" y2="108" stroke="#27C6B8" strokeWidth="1.2" />
                <circle cx="359" cy="108" r="2" fill="#27C6B8" />
              </motion.g>

              {/* Far East Data Center (Building 7) */}
              <motion.g
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.85, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: '395px 230px' }}
              >
                <rect x="382" y="168" width="26" height="62" rx="1" fill="url(#buildingDark)" stroke="#38BDF8" strokeWidth="0.9" strokeOpacity="0.4" />
                <line x1="386" y1="184" x2="404" y2="184" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="386" y1="200" x2="404" y2="200" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.5" />
              </motion.g>

              {/* Skybridge Connectors between Towers */}
              <motion.g
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1.35, duration: 0.6, ease: 'easeOut' }}
                style={{ transformOrigin: '270px 150px' }}
              >
                {/* West Skybridge */}
                <rect x="202" y="148" width="48" height="6" rx="1" fill="#1E293B" stroke="#42D9F5" strokeWidth="0.8" strokeOpacity="0.7" />
                {/* East Skybridge */}
                <rect x="288" y="142" width="40" height="6" rx="1" fill="#1E293B" stroke="#27C6B8" strokeWidth="0.8" strokeOpacity="0.7" />
              </motion.g>

              {/* 
                ----------------------------------------------------------------
                PHASE 3: LAYERED GREEN INFRASTRUCTURE (Eco-Terraces & Canopies)
                ----------------------------------------------------------------
              */}
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.25, duration: 0.7, ease: 'easeOut' }}
              >
                {/* Eco-Terrace on West Tower */}
                <polygon points="166,135 186,130 206,122 206,126 166,139" fill="url(#greenEcoGrad)" />
                {/* Sky Garden across Mid-West roof */}
                <rect x="214" y="113" width="30" height="4" rx="2" fill="url(#greenEcoGrad)" />
                {/* Sky Garden across Mid-East roof */}
                <polygon points="296,118 312,110 328,102 328,106 296,122" fill="url(#greenEcoGrad)" />
                {/* Elevated Garden Deck along base of city */}
                <path
                  d="M 140 220 Q 270 202 400 220"
                  stroke="url(#greenEcoGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </motion.g>
            </g>

            {/* 
              ------------------------------------------------------------------
              PHASE 2: ROADS & ELEVATED HIGHWAYS DRAW THEMSELVES (Progressive SVG)
              ------------------------------------------------------------------
            */}
            <g id="elevatedHighways">
              {/* Supporting Bridge Piers / Pylons */}
              <motion.g
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 0.7, scaleY: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
                style={{ transformOrigin: 'bottom' }}
                stroke="#334155"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="145" y1="262" x2="145" y2="280" />
                <line x1="225" y1="248" x2="225" y2="274" />
                <line x1="315" y1="250" x2="315" y2="276" />
                <line x1="395" y1="265" x2="395" y2="285" />
              </motion.g>

              {/* Road Deck Structural Under-Shadow */}
              <motion.path
                d="M 60,278 C 150,225 240,285 340,240 C 410,210 470,265 500,285"
                fill="none"
                stroke="#0B1323"
                strokeWidth="12"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.95 }}
                transition={{ delay: 0.4, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Road Deck Surface */}
              <motion.path
                d="M 60,278 C 150,225 240,285 340,240 C 410,210 470,265 500,285"
                fill="none"
                stroke="url(#roadDeck)"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.45, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Glowing Highway Edge 1 (Upper Cyan Curb) */}
              <motion.path
                id="mainRoadPath"
                d="M 60,274 C 150,221 240,281 340,236 C 410,206 470,261 500,281"
                fill="none"
                stroke="#42D9F5"
                strokeWidth="2.2"
                strokeLinecap="round"
                filter="drop-shadow(0 0 6px rgba(66,217,245,0.8))"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Glowing Highway Edge 2 (Lower Teal Curb) */}
              <motion.path
                d="M 60,282 C 150,229 240,289 340,244 C 410,214 470,269 500,289"
                fill="none"
                stroke="#27C6B8"
                strokeWidth="2"
                strokeLinecap="round"
                filter="drop-shadow(0 0 5px rgba(39,198,184,0.7))"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ delay: 0.55, duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Center Lane Dashed Divider */}
              <motion.path
                d="M 60,278 C 150,225 240,285 340,240 C 410,210 470,265 500,285"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="0.8"
                strokeDasharray="4 6"
                strokeOpacity="0.75"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.75 }}
                transition={{ delay: 0.65, duration: 1.0, ease: 'easeOut' }}
              />

              {/* Small Light Pulses / Photon Packets Travelling along Road */}
              {!prefersReducedMotion && (
                <g id="travelingLightPulses">
                  {/* Pulse 1: Cyan Data Packet */}
                  <motion.circle
                    r="3.5"
                    fill="#FFFFFF"
                    filter="drop-shadow(0 0 8px #42D9F5)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ delay: 1.3, duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <animateMotion
                      path="M 60,278 C 150,225 240,285 340,240 C 410,210 470,265 500,285"
                      dur="2.4s"
                      begin="1.2s"
                      repeatCount="indefinite"
                      keyPoints="0;1"
                      keyTimes="0;1"
                    />
                  </motion.circle>

                  {/* Pulse 2: Teal Data Packet (Trailing) */}
                  <motion.circle
                    r="2.8"
                    fill="#27C6B8"
                    filter="drop-shadow(0 0 6px #27C6B8)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.9, 0.9, 0] }}
                    transition={{ delay: 2.1, duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <animateMotion
                      path="M 60,278 C 150,225 240,285 340,240 C 410,210 470,265 500,285"
                      dur="2.2s"
                      begin="2.0s"
                      repeatCount="indefinite"
                      keyPoints="0;1"
                      keyTimes="0;1"
                    />
                  </motion.circle>
                </g>
              )}
            </g>

            {/* 
              ------------------------------------------------------------------
              PHASE 3: GLOWING CYAN MAP-LOCATION MARKERS (Pins & Radar Pulses)
              ------------------------------------------------------------------
            */}
            <g id="mapLocationPins">
              {/* Pin 1: West Arterial Flyover Junction (x=165, y=238) */}
              <motion.g
                initial={{ opacity: 0, scale: 0, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.25, duration: 0.5, type: 'spring', damping: 14 }}
              >
                {/* Radar Pulse Ring */}
                <circle cx="165" cy="238" r="9" stroke="#42D9F5" strokeWidth="1" fill="none" opacity="0.6">
                  {!prefersReducedMotion && (
                    <animate attributeName="r" values="3;16" dur="2s" repeatCount="indefinite" />
                  )}
                  {!prefersReducedMotion && (
                    <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                  )}
                </circle>
                {/* Pin Stem */}
                <line x1="165" y1="238" x2="165" y2="224" stroke="#42D9F5" strokeWidth="1.6" strokeLinecap="round" />
                {/* Pin Head */}
                <circle cx="165" cy="222" r="4.2" fill="#42D9F5" filter="drop-shadow(0 0 6px rgba(66,217,245,0.9))" />
                <circle cx="165" cy="222" r="1.8" fill="#FFFFFF" />
              </motion.g>

              {/* Pin 2: Central Civic Spire Hub (x=270, y=198) */}
              <motion.g
                initial={{ opacity: 0, scale: 0, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.45, duration: 0.5, type: 'spring', damping: 14 }}
              >
                {/* Radar Pulse Ring */}
                <circle cx="270" cy="198" r="10" stroke="#27C6B8" strokeWidth="1" fill="none" opacity="0.6">
                  {!prefersReducedMotion && (
                    <animate attributeName="r" values="4;18" dur="2s" begin="0.4s" repeatCount="indefinite" />
                  )}
                  {!prefersReducedMotion && (
                    <animate attributeName="opacity" values="0.8;0" dur="2s" begin="0.4s" repeatCount="indefinite" />
                  )}
                </circle>
                {/* Pin Stem */}
                <line x1="270" y1="198" x2="270" y2="182" stroke="#27C6B8" strokeWidth="1.6" strokeLinecap="round" />
                {/* Pin Head */}
                <circle cx="270" cy="180" r="4.5" fill="#27C6B8" filter="drop-shadow(0 0 7px rgba(39,198,184,0.9))" />
                <circle cx="270" cy="180" r="2" fill="#FFFFFF" />
              </motion.g>

              {/* Pin 3: East Telemetry Node (x=380, y=232) */}
              <motion.g
                initial={{ opacity: 0, scale: 0, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.65, duration: 0.5, type: 'spring', damping: 14 }}
              >
                {/* Radar Pulse Ring */}
                <circle cx="380" cy="232" r="8" stroke="#42D9F5" strokeWidth="1" fill="none" opacity="0.6">
                  {!prefersReducedMotion && (
                    <animate attributeName="r" values="3;15" dur="2s" begin="0.8s" repeatCount="indefinite" />
                  )}
                  {!prefersReducedMotion && (
                    <animate attributeName="opacity" values="0.8;0" dur="2s" begin="0.8s" repeatCount="indefinite" />
                  )}
                </circle>
                {/* Pin Stem */}
                <line x1="380" y1="232" x2="380" y2="218" stroke="#42D9F5" strokeWidth="1.6" strokeLinecap="round" />
                {/* Pin Head */}
                <circle cx="380" cy="216" r="4" fill="#42D9F5" filter="drop-shadow(0 0 6px rgba(66,217,245,0.9))" />
                <circle cx="380" cy="216" r="1.6" fill="#FFFFFF" />
              </motion.g>
            </g>
          </svg>
        </div>

        {/* 
          ======================================================================
          PHASE 4: WORDMARK TYPOGRAPHY (INFRANEX AI)
          Real HTML typography, individually animated, sharp & aligned
          ======================================================================
        */}
        <div className="flex flex-col items-center mt-3 sm:mt-5 text-center">
          {/* Main Title Row: INFRANEX + AI */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            {/* "INFRANEX" Letters Assembled Individually */}
            <div className="flex items-center tracking-[0.14em] sm:tracking-[0.2em] font-extrabold text-3xl sm:text-5xl md:text-6xl font-sans">
              {infranexLetters.map((letter, idx) => {
                // Staggered delays: 1.5s to 2.25s
                const letterDelay = 1.5 + idx * 0.085;
                // Alternate directional glide for dynamic cinematic assembly
                const directionY = idx % 2 === 0 ? -16 : 16;

                return (
                  <motion.span
                    key={`${letter}-${idx}`}
                    initial={{
                      opacity: 0,
                      y: prefersReducedMotion ? 0 : directionY,
                      filter: prefersReducedMotion ? 'none' : 'blur(8px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      filter: 'blur(0px)',
                    }}
                    transition={{
                      delay: letterDelay,
                      duration: prefersReducedMotion ? 0.2 : 0.45,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block text-white"
                    style={{
                      textShadow:
                        '0 4px 18px rgba(0,0,0,0.9), 0 0 24px rgba(66, 217, 245, 0.22)',
                    }}
                  >
                    {letter}
                  </motion.span>
                );
              })}
            </div>

            {/* "AI" in Electric Cyan to Teal Brand Gradient with Restrained Glow */}
            <motion.div
              initial={{
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.75,
                filter: prefersReducedMotion ? 'none' : 'blur(10px)',
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
              }}
              transition={{
                delay: 2.25,
                duration: prefersReducedMotion ? 0.3 : 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex items-center font-extrabold text-3xl sm:text-5xl md:text-6xl font-sans tracking-wider"
            >
              <span className="bg-gradient-to-r from-[#42D9F5] via-[#22D3EE] to-[#27C6B8] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(66,217,245,0.6)]">
                AI
              </span>

              {/* Distinctive Technological Accent Indicator */}
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.5, duration: 0.35 }}
                className="hidden sm:inline-flex items-center gap-1 ml-3 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-900/50"
              >
                <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                CIVIC OS
              </motion.span>
            </motion.div>
          </div>

          {/* 
            ====================================================================
            PHASE 5: KANNADA TAGLINE (ಜನಸ್ಪಂದನ) & HORIZONTAL ACCENTS
            Exact Kannada typography with thin cyan/teal accent lines
            ====================================================================
          */}
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 2.65,
              duration: prefersReducedMotion ? 0.3 : 0.65,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full flex flex-col items-center mt-3 sm:mt-4"
          >
            {/* Kannada Tagline with Flanking Horizontal Accent Lines */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 w-full max-w-md">
              {/* Left Accent Rule */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 2.8, duration: 0.6, ease: 'easeOut' }}
                style={{ transformOrigin: 'right' }}
                className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/80 to-teal-400"
              />

              {/* Exact Kannada Tagline */}
              <div
                className="font-kannada font-semibold text-lg sm:text-2xl text-slate-100 tracking-wider px-2 select-none"
                style={{
                  textShadow: '0 0 16px rgba(66, 217, 245, 0.4)',
                }}
                title="ಜನಸ್ಪಂದನ — Janaspandana: Citizen Response & Civic Accountability"
              >
                ಜನಸ್ಪಂದನ
              </div>

              {/* Right Accent Rule */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 2.8, duration: 0.6, ease: 'easeOut' }}
                style={{ transformOrigin: 'left' }}
                className="flex-1 h-[1.5px] bg-gradient-to-r from-teal-400 via-cyan-400/80 to-transparent"
              />
            </div>

            {/* Muted Subtitle / English Micro-Caption */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 3.0, duration: 0.6 }}
              className="text-[10px] sm:text-xs text-cyan-300/80 font-mono tracking-[0.25em] sm:tracking-[0.3em] uppercase mt-1.5"
            >
              Intelligent Infrastructure & Incident Command
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* 
        ========================================================================
        BOTTOM TIMELINE / CINEMATIC PROGRESS BAR
        (Discrete and polished, indicates intro progression)
        ========================================================================
      */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900/60 overflow-hidden">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{
            duration: autoPlayDuration / 1000,
            ease: 'linear',
          }}
          className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-teal-400 opacity-70"
        />
      </div>
    </motion.div>
  );
};

export default LogoIntro;
