'use client';

// =============================================================================
// CivicConnect TN — Citizen Feedback & Rating Modal
// =============================================================================

import React, { useState } from 'react';
import { Star, X, AlertCircle } from 'lucide-react';

interface FeedbackModalProps {
  complaintId: string;
  trackingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FeedbackModal({
  complaintId,
  trackingId,
  isOpen,
  onClose,
  onSuccess,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [satisfied, setSatisfied] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback, satisfied }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSuccess(false);
      }, 1600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer touch-target focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Thank You for Your Feedback!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your rating and review for <span className="font-mono text-emerald-400">{trackingId}</span> has been logged.
              </p>
            </div>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-[11px] text-slate-500">Updating grievance timeline...</p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2 mb-6">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/40">
                Resolution Feedback
              </span>
              <h2 id="feedback-modal-title" className="text-xl font-bold text-white">
                Rate Resolution Quality
              </h2>
              <p className="text-xs text-slate-400">
                Complaint Tracking ID: <span className="font-mono text-emerald-400">{trackingId}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2" role="radiogroup" aria-label="Rating selection">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${star} Star${star > 1 ? 's' : ''}`}
                      className="p-1 text-slate-600 hover:scale-110 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {rating === 5
                    ? '⭐⭐⭐⭐⭐ Excellent Resolution'
                    : rating === 4
                    ? '⭐⭐⭐⭐ Good Work'
                    : rating === 3
                    ? '⭐⭐⭐ Average'
                    : rating === 2
                    ? '⭐⭐ Needs Improvement'
                    : '⭐ Unsatisfied'}
                </span>
              </div>

              {/* Satisfaction Toggle */}
              <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSatisfied(true)}
                  className={`flex-1 py-2.5 rounded-lg transition-all touch-target ${
                    satisfied
                      ? 'bg-emerald-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Issue is Fully Resolved
                </button>
                <button
                  type="button"
                  onClick={() => setSatisfied(false)}
                  className={`flex-1 py-2.5 rounded-lg transition-all touch-target ${
                    !satisfied
                      ? 'bg-rose-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Not Satisfied (Reopen)
                </button>
              </div>

              {/* Written feedback */}
              <div className="space-y-1">
                <label htmlFor="feedback-comment" className="text-xs font-medium text-slate-300">
                  Comments or Observations (Optional)
                </label>
                <textarea
                  id="feedback-comment"
                  rows={3}
                  placeholder="Tell us about the resolution quality or any lingering issues..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950 transition-all cursor-pointer disabled:opacity-50 touch-target focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {isSubmitting ? 'Submitting Feedback...' : 'Submit Grievance Feedback'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
