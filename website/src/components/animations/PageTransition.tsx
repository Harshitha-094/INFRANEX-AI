import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * INFRANEX AI — PageTransition
 * 
 * Reusable page and section transition wrapper.
 * Provides smooth, elegant cross-fade and subtle vertical glide
 * when switching between operational modules without remounting
 * the infrastructure background or application shell.
 */

export interface PageTransitionProps {
  activeKey: string;
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  activeKey,
  children,
  className = '',
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 12, filter: 'blur(3px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -8, filter: 'blur(2px)' },
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          duration: prefersReducedMotion ? 0.05 : 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`w-full ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
