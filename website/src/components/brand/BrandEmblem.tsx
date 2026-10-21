import React from 'react';

export interface BrandEmblemProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
}

/**
 * INFRANEX AI — Official Brand Emblem (Compact Vector)
 * 
 * Features the signature miniature infrastructure city architecture,
 * elevated highway arc, digital map plane, and glowing cyan/teal telemetry markers.
 * Perfectly calibrated for high-density rendering in navigation bars, headers, and favicons.
 */
export const BrandEmblem: React.FC<BrandEmblemProps> = ({
  className = '',
  size = 40,
  glow = true,
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${glow ? 'drop-shadow-[0_0_12px_rgba(66,217,245,0.45)]' : ''} ${className}`}
      aria-label="INFRANEX AI Brand Emblem"
      role="img"
    >
      <defs>
        {/* Soft Ambient Core Aura */}
        <radialGradient id="emblemAuraDynamic" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#42D9F5" stopOpacity="0.32" />
          <stop offset="60%" stopColor="#27C6B8" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#080B12" stopOpacity="0" />
        </radialGradient>

        {/* Central Spire Gradient */}
        <linearGradient id="embSpireGradComp" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#42D9F5" />
          <stop offset="35%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#0B132B" />
        </linearGradient>

        {/* High-Rise Tower Lit Facets */}
        <linearGradient id="embTowerLitComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0B1728" stopOpacity="0.9" />
        </linearGradient>

        {/* High-Rise Tower Dark Facets */}
        <linearGradient id="embTowerDarkComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#060C18" stopOpacity="0.98" />
        </linearGradient>

        {/* Elevated Road Deck Surface */}
        <linearGradient id="embRoadDeckComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#080F1E" />
        </linearGradient>

        {/* Green Infrastructure Layer (Eco-Terraces) */}
        <linearGradient id="embGreenGradComp" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        {/* Digital Map Plane Gradient */}
        <linearGradient id="embMapGradComp" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#070D18" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* 0. Ambient Core Backlight */}
      <circle cx="50" cy="50" r="46" fill="url(#emblemAuraDynamic)" />

      {/* 1. Digital Map Plane Base (Perspective Grid) */}
      <g id="mapBaseComp">
        <polygon
          points="12,68 50,86 88,68 50,56"
          fill="url(#embMapGradComp)"
          stroke="#42D9F5"
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
        <line x1="24" y1="65" x2="62" y2="81" stroke="#42D9F5" strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="2 2" />
        <line x1="38" y1="60" x2="76" y2="76" stroke="#42D9F5" strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="2 2" />
        <line x1="62" y1="65" x2="24" y2="81" stroke="#42D9F5" strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="2 2" />
        <ellipse cx="50" cy="71" rx="18" ry="6" fill="none" stroke="#27C6B8" strokeWidth="0.6" strokeOpacity="0.45" strokeDasharray="2 2" />
      </g>

      {/* 2. Futuristic Buildings Skyline */}
      <g id="skylineComp">
        {/* Far West Auxiliary Building */}
        <rect x="20" y="48" width="7" height="19" rx="0.5" fill="url(#embTowerDarkComp)" stroke="#38BDF8" strokeWidth="0.6" strokeOpacity="0.5" />
        <line x1="21" y1="53" x2="26" y2="53" stroke="#38BDF8" strokeWidth="0.5" strokeOpacity="0.6" />
        <line x1="21" y1="58" x2="26" y2="58" stroke="#38BDF8" strokeWidth="0.5" strokeOpacity="0.6" />

        {/* West Modern High-Rise */}
        <polygon points="27,66 27,35 37,28 37,66" fill="url(#embTowerLitComp)" stroke="#42D9F5" strokeWidth="0.8" strokeOpacity="0.75" />
        <polygon points="37,28 41,32 41,66 37,66" fill="url(#embTowerDarkComp)" stroke="#27C6B8" strokeWidth="0.6" strokeOpacity="0.55" />
        <line x1="32" y1="32" x2="32" y2="66" stroke="#42D9F5" strokeWidth="0.6" strokeOpacity="0.75" />
        <line x1="28" y1="42" x2="36" y2="42" stroke="#42D9F5" strokeWidth="0.5" strokeOpacity="0.55" />
        <line x1="28" y1="48" x2="36" y2="48" stroke="#42D9F5" strokeWidth="0.5" strokeOpacity="0.55" />
        <line x1="28" y1="54" x2="36" y2="54" stroke="#42D9F5" strokeWidth="0.5" strokeOpacity="0.55" />

        {/* Central Landmark Sovereign Spire Tower */}
        <polygon points="44,65 44,24 50,16 56,24 56,65" fill="url(#embSpireGradComp)" stroke="#42D9F5" strokeWidth="0.9" strokeOpacity="0.9" />
        <line x1="50" y1="16" x2="50" y2="65" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.85" />
        <line x1="45" y1="32" x2="55" y2="32" stroke="#42D9F5" strokeWidth="0.5" strokeOpacity="0.65" />
        <line x1="45" y1="40" x2="55" y2="40" stroke="#42D9F5" strokeWidth="0.5" strokeOpacity="0.65" />
        <line x1="45" y1="48" x2="55" y2="48" stroke="#42D9F5" strokeWidth="0.5" strokeOpacity="0.65" />
        <line x1="45" y1="56" x2="55" y2="56" stroke="#42D9F5" strokeWidth="0.5" strokeOpacity="0.65" />

        {/* Spire Needle & Apex Beacon */}
        <line x1="50" y1="16" x2="50" y2="6" stroke="#42D9F5" strokeWidth="1.3" />
        <circle cx="50" cy="6" r="2.4" fill="#42D9F5" fillOpacity="0.5" />
        <circle cx="50" cy="6" r="1.3" fill="#FFFFFF" />

        {/* East Innovation & Telemetry Tower */}
        <polygon points="59,66 59,30 69,26 69,66" fill="url(#embTowerLitComp)" stroke="#27C6B8" strokeWidth="0.8" strokeOpacity="0.75" />
        <polygon points="69,26 73,30 73,66 69,66" fill="url(#embTowerDarkComp)" stroke="#27C6B8" strokeWidth="0.6" strokeOpacity="0.55" />
        <line x1="64" y1="29" x2="64" y2="66" stroke="#27C6B8" strokeWidth="0.6" strokeOpacity="0.75" />
        <line x1="60" y1="38" x2="68" y2="38" stroke="#27C6B8" strokeWidth="0.5" strokeOpacity="0.55" />
        <line x1="60" y1="46" x2="68" y2="46" stroke="#27C6B8" strokeWidth="0.5" strokeOpacity="0.55" />
        <line x1="60" y1="54" x2="68" y2="54" stroke="#27C6B8" strokeWidth="0.5" strokeOpacity="0.55" />

        {/* Far East Auxiliary Building */}
        <rect x="74" y="47" width="7" height="20" rx="0.5" fill="url(#embTowerDarkComp)" stroke="#38BDF8" strokeWidth="0.6" strokeOpacity="0.5" />
        <line x1="75" y1="52" x2="80" y2="52" stroke="#38BDF8" strokeWidth="0.5" strokeOpacity="0.6" />
        <line x1="75" y1="57" x2="80" y2="57" stroke="#38BDF8" strokeWidth="0.5" strokeOpacity="0.6" />

        {/* Skybridge Connections */}
        <rect x="37" y="38" width="8" height="2" fill="#1E293B" stroke="#42D9F5" strokeWidth="0.5" strokeOpacity="0.7" />
        <rect x="55" y="36" width="5" height="2" fill="#1E293B" stroke="#27C6B8" strokeWidth="0.5" strokeOpacity="0.7" />

        {/* Green Infrastructure Layer (Eco-Terraces & Sky Gardens) */}
        <polygon points="26,35 32,31 38,28 38,30 26,37" fill="url(#embGreenGradComp)" />
        <polygon points="58,30 64,28 70,26 70,28 58,32" fill="url(#embGreenGradComp)" />
        <path d="M 24 64 Q 50 60 76 64" stroke="url(#embGreenGradComp)" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      </g>

      {/* 3. Elevated Curving Highway */}
      <g id="highwayComp">
        {/* Support Pylons / Piers */}
        <line x1="28" y1="74" x2="28" y2="81" stroke="#334155" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="50" y1="77" x2="50" y2="84" stroke="#334155" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="72" y1="74" x2="72" y2="81" stroke="#334155" strokeWidth="1.6" strokeLinecap="round" />

        {/* Road Deck Shadow & Surface */}
        <path d="M 10,78 C 26,65 42,78 58,69 C 70,62 82,74 90,78" fill="none" stroke="#070D18" strokeWidth="7" strokeLinecap="round" />
        <path d="M 10,78 C 26,65 42,78 58,69 C 70,62 82,74 90,78" fill="none" stroke="url(#embRoadDeckComp)" strokeWidth="4.8" strokeLinecap="round" />

        {/* Upper Cyan Glowing Edge */}
        <path
          d="M 10,76 C 26,63 42,76 58,67 C 70,60 82,72 90,76"
          fill="none"
          stroke="#42D9F5"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Lower Teal Glowing Edge */}
        <path
          d="M 10,80 C 26,67 42,80 58,71 C 70,64 82,76 90,80"
          fill="none"
          stroke="#27C6B8"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Center Dashed Lane Divider */}
        <path
          d="M 10,78 C 26,65 42,78 58,69 C 70,62 82,74 90,78"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          strokeOpacity="0.8"
        />

        {/* Data Packet / Light Pulse */}
        <circle cx="58" cy="69" r="1.6" fill="#FFFFFF" />
      </g>

      {/* 4. Glowing Location Pins */}
      <g id="markersComp">
        {/* Pin 1: West Flyover Hub */}
        <line x1="31" y1="67" x2="31" y2="60" stroke="#42D9F5" strokeWidth="1" strokeLinecap="round" />
        <circle cx="31" cy="59" r="2.2" fill="#42D9F5" />
        <circle cx="31" cy="59" r="0.8" fill="#FFFFFF" />
        <circle cx="31" cy="67" r="3" stroke="#42D9F5" strokeWidth="0.5" fill="none" strokeDasharray="1 1" opacity="0.6" />

        {/* Pin 2: East Telemetry Node */}
        <line x1="68" y1="64" x2="68" y2="57" stroke="#27C6B8" strokeWidth="1" strokeLinecap="round" />
        <circle cx="68" cy="56" r="2.2" fill="#27C6B8" />
        <circle cx="68" cy="56" r="0.8" fill="#FFFFFF" />
        <circle cx="68" cy="64" r="3" stroke="#27C6B8" strokeWidth="0.5" fill="none" strokeDasharray="1 1" opacity="0.6" />
      </g>
    </svg>
  );
};

export default BrandEmblem;
