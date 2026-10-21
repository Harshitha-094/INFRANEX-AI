import React, { useState, useRef } from 'react';
import { AnimatedHeading } from './AnimatedHeading';
import { FadeIn } from './FadeIn';
import { BrandEmblem } from '../brand/BrandEmblem';

interface CinematicHeroProps {
  onEnter: (targetTab?: string) => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onEnter }) => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl =
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4';

  const headingText = 'INFRANEX AI\nShaping tomorrow\nwith vision and action.';

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-slate-950 font-sans selection:bg-white selection:text-black">
      {/* 
        Full-Screen Background Video
        CRITICAL: Video is kept at original brightness with NO dark overlays,
        NO gradient layers, and NO filters per specifications.
      */}
      {!videoError ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          src={videoUrl}
        />
      ) : (
        /* Neutral fallback if video fails to load without blocking application access */
        <div className="absolute inset-0 w-full h-full bg-slate-950 z-0" />
      )}

      {/* Top Navbar */}
      <header className="relative z-10 w-full px-6 md:px-12 lg:px-16 pt-6">
        <nav
          aria-label="Hero Navigation"
          className="liquid-glass rounded-xl px-4 py-2.5 flex items-center justify-between"
        >
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <BrandEmblem size={32} />
            <div className="flex items-center">
              <span className="text-2xl font-semibold tracking-tight text-white select-none">
                INFRANEX AI
              </span>
              <span className="text-xs text-slate-300/80 font-normal ml-3 hidden sm:inline border-l border-white/20 pl-3">
                Civic Infrastructure Platform
              </span>
            </div>
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-white">
            <button
              onClick={() => onEnter('dashboard')}
              className="hover:text-gray-300 transition-colors duration-200 cursor-pointer focus:outline-none focus:underline"
            >
              Overview
            </button>
            <button
              onClick={() => onEnter('cases')}
              className="hover:text-gray-300 transition-colors duration-200 cursor-pointer focus:outline-none focus:underline"
            >
              Incidents
            </button>
            <button
              onClick={() => onEnter('hotspots')}
              className="hover:text-gray-300 transition-colors duration-200 cursor-pointer focus:outline-none focus:underline"
            >
              Hotspots
            </button>
            <button
              onClick={() => onEnter('role-view')}
              className="hover:text-gray-300 transition-colors duration-200 cursor-pointer focus:outline-none focus:underline"
            >
              Infrastructure
            </button>
          </div>

          {/* Right: Primary Call to Action */}
          <div>
            <button
              onClick={() => onEnter('dashboard')}
              className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors duration-200 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60 active:scale-95"
            >
              Open Dashboard
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content Area - Positioned near bottom of the viewport */}
      <main className="relative z-10 w-full px-6 md:px-12 lg:px-16 flex flex-col flex-1 justify-end pb-12 lg:pb-16">
        <div className="w-full lg:grid lg:grid-cols-2 lg:items-end gap-8">
          {/* Left Column: Heading, Subheading & CTAs */}
          <div className="max-w-3xl">
            {/* Character-by-character animated heading with line breaks */}
            <AnimatedHeading
              text={headingText}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal text-white mb-4 leading-tight tracking-tight select-none"
              style={{ letterSpacing: '-0.04em' }}
            />

            {/* Tagline & Subheading with 800ms delay fade reveal */}
            <FadeIn delay={800} duration={1000}>
              <div className="flex items-center gap-2 mb-2 text-cyan-400 font-mono text-xs sm:text-sm tracking-widest uppercase font-semibold">
                <span>Detect</span> • <span>Measure</span> • <span>Verify</span> • <span>Act</span> • <span>Prove</span>
              </div>
              <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed max-w-xl">
                AI-assisted civic infrastructure monitoring, verification, and
                accountable repair management.
              </p>
            </FadeIn>

            {/* Primary & Secondary Buttons with 1200ms delay fade reveal */}
            <FadeIn delay={1200} duration={1000}>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onEnter('dashboard')}
                  className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 cursor-pointer shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60 active:scale-95 text-sm sm:text-base"
                >
                  Explore the Platform
                </button>

                <button
                  onClick={() => onEnter('dashboard')}
                  className="liquid-glass border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-all duration-300 cursor-pointer shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60 active:scale-95 text-sm sm:text-base"
                >
                  View Operations Dashboard
                </button>

                <button
                  onClick={() => onEnter('dashboard')}
                  className="text-xs text-slate-400 hover:text-white underline underline-offset-4 px-2 py-2 transition-colors cursor-pointer"
                >
                  Skip Intro →
                </button>
              </div>
            </FadeIn>
          </div>

          {/* Right Column: Glass Information Card with Kannada Tagline */}
          <div className="flex items-end justify-start lg:justify-end mt-8 lg:mt-0">
            <FadeIn delay={1400} duration={1000}>
              <div
                className="liquid-glass border border-white/20 px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 select-none"
                title="Janaspandana - Citizen Response & Civic Accountability"
              >
                <span className="text-lg md:text-xl lg:text-2xl font-light text-white tracking-wide">
                  ಜನಸ್ಪಂದನ
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </main>
    </div>
  );
};
