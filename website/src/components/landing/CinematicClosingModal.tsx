import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InfrastructureCityBackground } from '../backgrounds/InfrastructureCityBackground';
import { Sparkles, ArrowRight, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { BrandEmblem } from '../brand/BrandEmblem';

export interface CinematicClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnToHero: () => void;
}

export const CinematicClosingModal: React.FC<CinematicClosingModalProps> = ({
  isOpen,
  onClose,
  onReturnToHero,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        {/* Background City Network Integration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
          <InfrastructureCityBackground />
        </div>

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-xl w-full p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 text-center space-y-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
            aria-label="Close closing experience"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Civic Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Civic Infrastructure Operations Session Complete</span>
          </div>

          {/* Elegant Final Wordmark */}
          <div className="flex flex-col items-center space-y-2">
            <BrandEmblem size={52} className="mb-1" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              INFRANEX <span className="text-cyan-400">AI</span>
            </h2>
            <div className="text-xs font-mono text-cyan-400/90 tracking-widest uppercase">
              Detect • Measure • Verify • Act • Prove
            </div>
          </div>

          {/* Kannada Brand Line */}
          <div className="py-3 px-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 inline-block">
            <span className="text-2xl sm:text-3xl font-light text-white tracking-wider font-sans">
              ಜನಸ್ಪಂದನ
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Bengaluru Municipal Incident Verification & Accountability Network
            </p>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            All validated civic evidence, contractor work orders, and recurrence telemetry
            remain securely synchronized with the central operational ledger.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onReturnToHero}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Return to Welcome Page</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Resume Operations Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CinematicClosingModal;
