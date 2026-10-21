import React, { useState } from 'react';
import { IncidentImage, IssueCategory, IssueSeverity } from '../../types';
import {
  AlertTriangle,
  Camera,
  ShieldCheck,
  Droplets,
  Construction,
  Zap,
  Building2,
  Lightbulb,
  Waves,
  Eye,
  Info,
} from 'lucide-react';

interface IncidentEvidenceViewerProps {
  images: IncidentImage[];
  category: IssueCategory;
  severity: IssueSeverity;
  isDemonstration?: boolean;
  reporterName?: string;
  isThumbnail?: boolean;
  onOpenFullView?: () => void;
}

export const IncidentEvidenceViewer: React.FC<IncidentEvidenceViewerProps> = ({
  images,
  category,
  severity,
  isDemonstration = false,
  reporterName,
  isThumbnail = false,
  onOpenFullView,
}) => {
  // Track failed image URLs to fall back gracefully to the clean placeholder
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});

  const handleImageError = (url: string) => {
    setFailedImageUrls((prev) => ({ ...prev, [url]: true }));
  };

  // Category specific iconography and telemetry descriptors
  const getHazardMeta = (cat: IssueCategory) => {
    switch (cat) {
      case 'water':
        return {
          icon: <Droplets className="w-8 h-8 text-cyan-400" />,
          label: 'BWSSB Hydraulic Rupture & Inundation',
          telemetry: 'Hydraulic Flow Anomaly • Pressure Loss: -42%',
          color: 'from-cyan-950/60 to-slate-900 border-cyan-800/60',
          accent: 'text-cyan-400',
        };
      case 'roads':
        return {
          icon: <Construction className="w-8 h-8 text-amber-400" />,
          label: 'BBMP Pavement Shear & Crater Defect',
          telemetry: 'Surface Subsidence Profile • Deflection: 48mm',
          color: 'from-amber-950/60 to-slate-900 border-amber-800/60',
          accent: 'text-amber-400',
        };
      case 'electrical':
        return {
          icon: <Zap className="w-8 h-8 text-yellow-400" />,
          label: 'BESCOM Transformer & Distribution Grate',
          telemetry: 'Phase Unbalance: 24% • Thermal Overload',
          color: 'from-yellow-950/60 to-slate-900 border-yellow-800/60',
          accent: 'text-yellow-400',
        };
      case 'structural':
        return {
          icon: <Building2 className="w-8 h-8 text-rose-400" />,
          label: 'BBMP Viaduct Pier & Rebar Delamination',
          telemetry: 'Vibratory Stress Index: 3.4g • Spalling Alert',
          color: 'from-rose-950/60 to-slate-900 border-rose-800/60',
          accent: 'text-rose-400',
        };
      case 'lighting':
        return {
          icon: <Lightbulb className="w-8 h-8 text-amber-300" />,
          label: 'BBMP Street Illumination Circuit',
          telemetry: 'Luminance Deficiency: 0.2 Lux • Target: 35 Lux',
          color: 'from-amber-950/50 to-slate-900 border-amber-700/60',
          accent: 'text-amber-300',
        };
      case 'drainage':
      default:
        return {
          icon: <Waves className="w-8 h-8 text-teal-400" />,
          label: 'Rajakaluve Stormwater Culvert Intake',
          telemetry: 'Sediment Silt Constriction: 80% Capacity Loss',
          color: 'from-teal-950/60 to-slate-900 border-teal-800/60',
          accent: 'text-teal-400',
        };
    }
  };

  const hazard = getHazardMeta(category);

  // Clean hazard-specific placeholder when suitable photo is unavailable
  const renderHazardPlaceholder = (caption?: string, isCompact = false) => {
    if (isCompact) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br ${hazard.color} border text-center select-none`}>
          <div className="shrink-0 mb-1">{hazard.icon}</div>
          <span className="text-[10px] font-bold text-slate-200 line-clamp-1">{hazard.label}</span>
          <span className="text-[9px] font-mono text-amber-400 uppercase tracking-tighter mt-0.5">Demo Evidence</span>
        </div>
      );
    }

    return (
      <div className={`relative w-full rounded-2xl overflow-hidden border bg-gradient-to-br ${hazard.color} p-6 sm:p-8 flex flex-col justify-between shadow-2xl space-y-4`}>
        {/* Subtle decorative grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-600/80 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Demonstration evidence unavailable
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] uppercase font-mono">
              Hazard: {category}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            Synthetic Telemetry Asset
          </span>
        </div>

        {/* Center Graphic & Telemetry Readout */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 py-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-lg shadow-black/40">
            {hazard.icon}
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {hazard.label}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              {caption || 'Simulated demonstration incident record. Actual photo capture is reserved for verified on-site Citizen live camera reports.'}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-[11px] text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {hazard.telemetry}
            </div>
          </div>
        </div>

        {/* Bottom Verification Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Simulated BBMP Telemetry Record • Not affiliated with live government field dispatches</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">SEV-{severity.toUpperCase()} • BENGALURU</span>
        </div>
      </div>
    );
  };

  // If thumbnail mode (for workspace / list cards)
  if (isThumbnail) {
    const firstImg = images[0];
    const isFailed = firstImg ? failedImageUrls[firstImg.url] : false;
    const hasValidPhoto = firstImg && firstImg.url && firstImg.url.trim().length > 0 && !isFailed;

    if (!hasValidPhoto) {
      return renderHazardPlaceholder(firstImg?.caption, true);
    }

    return (
      <div
        onClick={onOpenFullView}
        className="w-full h-full relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group cursor-pointer shadow-md"
      >
        <img
          src={firstImg.url}
          alt={firstImg.caption || 'Evidence'}
          onError={() => handleImageError(firstImg.url)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-1.5 right-1.5">
          {firstImg.isCitizenCapture ? (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-600 text-[9px] font-bold uppercase shadow-sm">
              Citizen Live
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-600 text-[9px] font-bold uppercase shadow-sm">
              Demo Asset
            </span>
          )}
        </div>
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-white font-bold gap-1">
          <Eye className="w-3.5 h-3.5" />
          Inspect
        </div>
      </div>
    );
  }

  // Full Gallery View (for CaseDetailModal)
  if (!images || images.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          Photographic & Telemetry Evidence
        </h3>
        {renderHazardPlaceholder()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          Photographic & Telemetry Evidence
        </h3>

        {/* Clear Origin Distinction Badge */}
        {isDemonstration || images.some((img) => img.isDemonstration) ? (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/80 text-[10px] font-semibold tracking-wide flex items-center gap-1 shadow-sm">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Illustrative Demonstration Image — Not Actual Incident Evidence
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/80 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Citizen Live-Captured Evidence
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {images.map((img, idx) => {
          const isFailed = failedImageUrls[img.url];
          const hasPhoto = img.url && img.url.trim().length > 0 && !isFailed;

          if (!hasPhoto) {
            return (
              <div key={idx}>
                {renderHazardPlaceholder(img.caption)}
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group shadow-xl"
            >
              <img
                src={img.url}
                alt={img.caption || 'Evidence'}
                onError={() => handleImageError(img.url)}
                className="w-full max-h-96 object-cover group-hover:scale-102 transition-transform duration-300"
              />

              {/* Top Banner Tag */}
              <div className="absolute top-3 left-3 z-10">
                {img.isCitizenCapture ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 backdrop-blur-md text-emerald-300 border border-emerald-500/80 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-md">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Citizen Live Photo
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/95 backdrop-blur-md text-amber-300 border border-amber-500/80 text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-md">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Illustrative Demonstration Image — Not Actual Incident Evidence
                  </span>
                )}
              </div>

              {/* Bottom Caption Overlay */}
              <div className="p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-950/80 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{img.caption}</span>
                  {img.isAfterRepair && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase text-[9px]">
                      Post-Repair Certified
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>
                    {img.isCitizenCapture
                      ? `Reporter: ${reporterName || 'Citizen Live Camera'}`
                      : 'Asset Source: Illustrative Demonstration (Not Live Gov/Citizen Camera)'}
                  </span>
                  <span>Classification: {category.toUpperCase()} • SEV-{severity.toUpperCase()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
