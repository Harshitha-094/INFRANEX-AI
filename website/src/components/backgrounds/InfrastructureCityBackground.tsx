import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * INFRANEX AI — Complete 2.5D Animated Smart-City Environment
 * 
 * Replaces the previous thin wireframe and giant intersecting lines with a rich,
 * colourful, miniature futuristic city environment:
 * 
 * 1. Physical Curved Elevated Roads & Flyovers:
 *    - Real asphalt decks (28-36px wide), concrete barriers, lane dividers,
 *      zebra pedestrian crossings, streetlights, and viaduct support piers.
 * 2. Realistic 2.5D City Architecture:
 *    - Glass skyscrapers, tech campuses, residential towers, illuminated windows,
 *      rooftop helipads, solar arrays, and slow-pulsing beacons.
 * 3. Green Infrastructure:
 *    - Urban pocket parks, tree canopies with natural greens (#52CFA0) and teal highlights,
 *      landscaped road dividers, and green rooftops.
 * 4. Animated Vehicles with Curve-Tangent Rotation:
 *    - Electric cars, city buses, municipal service vehicles following Bezier curves,
 *      projecting headlights forward and red taillights behind.
 * 5. Smart-City AI Telemetry & Environmental Lighting:
 *    - Traveling highway light pulses, cycling traffic signals, radar telemetry hubs,
 *      and active incident visual emphasis.
 * 6. High Performance & Accessibility:
 *    - Single RAF loop, DPR scaling, tab pause, and prefers-reduced-motion support.
 */

interface Point2D {
  x: number;
  y: number;
}

interface BezierRoad {
  id: string;
  p0: Point2D;
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;
  width: number;
  isElevated: boolean;
  hasPillars: boolean;
  hasLights: boolean;
  hasCrosswalks?: boolean;
}

interface Vehicle {
  id: number;
  roadIndex: number;
  t: number;
  speed: number;
  laneOffset: number; // offset perpendicular to curve
  length: number;
  width: number;
  type: 'ev' | 'sedan' | 'bus' | 'service';
  bodyColor: string;
  hasBeacon?: boolean;
}

interface Building3D {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  type: 'glass-tower' | 'tech-campus' | 'residential' | 'civic-dome' | 'skybridge-twin';
  accentColor: string;
  leftFill: string;
  rightFill: string;
  roofFill: string;
  floors: number;
  hasSpire: boolean;
  hasHelipad: boolean;
  hasGreenRoof: boolean;
  windowState: number[]; // brightness per floor
}

interface TreeCanopy {
  x: number;
  y: number;
  radius: number;
  height: number;
  hueShift: number;
}

interface TelemetryNode {
  x: number;
  y: number;
  label: string;
  subLabel: string;
  pulsePhase: number;
  isPrimary?: boolean;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

// Cubic Bezier evaluation
function getCubicBezierPoint(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

// Cubic Bezier first derivative (tangent)
function getCubicBezierTangent(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  return {
    x: 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x),
    y: 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y),
  };
}

export const InfrastructureCityBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedIncident } = useApp();
  const selectedIncidentRef = useRef(selectedIncident);

  useEffect(() => {
    selectedIncidentRef.current = selectedIncident;
  }, [selectedIncident]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isPaused = false;
    let lastRenderTime = 0;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // High-DPI Canvas Sizing
    let dpr = 1;
    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();

    // Procedural 2.5D Miniature Smart-City World Generator
    const buildCityScene = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // 1. Curved Highway Corridors
      const roads: BezierRoad[] = [
        // Primary Elevated Expressway (Outer Ring Road / Elevated Corridor)
        {
          id: 'expressway-arterial',
          p0: { x: -w * 0.05, y: h * 0.44 },
          p1: { x: w * 0.32, y: h * 0.28 },
          p2: { x: w * 0.64, y: h * 0.62 },
          p3: { x: w * 1.05, y: h * 0.45 },
          width: 32,
          isElevated: true,
          hasPillars: true,
          hasLights: true,
        },
        // Secondary Flyover Skyway
        {
          id: 'skyway-flyover',
          p0: { x: w * 0.16, y: h * 0.95 },
          p1: { x: w * 0.40, y: h * 0.68 },
          p2: { x: w * 0.70, y: h * 0.34 },
          p3: { x: w * 0.96, y: -h * 0.04 },
          width: 26,
          isElevated: true,
          hasPillars: true,
          hasLights: true,
        },
        // Highway Interchange Ramp
        {
          id: 'interchange-ramp',
          p0: { x: w * 0.40, y: h * 0.68 },
          p1: { x: w * 0.52, y: h * 0.54 },
          p2: { x: w * 0.46, y: h * 0.46 },
          p3: { x: w * 0.58, y: h * 0.50 },
          width: 18,
          isElevated: true,
          hasPillars: true,
          hasLights: false,
        },
        // Ground-Level Civic Boulevard
        {
          id: 'civic-boulevard',
          p0: { x: -w * 0.05, y: h * 0.76 },
          p1: { x: w * 0.30, y: h * 0.80 },
          p2: { x: w * 0.68, y: h * 0.72 },
          p3: { x: w * 1.05, y: h * 0.82 },
          width: 28,
          isElevated: false,
          hasPillars: false,
          hasLights: true,
          hasCrosswalks: true,
        },
      ];

      // 2. Multi-Class Vehicles
      const vehicles: Vehicle[] = [
        // Expressway Traffic
        { id: 1, roadIndex: 0, t: 0.12, speed: 0.00085, laneOffset: -6, length: 14, width: 7, type: 'ev', bodyColor: '#42D9F5' },
        { id: 2, roadIndex: 0, t: 0.34, speed: 0.00075, laneOffset: 6, length: 24, width: 8, type: 'bus', bodyColor: '#27C6B8' },
        { id: 3, roadIndex: 0, t: 0.58, speed: 0.00110, laneOffset: -6, length: 13, width: 6.5, type: 'sedan', bodyColor: '#FFFFFF' },
        { id: 4, roadIndex: 0, t: 0.82, speed: 0.00095, laneOffset: 6, length: 16, width: 7.5, type: 'service', bodyColor: '#FFBF69', hasBeacon: true },
        { id: 5, roadIndex: 0, t: 0.02, speed: 0.00105, laneOffset: -6, length: 13, width: 6.5, type: 'ev', bodyColor: '#9270FF' },

        // Skyway Traffic
        { id: 6, roadIndex: 1, t: 0.20, speed: 0.00090, laneOffset: -5, length: 13, width: 6.5, type: 'sedan', bodyColor: '#38BDF8' },
        { id: 7, roadIndex: 1, t: 0.48, speed: 0.00070, laneOffset: 5, length: 22, width: 8, type: 'bus', bodyColor: '#52CFA0' },
        { id: 8, roadIndex: 1, t: 0.75, speed: 0.00115, laneOffset: -5, length: 12, width: 6, type: 'ev', bodyColor: '#E56BD8' },
        { id: 9, roadIndex: 1, t: 0.92, speed: 0.00085, laneOffset: 5, length: 15, width: 7, type: 'service', bodyColor: '#F59E0B', hasBeacon: true },

        // Ramp Connector
        { id: 10, roadIndex: 2, t: 0.15, speed: 0.00065, laneOffset: 0, length: 13, width: 6.5, type: 'ev', bodyColor: '#27C6B8' },
        { id: 11, roadIndex: 2, t: 0.70, speed: 0.00072, laneOffset: 0, length: 14, width: 7, type: 'sedan', bodyColor: '#E2E8F0' },

        // Boulevard Ground Traffic
        { id: 12, roadIndex: 3, t: 0.18, speed: 0.00060, laneOffset: -5, length: 22, width: 8, type: 'bus', bodyColor: '#477BFF' },
        { id: 13, roadIndex: 3, t: 0.42, speed: 0.00080, laneOffset: 5, length: 13, width: 6.5, type: 'ev', bodyColor: '#42D9F5' },
        { id: 14, roadIndex: 3, t: 0.65, speed: 0.00075, laneOffset: -5, length: 15, width: 7.5, type: 'service', bodyColor: '#FFBF69', hasBeacon: true },
        { id: 15, roadIndex: 3, t: 0.88, speed: 0.00085, laneOffset: 5, length: 13, width: 6.5, type: 'sedan', bodyColor: '#CBD5E1' },
      ];

      // 3. Buildings with True 3D Geometry and Varied Architecture
      const buildings: Building3D[] = [];
      const cols = Math.max(6, Math.floor(w / 180));
      const rows = Math.max(4, Math.floor(h / 160));

      const types: Building3D['type'][] = [
        'glass-tower',
        'tech-campus',
        'residential',
        'civic-dome',
        'skybridge-twin',
      ];
      const accents = ['#42D9F5', '#27C6B8', '#477BFF', '#9270FF', '#E56BD8'];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Leave open vistas and road corridors
          if ((r * 2 + c * 3) % 4 === 1) continue;

          const bx = (w / (cols + 0.5)) * (c + 0.5) + ((r % 2 === 0 ? 1 : -1) * 28);
          const by = (h / (rows + 0.5)) * (r + 0.6) + ((c % 2 === 0 ? -1 : 1) * 20);

          const bWidth = 32 + ((c * 7) % 24);
          const bDepth = 24 + ((r * 9) % 20);
          const bHeight = 55 + ((c * r * 19) % 95);
          const type = types[(c + r) % types.length];
          const accent = accents[(c * 2 + r) % accents.length];
          const floors = Math.max(4, Math.floor(bHeight / 14));

          const windowState: number[] = [];
          for (let f = 0; f < floors; f++) {
            windowState.push(Math.random());
          }

          buildings.push({
            x: bx,
            y: by,
            w: bWidth,
            d: bDepth,
            h: bHeight,
            type,
            accentColor: accent,
            leftFill: 'rgba(16, 24, 40, 0.94)',
            rightFill: 'rgba(11, 17, 28, 0.96)',
            roofFill: 'rgba(20, 32, 54, 0.98)',
            floors,
            hasSpire: bHeight > 85 || (c + r) % 3 === 0,
            hasHelipad: bHeight > 100 && (c % 2 === 0),
            hasGreenRoof: type === 'tech-campus' || (c + r) % 4 === 0,
            windowState,
          });
        }
      }

      // Sort back-to-front
      buildings.sort((a, b) => a.y - b.y);

      // 4. Green Infrastructure (Trees and Parks)
      const trees: TreeCanopy[] = [];
      // Trees along ground boulevard
      for (let i = 0; i < 28; i++) {
        const t = (i + 0.5) / 28;
        const pt = getCubicBezierPoint(t, roads[3].p0, roads[3].p1, roads[3].p2, roads[3].p3);
        const tan = getCubicBezierTangent(t, roads[3].p0, roads[3].p1, roads[3].p2, roads[3].p3);
        const len = Math.hypot(tan.x, tan.y) || 1;
        const nx = -tan.y / len;
        const ny = tan.x / len;

        // Tree on north side of boulevard
        trees.push({
          x: pt.x + nx * (roads[3].width * 0.75 + 10),
          y: pt.y + ny * (roads[3].width * 0.75 + 10),
          radius: 8 + (i % 5),
          height: 12 + (i % 6),
          hueShift: (i % 4) * 0.08,
        });

        // Occasional tree on south side
        if (i % 2 === 0) {
          trees.push({
            x: pt.x - nx * (roads[3].width * 0.75 + 12),
            y: pt.y - ny * (roads[3].width * 0.75 + 12),
            radius: 7 + (i % 4),
            height: 11 + (i % 5),
            hueShift: (i % 3) * 0.1,
          });
        }
      }

      // Urban pocket park clusters
      const parkCenters = [
        { x: w * 0.22, y: h * 0.58 },
        { x: w * 0.78, y: h * 0.78 },
      ];
      parkCenters.forEach((center) => {
        for (let k = 0; k < 12; k++) {
          const ang = (k / 12) * Math.PI * 2;
          const dist = 14 + (k % 4) * 12;
          trees.push({
            x: center.x + Math.cos(ang) * dist,
            y: center.y + Math.sin(ang) * dist * 0.6,
            radius: 8 + (k % 5),
            height: 13 + (k % 6),
            hueShift: 0.12,
          });
        }
      });

      // 5. Civic Telemetry Monitoring Nodes
      const telemetryNodes: TelemetryNode[] = [
        { x: w * 0.18, y: h * 0.22, label: 'BBMP-NORTH-HEBBAL', subLabel: 'Node 01 • Telemetry 42ms', pulsePhase: 0, isPrimary: true },
        { x: w * 0.50, y: h * 0.18, label: 'BBMP-CBD-COMMAND', subLabel: 'Central Hub • Online', pulsePhase: 1.5, isPrimary: true },
        { x: w * 0.82, y: h * 0.28, label: 'BBMP-EAST-ORR', subLabel: 'Tech Corridor • 99.4% SLA', pulsePhase: 2.8, isPrimary: true },
        { x: w * 0.26, y: h * 0.74, label: 'BBMP-SOUTH-METRO', subLabel: 'Transit Zone • Active', pulsePhase: 0.9 },
        { x: w * 0.62, y: h * 0.68, label: 'BBMP-WEST-VIJAYANAGAR', subLabel: 'Civic Station • Synced', pulsePhase: 2.1 },
        { x: w * 0.86, y: h * 0.80, label: 'BBMP-ECITY-TECH', subLabel: 'Industrial Grid • Nominal', pulsePhase: 1.2 },
      ];

      // 6. Ambient Particulate Sensors
      const particles: AmbientParticle[] = [];
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.15 - Math.random() * 0.22,
          size: 1.0 + Math.random() * 1.8,
          alpha: 0.15 + Math.random() * 0.25,
        });
      }

      return { roads, vehicles, buildings, trees, telemetryNodes, particles };
    };

    let cityScene = buildCityScene();

    // Central Renderer Function
    const render = (time: number) => {
      lastRenderTime = time;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // --- LAYER 0: Distant Horizon Lighting & Atmospheric Sky ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#06080F');
      skyGrad.addColorStop(0.5, '#080C16');
      skyGrad.addColorStop(1, '#0C1322');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Horizon atmospheric glows
      const horizonGlow = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.6);
      horizonGlow.addColorStop(0, 'rgba(66, 217, 245, 0.08)');
      horizonGlow.addColorStop(0.4, 'rgba(39, 198, 184, 0.04)');
      horizonGlow.addColorStop(1, 'rgba(6, 8, 15, 0)');
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, 0, w, h);

      // --- LAYER 1: Distant City Skyline Silhouettes ---
      const skylineSteps = 24;
      for (let s = 0; s < skylineSteps; s++) {
        const sx = (w / skylineSteps) * s;
        const sw = w / skylineSteps + 4;
        const sh = 40 + ((s * 23) % 75);
        const sy = h * 0.38 - sh;

        ctx.fillStyle = 'rgba(13, 20, 36, 0.85)';
        ctx.fillRect(sx, sy, sw, sh + h * 0.3);

        // Faint skyline antenna
        if (s % 3 === 0) {
          ctx.strokeStyle = 'rgba(66, 217, 245, 0.35)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sx + sw / 2, sy);
          ctx.lineTo(sx + sw / 2, sy - 14);
          ctx.stroke();

          // Spire beacon
          const spirePulse = Math.sin(time * 0.003 + s);
          ctx.fillStyle = spirePulse > 0.3 ? '#42D9F5' : 'rgba(66, 217, 245, 0.2)';
          ctx.beginPath();
          ctx.arc(sx + sw / 2, sy - 14, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- LAYER 2: Urban Pocket Parks & Turf Base ---
      ctx.fillStyle = 'rgba(18, 54, 34, 0.45)';
      // Park 1
      ctx.beginPath();
      ctx.ellipse(w * 0.22, h * 0.58, 65, 38, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(39, 198, 184, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Park 2
      ctx.beginPath();
      ctx.ellipse(w * 0.78, h * 0.78, 75, 42, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // --- LAYER 3: 2.5D Midground & Foreground City Buildings ---
      for (let i = 0; i < cityScene.buildings.length; i++) {
        const b = cityScene.buildings[i];
        const isoX = b.x;
        const isoY = b.y;
        const bw = b.w;
        const bd = b.d;
        const bh = b.h;

        // Front Left Facade
        ctx.beginPath();
        ctx.moveTo(isoX, isoY);
        ctx.lineTo(isoX - bw * 0.5, isoY + bw * 0.25);
        ctx.lineTo(isoX - bw * 0.5, isoY + bw * 0.25 - bh);
        ctx.lineTo(isoX, isoY - bh);
        ctx.closePath();
        ctx.fillStyle = b.leftFill;
        ctx.fill();
        ctx.strokeStyle = 'rgba(66, 217, 245, 0.24)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Left Face Windows
        const floorStep = bh / b.floors;
        for (let f = 1; f < b.floors; f++) {
          const fy = isoY - f * floorStep;
          const winLight = (b.windowState[f] + Math.sin(time * 0.0015 + f * 1.5)) * 0.5;
          const winColor =
            winLight > 0.65
              ? b.accentColor
              : winLight > 0.35
              ? 'rgba(255, 191, 105, 0.75)' // warm amber
              : 'rgba(66, 217, 245, 0.18)'; // soft idle

          ctx.strokeStyle = winColor;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(isoX - 3, fy);
          ctx.lineTo(isoX - bw * 0.45, fy + bw * 0.22);
          ctx.stroke();
        }

        // Front Right Facade
        ctx.beginPath();
        ctx.moveTo(isoX, isoY);
        ctx.lineTo(isoX + bd * 0.5, isoY + bd * 0.25);
        ctx.lineTo(isoX + bd * 0.5, isoY + bd * 0.25 - bh);
        ctx.lineTo(isoX, isoY - bh);
        ctx.closePath();
        ctx.fillStyle = b.rightFill;
        ctx.fill();
        ctx.strokeStyle = 'rgba(39, 198, 184, 0.20)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Right Face Windows
        for (let f = 1; f < b.floors; f++) {
          const fy = isoY - f * floorStep;
          ctx.strokeStyle = 'rgba(66, 217, 245, 0.14)';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(isoX + 3, fy);
          ctx.lineTo(isoX + bd * 0.45, fy + bd * 0.22);
          ctx.stroke();
        }

        // Top Roof Plate
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - bh);
        ctx.lineTo(isoX - bw * 0.5, isoY + bw * 0.25 - bh);
        ctx.lineTo(isoX + (bd - bw) * 0.5, isoY + (bd + bw) * 0.25 - bh);
        ctx.lineTo(isoX + bd * 0.5, isoY + bd * 0.25 - bh);
        ctx.closePath();

        if (b.hasGreenRoof) {
          ctx.fillStyle = '#1B472E'; // Lush sustainable rooftop garden
        } else {
          ctx.fillStyle = b.roofFill;
        }
        ctx.fill();
        ctx.strokeStyle = b.accentColor;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        const roofCenterX = isoX + (bd - bw) * 0.25;
        const roofCenterY = isoY + (bd + bw) * 0.125 - bh;

        // Helipad Marking
        if (b.hasHelipad) {
          ctx.strokeStyle = 'rgba(255, 191, 105, 0.85)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(roofCenterX, roofCenterY, 7, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 191, 105, 0.90)';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('H', roofCenterX, roofCenterY);
        }

        // Rooftop Telemetry Antenna Spire with Slow Beacon
        if (b.hasSpire) {
          const spireH = 16;
          ctx.strokeStyle = b.accentColor;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(roofCenterX, roofCenterY);
          ctx.lineTo(roofCenterX, roofCenterY - spireH);
          ctx.stroke();

          const beaconPulse = Math.sin(time * 0.003 + i);
          const beaconAlpha = 0.4 + 0.6 * Math.max(0, beaconPulse);

          ctx.fillStyle = `rgba(66, 217, 245, ${beaconAlpha})`;
          ctx.beginPath();
          ctx.arc(roofCenterX, roofCenterY - spireH, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(roofCenterX, roofCenterY - spireH, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- LAYER 4: Trees & Natural Green Infrastructure ---
      for (let i = 0; i < cityScene.trees.length; i++) {
        const tree = cityScene.trees[i];
        // Trunk
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y);
        ctx.lineTo(tree.x, tree.y - tree.height * 0.4);
        ctx.stroke();

        // Organic Layered Foliage Canopy
        const canopyGrad = ctx.createRadialGradient(
          tree.x - 2,
          tree.y - tree.height * 0.7,
          1,
          tree.x,
          tree.y - tree.height * 0.6,
          tree.radius
        );
        canopyGrad.addColorStop(0, '#52CFA0'); // Natural lush green
        canopyGrad.addColorStop(0.65, '#2D8A56');
        canopyGrad.addColorStop(1, '#133D27');

        ctx.fillStyle = canopyGrad;
        ctx.beginPath();
        ctx.arc(tree.x, tree.y - tree.height * 0.6, tree.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle teal highlight on crown
        ctx.strokeStyle = 'rgba(39, 198, 184, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // --- LAYER 5: Realistic Physical Roads, Elevated Viaducts & Bridges ---
      cityScene.roads.forEach((road) => {
        // A. Viaduct Concrete Pillars (for elevated roads)
        if (road.hasPillars) {
          const pillarSteps = [0.15, 0.32, 0.50, 0.68, 0.85];
          pillarSteps.forEach((t) => {
            const pt = getCubicBezierPoint(t, road.p0, road.p1, road.p2, road.p3);
            const pillarGroundY = Math.min(h, pt.y + 40);

            // Concrete Column
            ctx.fillStyle = 'rgba(17, 24, 39, 0.92)';
            ctx.fillRect(pt.x - 4, pt.y, 8, pillarGroundY - pt.y);

            // Crosshead support beam
            ctx.fillStyle = 'rgba(31, 41, 55, 0.95)';
            ctx.fillRect(pt.x - 12, pt.y, 24, 5);

            // Edge highlight
            ctx.strokeStyle = 'rgba(66, 217, 245, 0.18)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(pt.x - 4, pt.y, 8, pillarGroundY - pt.y);
          });
        }

        // B. Deep Concrete Road Bed (Foundation)
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.lineWidth = road.width + 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(road.p0.x, road.p0.y);
        ctx.bezierCurveTo(road.p1.x, road.p1.y, road.p2.x, road.p2.y, road.p3.x, road.p3.y);
        ctx.stroke();

        // C. Dark Asphalt Road Surface
        ctx.strokeStyle = '#0E1424'; // Realistic matte asphalt
        ctx.lineWidth = road.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(road.p0.x, road.p0.y);
        ctx.bezierCurveTo(road.p1.x, road.p1.y, road.p2.x, road.p2.y, road.p3.x, road.p3.y);
        ctx.stroke();

        // D. Outer Barrier Curb Lines & Cyan LED Safety Strip
        const sampleCount = 40;
        const leftBarrier: Point2D[] = [];
        const rightBarrier: Point2D[] = [];

        for (let s = 0; s <= sampleCount; s++) {
          const t = s / sampleCount;
          const pt = getCubicBezierPoint(t, road.p0, road.p1, road.p2, road.p3);
          const tan = getCubicBezierTangent(t, road.p0, road.p1, road.p2, road.p3);
          const len = Math.hypot(tan.x, tan.y) || 1;
          const nx = -tan.y / len;
          const ny = tan.x / len;

          leftBarrier.push({
            x: pt.x + nx * (road.width * 0.5 - 1.5),
            y: pt.y + ny * (road.width * 0.5 - 1.5),
          });
          rightBarrier.push({
            x: pt.x - nx * (road.width * 0.5 - 1.5),
            y: pt.y - ny * (road.width * 0.5 - 1.5),
          });
        }

        // Draw left barrier neon strip
        ctx.strokeStyle = 'rgba(66, 217, 245, 0.40)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        leftBarrier.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Draw right barrier neon strip
        ctx.strokeStyle = 'rgba(39, 198, 184, 0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        rightBarrier.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // E. Dashed Centerline Markings
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([7, 9]);
        ctx.beginPath();
        ctx.moveTo(road.p0.x, road.p0.y);
        ctx.bezierCurveTo(road.p1.x, road.p1.y, road.p2.x, road.p2.y, road.p3.x, road.p3.y);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // F. Pedestrian Zebra Crosswalks (on Boulevard)
        if (road.hasCrosswalks) {
          const crosswalkT = [0.24, 0.65];
          crosswalkT.forEach((t) => {
            const pt = getCubicBezierPoint(t, road.p0, road.p1, road.p2, road.p3);
            const tan = getCubicBezierTangent(t, road.p0, road.p1, road.p2, road.p3);
            const len = Math.hypot(tan.x, tan.y) || 1;
            const nx = -tan.y / len;
            const ny = tan.x / len;

            for (let b = -4; b <= 4; b++) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              ctx.moveTo(pt.x + nx * (b * 2.8) - tan.x / len * 4, pt.y + ny * (b * 2.8) - tan.y / len * 4);
              ctx.lineTo(pt.x + nx * (b * 2.8) + tan.x / len * 4, pt.y + ny * (b * 2.8) + tan.y / len * 4);
              ctx.stroke();
            }

            // Traffic Signal at Crosswalk
            const sigX = pt.x + nx * (road.width * 0.5 + 8);
            const sigY = pt.y + ny * (road.width * 0.5 + 8);

            // Signal Pole
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sigX, sigY);
            ctx.lineTo(sigX, sigY - 14);
            ctx.stroke();

            // Signal Head
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(sigX - 3, sigY - 20, 6, 10);

            // Cycle Red/Amber/Green
            const sigCycle = Math.floor((time * 0.0008 + t * 5) % 3);
            const sigColor = sigCycle === 0 ? '#10B981' : sigCycle === 1 ? '#F59E0B' : '#EF4444';
            ctx.fillStyle = sigColor;
            ctx.beginPath();
            ctx.arc(sigX, sigY - 15, 2.0, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        // G. Streetlights along elevated highway
        if (road.hasLights) {
          const lampT = [0.10, 0.28, 0.46, 0.64, 0.82];
          lampT.forEach((t) => {
            const pt = getCubicBezierPoint(t, road.p0, road.p1, road.p2, road.p3);
            const tan = getCubicBezierTangent(t, road.p0, road.p1, road.p2, road.p3);
            const len = Math.hypot(tan.x, tan.y) || 1;
            const nx = -tan.y / len;
            const ny = tan.x / len;

            const lampX = pt.x + nx * (road.width * 0.5 + 5);
            const lampY = pt.y + ny * (road.width * 0.5 + 5);

            // Lamp post
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(lampX, lampY);
            ctx.lineTo(lampX, lampY - 12);
            ctx.lineTo(pt.x + nx * (road.width * 0.35), lampY - 14);
            ctx.stroke();

            // Lamp glow pool on asphalt
            const lightGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 16);
            lightGrad.addColorStop(0, 'rgba(255, 191, 105, 0.15)');
            lightGrad.addColorStop(1, 'rgba(255, 191, 105, 0)');
            ctx.fillStyle = lightGrad;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      // --- LAYER 6: Moving Highway Light Pulses (Data Flow) ---
      const pulseT = (time * 0.00035) % 1;
      const primaryRoad = cityScene.roads[0];
      const pulsePt = getCubicBezierPoint(pulseT, primaryRoad.p0, primaryRoad.p1, primaryRoad.p2, primaryRoad.p3);

      const pulseGrad = ctx.createRadialGradient(pulsePt.x, pulsePt.y, 0, pulsePt.x, pulsePt.y, 14);
      pulseGrad.addColorStop(0, 'rgba(66, 217, 245, 0.7)');
      pulseGrad.addColorStop(0.4, 'rgba(39, 198, 184, 0.25)');
      pulseGrad.addColorStop(1, 'rgba(66, 217, 245, 0)');
      ctx.fillStyle = pulseGrad;
      ctx.beginPath();
      ctx.arc(pulsePt.x, pulsePt.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(pulsePt.x, pulsePt.y, 2.0, 0, Math.PI * 2);
      ctx.fill();

      // --- LAYER 7: Animated Vehicles with Curve Tangent Orientation ---
      cityScene.vehicles.forEach((veh) => {
        if (!prefersReducedMotion) {
          veh.t += veh.speed;
          if (veh.t >= 1) veh.t = 0;
        }

        const road = cityScene.roads[veh.roadIndex];
        if (!road) return;

        const pt = getCubicBezierPoint(veh.t, road.p0, road.p1, road.p2, road.p3);
        const tan = getCubicBezierTangent(veh.t, road.p0, road.p1, road.p2, road.p3);
        const angle = Math.atan2(tan.y, tan.x);
        const len = Math.hypot(tan.x, tan.y) || 1;
        const nx = -tan.y / len;
        const ny = tan.x / len;

        // Apply lane offset
        const vx = pt.x + nx * veh.laneOffset;
        const vy = pt.y + ny * veh.laneOffset;

        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate(angle);

        // Ground shadow under vehicle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(-veh.length / 2 - 1, -veh.width / 2 + 1, veh.length + 2, veh.width + 1);

        // Vehicle Chassis Body
        ctx.fillStyle = veh.bodyColor;
        ctx.beginPath();
        // Rounded vehicle body
        const r = 2;
        const x0 = -veh.length / 2;
        const y0 = -veh.width / 2;
        const w = veh.length;
        const h = veh.width;
        ctx.roundRect ? ctx.roundRect(x0, y0, w, h, r) : ctx.rect(x0, y0, w, h);
        ctx.fill();

        // Windshield and roof cabin
        ctx.fillStyle = '#090D16';
        ctx.fillRect(-veh.length * 0.15, -veh.width * 0.35, veh.length * 0.45, veh.width * 0.7);

        // Headlights (projecting forward light cone)
        ctx.fillStyle = '#FFF8E7';
        // Left headlight
        ctx.fillRect(veh.length / 2 - 1, -veh.width * 0.35, 1.5, 1.5);
        // Right headlight
        ctx.fillRect(veh.length / 2 - 1, veh.width * 0.35 - 1.5, 1.5, 1.5);

        // Forward beam cone onto dark road
        const beamGrad = ctx.createRadialGradient(
          veh.length / 2, 0, 1,
          veh.length / 2 + 18, 0, 18
        );
        beamGrad.addColorStop(0, 'rgba(255, 248, 230, 0.35)');
        beamGrad.addColorStop(1, 'rgba(255, 248, 230, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(veh.length / 2, -veh.width * 0.35);
        ctx.lineTo(veh.length / 2 + 20, -veh.width * 0.8);
        ctx.lineTo(veh.length / 2 + 20, veh.width * 0.8);
        ctx.lineTo(veh.length / 2, veh.width * 0.35);
        ctx.closePath();
        ctx.fill();

        // Taillights (Red)
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-veh.length / 2, -veh.width * 0.35, 1.2, 1.5);
        ctx.fillRect(-veh.length / 2, veh.width * 0.35 - 1.5, 1.2, 1.5);

        // Subtle rear red glow
        ctx.fillStyle = 'rgba(239, 68, 68, 0.30)';
        ctx.beginPath();
        ctx.arc(-veh.length / 2 - 2, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Municipal Service Emergency Beacon
        if (veh.hasBeacon) {
          const beaconFlash = Math.sin(time * 0.012);
          ctx.fillStyle = beaconFlash > 0 ? '#F59E0B' : '#42D9F5';
          ctx.beginPath();
          ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // --- LAYER 8: Civic AI Telemetry Radar Hubs ---
      for (let i = 0; i < cityScene.telemetryNodes.length; i++) {
        const node = cityScene.telemetryNodes[i];
        if (!prefersReducedMotion) {
          node.pulsePhase += 0.022;
        }

        const pulseR = 4 + (Math.sin(node.pulsePhase) + 1) * 6;
        const ringAlpha = 0.35 - (pulseR / 18) * 0.25;

        // Outer radar pulse
        ctx.strokeStyle = `rgba(66, 217, 245, ${Math.max(0.08, ringAlpha)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Inner core
        ctx.fillStyle = '#42D9F5';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Telemetry Labels (Clean Monospace)
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(66, 217, 245, 0.45)';
        ctx.fillText(node.label, node.x + 9, node.y - 2);

        ctx.font = '7.5px monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.fillText(node.subLabel, node.x + 9, node.y + 9);
      }

      // Connecting Telemetry Arcs between Primary Hubs
      ctx.strokeStyle = 'rgba(66, 217, 245, 0.12)';
      ctx.lineWidth = 0.9;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(cityScene.telemetryNodes[0].x, cityScene.telemetryNodes[0].y);
      ctx.quadraticCurveTo(
        w * 0.35, h * 0.12,
        cityScene.telemetryNodes[1].x, cityScene.telemetryNodes[1].y
      );
      ctx.quadraticCurveTo(
        w * 0.65, h * 0.15,
        cityScene.telemetryNodes[2].x, cityScene.telemetryNodes[2].y
      );
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // --- LAYER 9: Active Incident Visual Emphasis (If Selected) ---
      if (selectedIncidentRef.current) {
        const incX = w * 0.54;
        const incY = h * 0.48;

        const incPulse = (Math.sin(time * 0.006) + 1) * 8;
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(incX, incY, 12 + incPulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.arc(incX, incY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#FDA4AF';
        ctx.fillText(`ACTIVE SECTOR // ${selectedIncidentRef.current.id}`, incX + 16, incY + 3);
      }

      // --- LAYER 10: Ambient Floating Sensor Particles ---
      for (let i = 0; i < cityScene.particles.length; i++) {
        const pt = cityScene.particles[i];
        ctx.fillStyle = `rgba(66, 217, 245, ${pt.alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();

        if (!prefersReducedMotion) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          if (pt.y < 0) {
            pt.y = h + 10;
            pt.x = Math.random() * w;
          }
          if (pt.x < 0 || pt.x > w) pt.vx *= -1;
        }
      }

      if (!prefersReducedMotion && !isPaused) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Initial render
    render(0);

    // Resize handling
    const handleResize = () => {
      resizeCanvas();
      cityScene = buildCityScene();
      render(lastRenderTime);
    };
    window.addEventListener('resize', handleResize);

    // Tab visibility handling
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(animationFrameId);
      } else {
        isPaused = false;
        if (!prefersReducedMotion) {
          render(lastRenderTime);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      id="infranex-smart-city-background"
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#080B12]"
    >
      {/* 1. Deep Atmospheric Gradient Shrouds */}
      <div
        className="absolute top-0 right-0 w-[55vw] h-[55vh] rounded-full blur-[140px] pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(66, 217, 245, 0.15) 0%, rgba(8, 11, 18, 0) 70%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[60vw] h-[50vh] rounded-full blur-[150px] pointer-events-none opacity-22"
        style={{
          background: 'radial-gradient(circle, rgba(39, 198, 184, 0.12) 0%, rgba(8, 11, 18, 0) 70%)',
        }}
      />

      {/* 2. Full-Resolution 2.5D Smart City Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default InfrastructureCityBackground;
