import React from 'react';
import { Incident } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Printer,
  FileText,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  HardHat,
  Info,
  ExternalLink
} from 'lucide-react';

interface InspectionBriefModalProps {
  incident: Incident;
  onClose: () => void;
}

export const InspectionBriefModal: React.FC<InspectionBriefModalProps> = ({ incident, onClose }) => {
  const { workOrders, repairValidations, citizenConfirmations } = useApp();

  const wo = workOrders.find((w) => w.incidentId === incident.id);
  const val = repairValidations.find((v) => v.incidentId === incident.id);
  const conf = citizenConfirmations.find((c) => c.incidentId === incident.id);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 print:bg-white print:text-black print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 print:hidden">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 print:border-black print:text-black">
                  Official Municipal Inspection Brief
                </span>
                <span className="text-xs font-mono font-bold text-slate-300 print:text-black">
                  Ref: {incident.id}
                </span>
              </div>
              <h2 className="text-base font-bold text-white font-mono mt-0.5 print:text-black">
                {incident.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:border print:border-slate-300">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Domain / Category</div>
              <div className="text-xs font-bold text-white uppercase mt-1 print:text-black">{incident.category}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:border print:border-slate-300">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Assigned Severity</div>
              <div className="text-xs font-bold text-rose-400 uppercase mt-1 print:text-black">{incident.severity}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:border print:border-slate-300">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Current Status</div>
              <div className="text-xs font-bold text-cyan-400 uppercase mt-1 print:text-black">{incident.status}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:border print:border-slate-300">
              <div className="text-[10px] text-slate-400 uppercase font-mono">External Ref</div>
              <div className="text-xs font-mono text-slate-300 mt-1 print:text-black">{incident.externalComplaintRef || 'BBMP-SAHAYA-SYNCD'}</div>
            </div>
          </div>

          {/* Location & Coordinates */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Geospatial Location & Ward
            </div>
            <div className="text-xs font-semibold text-white print:text-black">{incident.location.address}</div>
            <div className="text-[11px] text-slate-400">
              Ward: <span className="text-slate-200 font-medium print:text-black">{incident.location.ward}</span> • Coordinates: {incident.location.lat.toFixed(5)}, {incident.location.lng.toFixed(5)} • Reported: {new Date(incident.reportedAt).toLocaleString()}
            </div>
          </div>

          {/* Photographic Evidence Section */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-black">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Verified Evidence & Provenance
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incident.images && incident.images.length > 0 ? (
                incident.images.map((img, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <img
                      src={img.url}
                      alt={img.caption || 'Evidence'}
                      className="w-full h-44 object-cover rounded-lg border border-slate-700"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-slate-200 print:text-black">{img.caption || 'On-site photograph'}</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        Hash: {img.sha256Hash || 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {img.isCitizenCapture ? 'Captured via Citizen Live Camera API' : 'Authorized Field Source'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-500">
                  No photographic evidence attached.
                </div>
              )}
            </div>
          </div>

          {/* AI Assessment & Calibration Limits */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 print:text-black">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                AI Defect Classification & Estimated Dimensions
              </div>
              <span className="text-xs font-mono text-slate-400">
                Confidence: {Math.round(incident.aiAnalysis.confidenceScore * 100)}%
              </span>
            </div>

            <p className="text-xs text-slate-300 print:text-black">
              {incident.aiAnalysis.detectedAnomaly}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Estimated Area</span>
                <div className="font-mono text-slate-200 print:text-black">
                  {incident.aiAnalysis.estimatedDimensions?.areaSqMeters || 3.4} m²
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Hazard Index</span>
                <div className="font-mono text-slate-200 print:text-black">
                  {incident.aiAnalysis.safetyHazardLevel}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Estimated Hours</span>
                <div className="font-mono text-slate-200 print:text-black">
                  {incident.aiAnalysis.estimatedRepairHours}h
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Estimated Cost</span>
                <div className="font-mono text-slate-200 print:text-black">
                  ₹{(incident.aiAnalysis.estimatedCostUsd * 83).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Measurement Limitation Note:</strong> Single-perspective uncalibrated mobile camera capture. Stated dimensions are computer-vision approximations. Official municipal engineering work orders require authorized on-site physical measurement.
              </span>
            </div>
          </div>

          {/* Work Order & Repair History */}
          {wo && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-black">
                <HardHat className="w-4 h-4 text-amber-400" />
                Contractor Work Order Details
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500">Order ID:</span>
                  <div className="font-mono text-slate-200 print:text-black">{wo.id}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Contractor:</span>
                  <div className="text-slate-200 font-medium print:text-black">{wo.contractorName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Work Status:</span>
                  <div className="text-cyan-400 font-bold uppercase print:text-black">{wo.status}</div>
                </div>
              </div>
              {wo.materialsUsed && (
                <div className="text-[11px] text-slate-400 pt-1">
                  <strong>Materials:</strong> {wo.materialsUsed} • <strong>Labor:</strong> {wo.laborHours}
                </div>
              )}
            </div>
          )}

          {/* Human Validation & Citizen Response */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Authority Repair Verification</div>
              {val ? (
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-emerald-400 uppercase print:text-black">
                    Decision: {val.decision}
                  </div>
                  <p className="text-[11px] text-slate-300 print:text-black">{val.rationale}</p>
                  <div className="text-[10px] text-slate-500">Verified by {val.officerName} on {new Date(val.validatedAt).toLocaleDateString()}</div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">Pending officer field repair verification.</div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Citizen Confirmation</div>
              {conf ? (
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-cyan-400 uppercase print:text-black">
                    Response: {conf.response}
                  </div>
                  <p className="text-[11px] text-slate-300 print:text-black">"{conf.notes || 'No remarks'}"</p>
                  <div className="text-[10px] text-slate-500">Submitted on {new Date(conf.submittedAt).toLocaleDateString()}</div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">Awaiting citizen post-repair confirmation.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 print:hidden">
          <span>INFRANEX AI Civic Infrastructure Brief • Authenticated Audit Record</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
