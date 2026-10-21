import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

/**
 * INFRANEX AI — ScrollCharacterReveal
 * 
 * Based on Skiper UI Skiper 31 (Free with attribution)
 * Attribution: Skiper UI Skiper 31 — https://skiper-ui.com
 * 
 * Technique:
 * - Scroll-linked character progression using framer-motion useScroll & useTransform.
 * - Interpolates character displacement, subtle rotation and opacity into resting position.
 * - Subtle movement preserves readability without artificial long scrolling.
 * - Supports prefers-reduced-motion.
 */

interface CharacterProps {
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
  isHighlighted?: boolean;
}

const Character: React.FC<CharacterProps> = ({ char, progress, range, isHighlighted }) => {
  const opacity = useTransform(progress, range, [0.35, 1]);
  const x = useTransform(progress, range, [-6, 0]);
  const rotate = useTransform(progress, range, [-4, 0]);

  if (char === ' ') {
    return <span>&nbsp;</span>;
  }

  return (
    <motion.span
      style={{
        display: 'inline-block',
        opacity,
        x,
        rotate,
        willChange: 'transform, opacity',
      }}
      className={isHighlighted ? 'text-cyan-400 font-extrabold' : ''}
    >
      {char}
    </motion.span>
  );
};

export interface ScrollCharacterRevealProps {
  text: string;
  className?: string;
  highlightText?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'span';
  style?: React.CSSProperties;
}

export const ScrollCharacterReveal: React.FC<ScrollCharacterRevealProps> = ({
  text,
  className = '',
  highlightText = '',
  as = 'h1',
  style = {},
}) => {
  const containerRef = useRef<HTMLHeadingElement | HTMLDivElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 92%', 'start 35%'],
  });

  // If reduced motion is requested, render static text immediately
  if (prefersReducedMotion) {
    const Component = as as any;
    if (highlightText && text.includes(highlightText)) {
      const parts = text.split(highlightText);
      return (
        <Component className={className} style={style}>
          {parts[0]}
          <span className="text-cyan-400">{highlightText}</span>
          {parts[1]}
        </Component>
      );
    }
    return (
      <Component className={className} style={style}>
        {text}
      </Component>
    );
  }

  const characters = text.split('');
  const totalChars = characters.length;

  const Component = as as any;

  return (
    <Component
      ref={containerRef}
      className={`inline-flex flex-wrap ${className}`}
      style={style}
    >
      {characters.map((char, index) => {
        // Calculate progressive scroll window per character
        const step = 0.85 / Math.max(totalChars, 1);
        const start = index * step;
        const end = Math.min(1, start + step * 1.5);

        // Check if character falls inside highlightText span
        let isHighlighted = false;
        if (highlightText) {
          const highlightStart = text.indexOf(highlightText);
          if (highlightStart !== -1) {
            const highlightEnd = highlightStart + highlightText.length;
            isHighlighted = index >= highlightStart && index < highlightEnd;
          }
        }

        return (
          <Character
            key={index}
            char={char}
            progress={scrollYProgress}
            range={[start, end]}
            isHighlighted={isHighlighted}
          />
        );
      })}
    </Component>
  );
};

export default ScrollCharacterReveal;
