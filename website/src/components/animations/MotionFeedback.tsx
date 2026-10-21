import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Loader2, ShieldCheck, HardHat } from 'lucide-react';

export interface MotionFeedbackProps {
  status: 'loading' | 'success' | 'warning' | 'error' | 'verified' | 'dispatched';
  message: string;
  className?: string;
}

export const MotionFeedback: React.FC<MotionFeedbackProps> = ({
  status,
  message,
  className = '',
}) => {
  const configs = {
    loading: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />,
      bg: 'bg-cyan-950/40 border-cyan-800/80 text-cyan-300',
    },
    success: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      bg: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300',
    },
    warning: {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
      bg: 'bg-amber-950/40 border-amber-800/80 text-amber-300',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
      bg: 'bg-rose-950/40 border-rose-800/80 text-rose-300',
    },
    verified: {
      icon: <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />,
      bg: 'bg-teal-950/40 border-teal-800/80 text-teal-300',
    },
    dispatched: {
      icon: <HardHat className="w-3.5 h-3.5 text-blue-400" />,
      bg: 'bg-blue-950/40 border-blue-800/80 text-blue-300',
    },
  }[status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${status}-${message}`}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 4 }}
        transition={{ duration: 0.2 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md ${configs.bg} ${className}`}
      >
        {configs.icon}
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default MotionFeedback;
