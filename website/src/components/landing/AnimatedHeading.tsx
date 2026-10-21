import React, { useEffect, useState, useMemo } from 'react';

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({
  text,
  className = '',
  style = {},
}) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    // Initial trigger after mount
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 20);

    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  const lines = useMemo(() => text.split('\n'), [text]);

  const initialDelay = 200; // ms
  const charDelay = 30; // ms
  const duration = 500; // ms

  return (
    <h1 className={className} style={style}>
      {lines.map((line, lineIndex) => {
        // Calculate characters accumulated before this line
        const charsBeforeLine = lines
          .slice(0, lineIndex)
          .reduce((sum, prevLine) => sum + prevLine.length, 0);

        return (
          <span key={lineIndex} className="block whitespace-nowrap">
            {line.split('').map((char, charIndex) => {
              // Calculate character delay: initialDelay + line offset + char offset
              const delay = prefersReducedMotion
                ? 0
                : initialDelay + (charsBeforeLine * charDelay) + (charIndex * charDelay);

              const displayChar = char === ' ' ? '\u00A0' : char;

              return (
                <span
                  key={charIndex}
                  style={{
                    display: 'inline-block',
                    opacity: isAnimated || prefersReducedMotion ? 1 : 0,
                    transform:
                      isAnimated || prefersReducedMotion
                        ? 'translateX(0)'
                        : 'translateX(-18px)',
                    transitionProperty: 'opacity, transform',
                    transitionDuration: prefersReducedMotion ? '0ms' : `${duration}ms`,
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: `${delay}ms`,
                    willChange: 'opacity, transform',
                  }}
                >
                  {displayChar}
                </span>
              );
            })}
          </span>
        );
      })}
    </h1>
  );
};
