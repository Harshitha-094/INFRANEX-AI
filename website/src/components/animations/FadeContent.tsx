import React, { useEffect, useRef, useId, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface FadeContentProps {
  children: React.ReactNode;
  effect?: 'mist' | 'fade' | 'dissolve' | 'pixel';
  duration?: number;
  delay?: number;
  ease?: string;
  threshold?: number;
  stagger?: number;
  trigger?: 'mount' | 'scroll';
  scroller?: string | HTMLElement | null;
  className?: string;
  style?: React.CSSProperties;
}

export const FadeContent: React.FC<FadeContentProps> = ({
  children,
  effect = 'mist',
  duration = 1.2,
  delay = 0,
  ease = 'power2.out',
  threshold = 0.1,
  stagger = 0,
  trigger = 'mount',
  scroller = null,
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const rawId = useId();
  const filterId = `fade-content-filter-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    setIsRendered(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Reveal immediately without animation in reduced-motion mode
      const elements = stagger > 0 ? Array.from(container.children) : [container];
      elements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.filter = 'none';
        }
      });
      return;
    }

    const ctx = gsap.context(() => {
      // Target direct children for stagger, excluding any inline filter SVG
      const rawChildren = Array.from(container.children).filter(
        (child) => child.tagName.toLowerCase() !== 'svg'
      );
      const targets = stagger > 0 && rawChildren.length > 0 ? rawChildren : [container];

      // Configuration per effect
      let initialDisplacement = 30;
      let initialBlur = 8;
      let baseFrequency = '0.04 0.04';

      if (effect === 'dissolve') {
        initialDisplacement = 45;
        initialBlur = 4;
        baseFrequency = '0.08 0.08';
      } else if (effect === 'pixel') {
        initialDisplacement = 50;
        initialBlur = 0;
        baseFrequency = '0.12 0.02';
      } else if (effect === 'fade') {
        initialDisplacement = 0;
        initialBlur = 0;
      }

      if (turbulenceRef.current) {
        turbulenceRef.current.setAttribute('baseFrequency', baseFrequency);
      }
      if (displacementRef.current) {
        displacementRef.current.setAttribute('scale', initialDisplacement.toString());
      }

      const useFilter = effect !== 'fade' && initialDisplacement > 0;

      // Initial CSS states
      targets.forEach((target) => {
        if (target instanceof HTMLElement) {
          target.style.opacity = '0';
          target.style.transform = 'translateY(16px)';
          if (useFilter) {
            target.style.filter = `url(#${filterId}) blur(${initialBlur}px)`;
          }
        }
      });

      // Animation timeline
      const tl = gsap.timeline({
        paused: true,
        delay: delay,
        onComplete: () => {
          // Clear filter and transforms to restore 100% native sharpness
          targets.forEach((target) => {
            if (target instanceof HTMLElement) {
              target.style.opacity = '1';
              target.style.transform = '';
              target.style.filter = '';
            }
          });
        },
      });

      // Filter proxy for smooth displacement/blur animation
      const filterProxy = {
        displacement: initialDisplacement,
        blur: initialBlur,
      };

      tl.to(
        targets,
        {
          opacity: 1,
          y: 0,
          duration: duration,
          ease: ease,
          stagger: stagger > 0 ? stagger : undefined,
        },
        0
      );

      if (useFilter) {
        tl.to(
          filterProxy,
          {
            displacement: 0,
            blur: 0,
            duration: duration,
            ease: ease,
            onUpdate: () => {
              if (displacementRef.current) {
                displacementRef.current.setAttribute(
                  'scale',
                  filterProxy.displacement.toFixed(2)
                );
              }
              targets.forEach((target) => {
                if (target instanceof HTMLElement) {
                  if (filterProxy.blur > 0.1) {
                    target.style.filter = `url(#${filterId}) blur(${filterProxy.blur.toFixed(1)}px)`;
                  } else {
                    target.style.filter = '';
                  }
                }
              });
            },
          },
          0
        );
      }

      if (trigger === 'mount') {
        tl.play();
      } else if (trigger === 'scroll') {
        // Resolve scroll container
        let resolvedScroller: HTMLElement | Window = window;
        if (scroller) {
          if (typeof scroller === 'string') {
            const found = document.querySelector(scroller);
            if (found instanceof HTMLElement) resolvedScroller = found;
          } else if (scroller instanceof HTMLElement) {
            resolvedScroller = scroller;
          }
        } else {
          // Auto-detect closest overflow scroll container only if it actually has active scrollable overflow
          const closestScrollable = container.closest('.overflow-y-auto, [data-scroll-container]');
          if (
            closestScrollable instanceof HTMLElement &&
            closestScrollable.scrollHeight > closestScrollable.clientHeight + 10
          ) {
            resolvedScroller = closestScrollable;
          } else {
            resolvedScroller = window;
          }
        }

        const triggerPercent = Math.max(0, Math.min(100, Math.round((1 - threshold) * 100)));

        ScrollTrigger.create({
          trigger: container,
          scroller: resolvedScroller,
          start: `top ${triggerPercent}%`,
          once: true,
          onEnter: () => tl.play(),
        });

        // Fail-safe: if already visible inside viewport on initial render, reveal immediately
        const rect = container.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          tl.play();
        }

        // Secondary fail-safe: IntersectionObserver guarantees visibility even if scroll container metrics differ
        if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  tl.play();
                  observer.disconnect();
                }
              });
            },
            { threshold: Math.min(0.1, threshold) }
          );
          observer.observe(container);
        }
      }
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [effect, duration, delay, ease, threshold, stagger, trigger, scroller, filterId, isRendered]);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={style}>
      {/* SVG feTurbulence filter definition */}
      {effect !== 'fade' && (
        <svg
          className="absolute w-0 h-0 pointer-events-none -z-50 overflow-hidden"
          style={{ width: 0, height: 0, position: 'absolute' }}
          aria-hidden="true"
        >
          <defs>
            <filter
              id={filterId}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                ref={turbulenceRef}
                type="fractalNoise"
                baseFrequency="0.04 0.04"
                numOctaves={3}
                result="noise"
              />
              <feDisplacementMap
                ref={displacementRef}
                in="SourceGraphic"
                in2="noise"
                scale="30"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
      {children}
    </div>
  );
};
