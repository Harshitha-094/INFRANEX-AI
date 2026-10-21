import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  glow?: 'cyan' | 'teal' | 'rose' | 'amber' | 'none';
  style?: React.CSSProperties;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = true,
  glow = 'none',
  style = {},
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const glowStyles = {
    cyan: 'hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/50',
    teal: 'hover:shadow-lg hover:shadow-teal-500/10 hover:border-teal-500/50',
    rose: 'hover:shadow-lg hover:shadow-rose-500/10 hover:border-rose-500/50',
    amber: 'hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/50',
    none: 'hover:border-slate-700',
  }[glow];

  if (prefersReducedMotion || !hoverEffect) {
    return (
      <div
        onClick={onClick}
        className={`rounded-2xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/30 transition-colors ${glowStyles} ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`rounded-2xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/30 transition-all ${glowStyles} ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
