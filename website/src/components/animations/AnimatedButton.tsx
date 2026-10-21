import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'glass' | 'outline';
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  loadingText,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 border-transparent',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold shadow-md shadow-rose-900/30 border-rose-800',
    glass:
      'bg-slate-900/70 hover:bg-slate-850 text-slate-200 border-slate-700/80 backdrop-blur-md shadow-sm',
    outline:
      'bg-transparent hover:bg-cyan-950/30 text-cyan-400 border-cyan-800/80 hover:border-cyan-600',
  }[variant];

  const baseClasses = `relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.97] ${variantStyles} ${className}`;

  if (prefersReducedMotion || disabled || isLoading) {
    return (
      <button className={baseClasses} disabled={disabled || isLoading} {...props}>
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {isLoading && loadingText ? loadingText : children}
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      className={baseClasses}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {isLoading && loadingText ? loadingText : children}
    </motion.button>
  );
};

export default AnimatedButton;
