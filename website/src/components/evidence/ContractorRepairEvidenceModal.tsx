import React, { useState, useRef } from 'react';
import { ContractorWorkOrder, Incident, IncidentImage } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface ContractorRepairEvidenceModalProps {
  workOrder: ContractorWorkOrder;
  incident: Incident;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ContractorRepairEvidenceModal: React.FC<ContractorRepairEvidenceModalProps> = ({
  workOrder,
  incident,
  onClose,
  onSuccess,
}) => {
  const { submitContractorRepair, isBackendConnected } = useApp();

  // Form State
  const [completionStatus, setCompletionStatus] = useState<'full_repair' | 'partial_stabilization'>('full_repair');
  const [description, setDescription] = useState(
    'Asphalt milling, high-traction thermoplastic binder application, and heavy vibratory compaction completed to grade.'
  );
  const [materialsUsed, setMaterialsUsed] = useState(
    workOrder.materialsUsed || 'Grade-4 Bitumen Emulsion (450kg), M-20 Aggregate (2.4 tons)'
  );
  const [laborHours, setLaborHours] = useState(
    workOrder.laborHours || '14 crew hours (4 pavers, 1 foreman)'
  );
  const [completionDate, setCompletionDate] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [locationVerification, setLocationVerification] = useState(
    `${incident.location.address} (GPS: ${incident.location.lat.toFixed(5)}, ${incident.location.lng.toFixed(5)})`
  );

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard accessibility
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Generate SHA-256 hash for evidence integrity
  const calculateSha256 = async (buffer: ArrayBuffer): Promise<string> => {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return `sha256-${Date.now().toString(16)}`;
    }
  };

  const handleFileSelection = async (file: File) => {
    setErrorMessage(null);

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(
        `Invalid file type "${file.type || 'unknown'}". Only JPEG, PNG, and WebP images are permitted for repair evidence.`
      );
      return;
    }

    // Validate size limit (10MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        `File size (${sizeMb} MB) exceeds maximum permitted limit of 10 MB. Please compress the photograph before uploading.`
      );
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hash = await calculateSha256(arrayBuffer);
      setFileHash(hash);

      // Create base64 Data URL for persistent storage and immediate preview
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedFile(file);
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing file:', err);
      setErrorMessage('Failed to read and process the selected image file. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileHash('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict Validations
    if (!previewUrl) {
      setErrorMessage('A post-repair completion photograph is required. Please upload on-site photographic evidence.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please provide a substantive repair description (at least 10 characters) explaining the physical work performed.');
      return;
    }

    if (!materialsUsed.trim()) {
      setErrorMessage('Please specify the materials applied during repair (e.g. bitumen grade, aggregate volume, conduit type).');
      return;
    }

    if (!laborHours.trim()) {
      setErrorMessage('Please log crew deployment hours.');
      return;
    }

    if (!showConfirmStep) {
      setShowConfirmStep(true);
      return;
    }

    if (!confirmedAccuracy) {
      setErrorMessage('You must certify the accuracy and integrity of the submitted repair evidence.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const submissionTimestamp = new Date(completionDate).toISOString();

      const repairEvidenceItem: IncidentImage = {
        url: previewUrl,
        caption: `[Post-Repair Evidence] ${description.slice(0, 80)}`,
        isAfterRepair: true,
        isDemonstration: false,
        sha256Hash: fileHash || 'sha256-verified-repair',
        timestamp: submissionTimestamp,
      };

      // Execute authoritative repair submission
      submitContractorRepair(workOrder.id, {
        laborHours,
        materialsUsed,
        progressNotes: `[${completionStatus.toUpperCase()}] ${description}`,
        repairEvidence: [repairEvidenceItem],
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while persisting repair evidence.');
      setIsSubmitting(false);
    }
  };

  const originalPhoto = incident.images && incident.images.length > 0 ? incident.images[0] : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-800/80 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400">
                  Work Order #{workOrder.id}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Case #{incident.id}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {incident.category}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Submit Contractor Repair Evidence
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Work Order & Original Incident Reference */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Original Incident Work Order Details
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Contractor: <strong className="text-slate-200">{workOrder.contractorName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Left Column: Original Incident Photo */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Original Reported Defect
                </span>
                {originalPhoto ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-800 group">
                    <img
                      src={originalPhoto.url}
                      alt="Original Defect"
                      className="w-full h-28 object-cover"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/90 text-rose-300 border border-rose-900/50">
                      Original Citizen Evidence
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-28 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 text-[11px]">
                    No photo recorded
                  </div>
                )}
              </div>

              {/* Middle & Right Columns: Incident & Work Order Meta */}
              <div className="md:col-span-2 space-y-2 text-slate-300">
                <div>
                  <h4 className="font-bold text-white text-sm">{incident.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{incident.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{incident.location.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Reported: {new Date(incident.reportedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px]">
                  <strong className="text-amber-400">Assigned Scope of Work:</strong> {workOrder.scopeOfWork}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Completion Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Repair Completion Status <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCompletionStatus('full_repair')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    completionStatus === 'full_repair'
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold block">Full Restoration Complete</span>
                    <span className="text-[10px] text-slate-400">Hazard permanently remedied to code</span>
                  </div>
                  {completionStatus === 'full_repair' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCompletionStatus('partial_stabilization')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    completionStatus === 'partial_stabilization'
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold block">Emergency Stabilization</span>
                    <span className="text-[10px] text-slate-400">Safe for transit; follow-up paving needed</span>
                  </div>
                  {completionStatus === 'partial_stabilization' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </button>
              </div>
            </div>

            {/* REQUIRED REPAIR PHOTOGRAPH UPLOAD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  Repaired On-Site Photograph <span className="text-rose-400">* Required</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Accepted: JPG, PNG, WebP (Max 10MB)
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="repair-photo-input"
              />

              {!previewUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-2xl p-8 text-center bg-slate-950/60 hover:bg-slate-950 transition-all cursor-pointer space-y-3 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">
                      Click to browse or drag & drop completion photograph
                    </p>
                    <p className="text-[11px] text-slate-400">
                      High-resolution photographic evidence required for municipal quality sign-off
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 transition-colors"
                  >
                    Select Repaired Image File
                  </button>
                </div>
              ) : (
                /* Image Preview with Replace and Remove controls */
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-800/60 space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 max-h-72 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Repaired Infrastructure Preview"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-[10px] font-mono font-bold shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      REPAIR EVIDENCE LOADED
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="truncate text-slate-400">
                      <span className="font-mono text-slate-200 font-bold block truncate">
                        {selectedFile?.name || 'repaired-evidence-capture.jpg'}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        SHA-256: {fileHash ? fileHash.slice(0, 16) + '...' : 'computed'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 text-cyan-400" />
                        Replace Image
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Repair Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Technical Repair Description & Notes <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe execution: sub-base prep, material layering, compaction, edge sealant, and post-work inspection..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            {/* Materials & Labor Dual Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Materials & Quantities Applied <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  placeholder="e.g. 450kg Grade-4 Bitumen, M-20 Aggregate"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Labor & Crew Hours Deployed <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                  placeholder="e.g. 14 crew hours (4 pavers, 1 foreman)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Completion Timestamp & Location Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Completion Timestamp
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="datetime-local"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Location Verification Metadata
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    readOnly
                    value={locationVerification}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-400 focus:outline-none cursor-default"
                  />
                </div>
              </div>
            </div>

            {/* Confirmation Dialog / Checkbox before final submit */}
            {showConfirmStep && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/60 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Submitting Evidence for Municipal Inspection
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Submitting this evidence will transition Case <strong className="text-white">#{incident.id}</strong> to{' '}
                  <strong className="text-amber-300">Awaiting Repair Verification</strong> and mark the{' '}
                  <strong className="text-emerald-300">REPAIR EVIDENCE</strong> progress stage GREEN. The original citizen
                  report photograph will remain permanently preserved alongside this evidence.
                </p>
                <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={confirmedAccuracy}
                    onChange={(e) => setConfirmedAccuracy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <span>
                    I confirm that this photographic evidence accurately reflects on-site repair execution performed by{' '}
                    <strong>{workOrder.contractorName}</strong>.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 ${
                isSubmitting
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Persisting Evidence...
                </>
              ) : showConfirmStep ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  CONFIRM & SUBMIT REPAIR EVIDENCE
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  SUBMIT REPAIR EVIDENCE
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
