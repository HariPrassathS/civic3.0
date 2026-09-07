'use client';

// =============================================================================
// CivicConnect TN — Field Worker Resolution & Evidence Submission Modal
// =============================================================================
// Field console allowing crews to review citizen BEFORE evidence, capture AFTER photo proof,
// describe work, and automatically run AI comparative verification with pass/fail feedback and re-upload.

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Camera,
  CheckCircle2,
  X,
  UploadCloud,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Wrench,
  Layers,
  ArrowRight,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import type { Complaint, ComplaintMedia } from '@/types/database';

interface ResolutionUploadModalProps {
  complaint: Complaint & {
    media?: ComplaintMedia[];
    category?: { name: string; code: string };
    department?: { name: string; code: string };
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmitResolution: (complaintId: string, notes: string, mediaUrl?: string) => Promise<void>;
}

export function ResolutionUploadModal({
  complaint,
  isOpen,
  onClose,
  onSubmitResolution,
}: ResolutionUploadModalProps) {
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    resolution_status: string;
    confidence: number;
    visual_improvement: string;
    reason: string;
    officer_summary: string;
    citizen_message_en?: string;
    citizen_message_ta?: string;
    issue_still_visible?: boolean;
    needs_human_review?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const beforeMedia = complaint.media?.find(
    (m) => m.phase === 'complaint' || m.phase === 'before_resolution'
  );

  const workLogPresets = [
    'Cleared storm drain obstruction, flushed silt with jetting vehicle, and sanitized area with bleaching powder.',
    'Filled pothole with cold mix bitumen aggregate, compacted with mechanical roller, and leveled surface.',
    'Excavated damaged pipeline section, fitted heavy-duty PVC collar, tested pressure, and backfilled trench.',
    'Replaced damaged electrical fuse and street lamp fixture; illumination restored and verified on-site.',
    'Cleared 3 tons of municipal solid waste using dumper placer, swept perimeter, and sprayed disinfectant.',
  ];

  // Automated AI Comparative Verification Function
  const runAiAnalysis = async (targetPhotoUrl: string, targetNotes: string) => {
    if (!targetPhotoUrl) return;

    setError(null);
    setAiAnalyzing(true);
    try {
      const res = await fetch('/api/evidence/analyze-after', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaint.id,
          before_media_url: beforeMedia?.url || undefined,
          after_media_url: targetPhotoUrl.trim(),
          title: complaint.title,
          description: complaint.description,
          category: complaint.category?.name || 'Civic Infrastructure',
          resolution_notes: targetNotes.trim() || 'Field crew completed rectification work.',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setAiResult(data.data);
      } else {
        setError(data.error || 'AI analysis completed with warning. You can re-upload if needed.');
      }
    } catch {
      setError('AI verification network timeout. You can retry or re-upload photo.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setAiResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('complaintId', complaint.id);
      formData.append('phase', 'after_resolution');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.url) {
        const uploadedUrl = data.data.url;
        setPhotoUrl(uploadedUrl);

        // AUTOMATICALLY RUN AI VERIFICATION ON UPLOAD!
        await runAiAnalysis(uploadedUrl, notes);
      } else {
        setError(data.error || 'Failed to upload photo evidence.');
      }
    } catch {
      setError('Photo upload failed. Please check network connection.');
    } finally {
      setUploading(false);
    }
  };

  const isVerificationPassed =
    aiResult &&
    (aiResult.resolution_status === 'RESOLUTION_CONSISTENT' ||
      (aiResult.visual_improvement === 'SIGNIFICANT' && !aiResult.issue_still_visible) ||
      (aiResult.visual_improvement === 'MODERATE' &&
        !aiResult.issue_still_visible &&
        aiResult.resolution_status !== 'ISSUE_STILL_PRESENT' &&
        aiResult.resolution_status !== 'LOCATION_INCONSISTENT'));

  const isVerificationFailed = aiResult && !isVerificationPassed;

  const handleSubmit = async () => {
    if (!notes.trim()) {
      setError('Please describe the work completed in the work log.');
      return;
    }
    if (!photoUrl.trim()) {
      setError('Visual proof photo is mandatory. Please capture or upload a repair photo.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmitResolution(complaint.id, notes.trim(), photoUrl.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit work resolution.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Field Work Completion & Proof Submission
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {complaint.tracking_id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Capture on-site resolution photo. AI automatically checks and verifies repair proof.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Citizen Original Grievance & BEFORE Photo */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                <span>1. Original Citizen Grievance (BEFORE)</span>
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-900">
                BEFORE EVIDENCE
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {complaint.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                {complaint.description}
              </p>
            </div>

            {beforeMedia?.url && (
              <div className="relative aspect-video rounded-xl bg-slate-200 dark:bg-slate-950 overflow-hidden border border-slate-300 dark:border-slate-800">
                <Image
                  src={beforeMedia.url}
                  alt="Original Citizen Evidence"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-slate-900/90 text-slate-200 px-2.5 py-0.5 rounded-md border border-slate-700">
                  Citizen Photo
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Work Log & Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-teal-500" />
                <span>2. Field Work Log & Action Taken *</span>
              </label>
              <span className="text-[10px] text-slate-500">Required for AE Sign-off</span>
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared 2 tons of waste, disinfected with bleaching powder. Water pipeline leak repaired with 3-inch collar..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden leading-relaxed"
            />

            {/* Quick Work Log Preset Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick Action Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {workLogPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNotes(preset);
                      if (photoUrl) {
                        runAiAnalysis(photoUrl, preset);
                      }
                    }}
                    className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/60 dark:hover:text-teal-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-left"
                  >
                    + {preset.substring(0, 48)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: AFTER Photo Proof Upload (Real Photos Only) */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-500" />
              <span>3. AFTER Photo Proof (Mandatory)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {photoUrl ? (
              <div className="space-y-2">
                <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-emerald-500/60 bg-slate-900 shadow-md">
                  <Image src={photoUrl} alt="After Work Proof" fill className="object-cover" unoptimized />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>AFTER Proof Attached</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold cursor-pointer px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Change / Re-upload Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runAiAnalysis(photoUrl, notes)}
                    disabled={aiAnalyzing}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiAnalyzing ? 'AI Analyzing...' : 'Re-verify with AI'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {uploading ? 'Uploading Photo...' : 'Click to Capture Photo or Upload Proof'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real photo proof from field location (JPG, PNG, WebP up to 10MB)
                </p>
              </div>
            )}
          </div>

          {/* AI Analyzing Live Indicator */}
          {aiAnalyzing && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-purple-200 block">
                  AI Comparative Verification Running Automatically...
                </span>
                <span className="text-[11px] text-purple-300/80 block">
                  Comparing AFTER repair photo with BEFORE report & defect criteria
                </span>
              </div>
            </div>
          )}

          {/* Section 4: Automated AI Pass/Fail Verification Card */}
          {aiResult && !aiAnalyzing && (
            <div>
              {isVerificationPassed ? (
                /* TRUE / PASSED CASE */
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/50 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        ✓ AI Verification Passed — Resolution Verified
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Confidence: {Math.round((aiResult.confidence || 0.95) * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Resolution Status</span>
                      <span className="font-bold text-emerald-400 block truncate">
                        {aiResult.resolution_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Visual Improvement</span>
                      <span className="font-bold text-emerald-300 block">
                        {aiResult.visual_improvement || 'SIGNIFICANT'}
                      </span>
                    </div>
                  </div>

                  {aiResult.reason && (
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {aiResult.reason}
                    </p>
                  )}

                  {aiResult.citizen_message_ta && (
                    <p className="text-[11px] text-teal-300 leading-relaxed bg-teal-950/40 p-2 rounded-lg border border-teal-800/40">
                      தமிழ்: {aiResult.citizen_message_ta}
                    </p>
                  )}
                </div>
              ) : (
                /* FALSE / FAILED / RE-UPLOAD CASE */
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border-2 border-rose-500/60 space-y-3 animate-in fade-in shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-rose-200">
                        ✕ AI Verification Failed — Defect Still Present / Photo Unclear
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Status: {aiResult.resolution_status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Reason for AI Verification Rejection:</span>
                    </div>
                    <p className="text-xs text-rose-200/90 leading-relaxed">
                      {aiResult.reason ||
                        'The uploaded photo does not substantiate complete defect rectification. The issue is either still visible or the photo is unclear.'}
                    </p>
                    {aiResult.officer_summary && (
                      <p className="text-[11px] text-slate-400 font-mono pt-1">
                        Officer Recommendation: {aiResult.officer_summary}
                      </p>
                    )}
                    {aiResult.citizen_message_ta && (
                      <p className="text-[11px] text-amber-300 pt-1">
                        தமிழ்: {aiResult.citizen_message_ta}
                      </p>
                    )}
                  </div>

                  {/* PROMINENT RE-UPLOAD ACTION BUTTON */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📸 Re-upload Clear Repair Photo</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400">
                      Please ensure full site repair work is complete and upload a clear, well-lit photograph.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading || aiAnalyzing || !photoUrl}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer ${
              isVerificationFailed
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Resolution...</span>
              </>
            ) : isVerificationFailed ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Submit for Officer Audit (Flagged)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Proof for Area Officer Sign-Off</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
