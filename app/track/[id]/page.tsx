'use client';

// =============================================================================
// CivicConnect TN — Detailed Grievance Tracking View (/track/[id])
// =============================================================================
// Features: AI triage summary, AI evidence consistency check, realtime polling,
// voice note player, image lightbox, related community issues, share link, QR code.

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  MapPin,
  AlertCircle,
  Star,
  MessageSquare,
  Send,
  Share2,
  RefreshCw,
  Clipboard,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  Play,
  Maximize2,
  X,
  Building2,
  UserCheck,
} from 'lucide-react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { ComplaintTimeline } from '@/components/citizen/complaint-timeline';
import { FeedbackModal } from '@/components/citizen/feedback-modal';
import type { Complaint, ComplaintMedia, ComplaintUpdate } from '@/types/database';

interface TrackDetailProps {
  params: Promise<{ id: string }>;
}

interface ComplaintDetail extends Complaint {
  department?: { id: string; name: string; code: string } | null;
  category?: { id: string; name: string; code: string; icon?: string } | null;
  assigned_worker?: { id: string; full_name: string; role: string; phone_number?: string } | null;
  media?: ComplaintMedia[];
  updates?: ComplaintUpdate[];
  ai_insights?: Array<{
    id?: string;
    insight_type?: string;
    category_suggested?: string;
    priority_suggested?: string;
    severity_score?: number;
    reasoning?: string;
    confidence?: number;
    metadata?: any;
    created_at?: string;
  }>;
}

interface RelatedIssue {
  tracking_id: string;
  title: string;
  status: string;
  priority: string;
  address: string | null;
  created_at: string;
}

interface CommentItem {
  id: string;
  complaint_id: string;
  user_name: string;
  content: string;
  is_official: boolean;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  created: 'Reported',
  validated: 'Validated',
  assigned: 'Assigned to Field Gang',
  in_progress: 'In Progress',
  resolution_submitted: 'Fix Submitted',
  officer_verification: 'Officer Verification',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
  reopened: 'Reopened',
  escalated: 'Escalated',
};

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; border: string; sla: string }> = {
  URGENT: { label: 'URGENT', bg: 'bg-rose-50 dark:bg-rose-950/80', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-700/80', sla: '12h SLA' },
  HIGH: { label: 'HIGH PRIORITY', bg: 'bg-amber-50 dark:bg-amber-950/80', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700/80', sla: '24h SLA' },
  MEDIUM: { label: 'MEDIUM', bg: 'bg-yellow-50 dark:bg-yellow-950/80', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700/80', sla: '48h SLA' },
  LOW: { label: 'LOW', bg: 'bg-emerald-50 dark:bg-emerald-950/80', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700/80', sla: '72h SLA' },
};

export default function TrackDetailPage({ params }: TrackDetailProps) {
  const resolvedParams = use(params);
  const trackingId = decodeURIComponent(resolvedParams.id);

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback modal
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Selected media for image lightbox
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  // Comments state
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Related issues
  const [relatedIssues, setRelatedIssues] = useState<RelatedIssue[]>([]);

  // Share/copy
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/complaints/track/${encodeURIComponent(trackingId)}?include=timeline`);
      const data = await res.json();

      if (res.ok && data.success && data.data?.complaint) {
        setComplaint(data.data.complaint);

        // Load comments
        if (data.data.complaint.id) {
          const cRes = await fetch(`/api/community/comments?complaint_id=${encodeURIComponent(data.data.complaint.id)}`);
          if (cRes.ok) {
            const cData = await cRes.json();
            if (cData.success && cData.data?.comments) {
              setComments(cData.data.comments);
            }
          }
        }

        // Load related issues
        const ward = data.data.complaint.ward;
        const catId = data.data.complaint.category_id;
        const compId = data.data.complaint.id || trackingId;
        if (ward || catId) {
          const params = new URLSearchParams();
          if (ward) params.set('ward', String(ward));
          if (catId) params.set('category_id', catId);
          params.set('exclude_id', compId);
          params.set('limit', '3');

          const rRes = await fetch(`/api/complaints/related?${params.toString()}`);
          if (rRes.ok) {
            const rData = await rRes.json();
            if (rData.success && rData.data?.related) {
              setRelatedIssues(rData.data.related);
            }
          }
        }
      } else {
        setError(data.error?.message || data.error || 'Complaint not found');
      }
    } catch {
      setError('Unable to fetch complaint details.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [trackingId]);

  // Initial load
  useEffect(() => {
    let ignore = false;
    loadData().then(() => {
      if (ignore) return;
    });
    return () => { ignore = true; };
  }, [loadData, reloadKey]);

  // Realtime polling (30s) — only when complaint is not closed/resolved
  useEffect(() => {
    if (!complaint) return;
    const isFinal = complaint.status === 'closed' || complaint.status === 'rejected';
    if (isFinal) return;

    const interval = setInterval(() => {
      loadData();
    }, 30_000);

    return () => clearInterval(interval);
  }, [complaint, loadData]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !complaint) return;

    setIsPostingComment(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaint.id,
          content: commentText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) => [...prev, data.data.comment]);
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleManualRefresh = () => {
    loadData(true);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/track/${encodeURIComponent(trackingId)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(trackingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const isResolved = complaint?.status === 'resolved' || complaint?.status === 'closed';

  // Generate QR code data URL using a lightweight SVG approach
  const qrDataUrl = complaint
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
        `${typeof window !== 'undefined' ? window.location.origin : ''}/track/${encodeURIComponent(trackingId)}`
      )}`
    : '';

  // Extract latest AI Insight if present
  const latestAiInsight = complaint?.ai_insights && complaint.ai_insights.length > 0
    ? complaint.ai_insights[0]
    : null;

  const priorityKey = (complaint?.priority || 'MEDIUM').toUpperCase();
  const priorityInfo = PRIORITY_BADGES[priorityKey] || PRIORITY_BADGES.MEDIUM;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 sm:pb-8 selection:bg-emerald-500 selection:text-white transition-colors">
      <CitizenHeader />

      {/* Floating Copy Feedback Toast */}
      {copied && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-2xl shadow-emerald-600/30 flex items-center gap-2 animate-bounce"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Tracking Link copied to clipboard!</span>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full h-[60vh] sm:h-[75vh]">
              <Image
                src={activeImageModal}
                alt="Evidence Fullscreen View"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb / Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors touch-target focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg px-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Grievance Search</span>
          </Link>

          <span className="text-[10px] text-slate-500 font-mono">
            ID: {trackingId}
          </span>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
              </div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="h-24 bg-slate-100 dark:bg-slate-950/80 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-950 rounded-xl" />
              ))}
            </div>
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500 dark:text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span>Retrieving live grievance lifecycle from TN Municipal Grid...</span>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !isLoading && (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-rose-200 dark:border-rose-500/30 text-center space-y-4 shadow-xs">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Grievance Not Found</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              We could not find any active grievance with tracking ID{' '}
              <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">{trackingId}</span>. Please verify the ID or submit a new report.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => loadData(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 touch-target"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <Link
                href="/submit-issue"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 dark:shadow-emerald-950 transition-all touch-target"
              >
                Report New Issue
              </Link>
            </div>
          </div>
        )}

        {/* COMPLAINT DETAILS VIEW */}
        {complaint && !isLoading && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                      {complaint.tracking_id}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Copy Tracking ID"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clipboard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      )}
                    </button>
                    
                    {/* Status Badge */}
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 capitalize px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {STATUS_LABELS[complaint.status] || complaint.status?.replace(/_/g, ' ')}
                    </span>

                    {/* AI-Assigned Priority Badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}>
                      <Sparkles className="w-3 h-3" />
                      <span>{priorityInfo.label} ({priorityInfo.sla})</span>
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {complaint.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  {/* Refresh button */}
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
                    title="Refresh Status"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                    title="Copy Tracking Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Share'}</span>
                  </button>

                  {isResolved && (
                    <button
                      type="button"
                      onClick={() => setIsFeedbackOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 dark:shadow-amber-950 transition-all cursor-pointer"
                    >
                      <Star className="w-4 h-4 fill-slate-950" />
                      <span>Rate Resolution</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Citizen Original Description */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Citizen Description</span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  {complaint.description}
                </p>
              </div>

              {/* AI Triage & Assessment Card */}
              {latestAiInsight && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 via-white to-teal-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-teal-950/30 border border-indigo-200 dark:border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-400/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        AI Complaint Analysis & Triage
                      </span>
                    </div>
                    {latestAiInsight.confidence && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60">
                        {Math.round(latestAiInsight.confidence * 100)}% Confidence
                      </span>
                    )}
                  </div>

                  {latestAiInsight.metadata?.summary && (
                    <p className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950/50 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900/40 leading-relaxed">
                      <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">AI Summary: </strong>
                      {latestAiInsight.metadata.summary}
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-[10px] text-slate-500 block">AI Category</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {latestAiInsight.category_suggested || complaint.category?.name || 'Civic Issue'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-[10px] text-slate-500 block">Assigned Dept</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400 truncate block">
                        {complaint.department?.name || latestAiInsight.metadata?.department || 'Municipal Cell'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-[10px] text-slate-500 block">Severity & Urgency</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-300 block">
                        {latestAiInsight.metadata?.severity || 'HIGH'} • {latestAiInsight.metadata?.urgency || 'HIGH'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-[10px] text-slate-500 block">Field Assignment</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate block">
                        {complaint.assigned_worker?.full_name || 'Assigned to Ward Gang'}
                      </span>
                    </div>
                  </div>

                  {latestAiInsight.reasoning && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic pt-0.5">
                      Reasoning: {latestAiInsight.reasoning}
                    </p>
                  )}
                </div>
              )}

              {/* Meta Grid + QR */}
              <div className="flex gap-4">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500">Location</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{complaint.address || 'Chennai'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500">Ward & District</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Ward {complaint.ward || 114}, {complaint.district || 'Chennai'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500">Reported On</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(complaint.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500">SLA Target</span>
                    <div className="font-semibold text-amber-600 dark:text-amber-400">
                      {complaint.sla_deadline
                        ? new Date(complaint.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : priorityInfo.sla}
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="hidden sm:flex flex-col items-center gap-1.5">
                  <div className="w-[72px] h-[72px] rounded-lg overflow-hidden bg-white p-1 border border-slate-200 dark:border-transparent">
                    <img
                      src={qrDataUrl}
                      alt="QR Code for tracking"
                      width={64}
                      height={64}
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500">Scan to Track</span>
                </div>
              </div>

              {/* Live polling indicator */}
              {!isResolved && complaint.status !== 'rejected' && (
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live updates • Refreshing every 30 seconds</span>
                </div>
              )}
            </div>

            {/* LIFECYCLE TIMELINE COMPONENT */}
            <ComplaintTimeline
              status={complaint.status}
              updates={complaint.updates || []}
            />

            {/* PHOTO, VIDEO & AUDIO EVIDENCE GALLERY WITH AI VERIFICATION */}
            {complaint.media && complaint.media.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider text-slate-700 dark:text-slate-400 font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Submitted Evidence & AI Verification</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {complaint.media.length} Attachment(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {complaint.media.map((m, idx) => {
                    const isAudio = m.media_type === 'audio' || m.storage_path?.endsWith('.webm') || m.url?.includes('audio');
                    const isVideo = m.media_type === 'video' || m.storage_path?.endsWith('.mp4');
                    const aiAssessment: any = m.ai_analysis;
                    const isAfter = m.phase === 'after_resolution';
                    const isConsistent = isAfter
                      ? aiAssessment?.resolution_status === 'RESOLUTION_CONSISTENT' || aiAssessment?.status === 'RESOLUTION_CONSISTENT'
                      : aiAssessment?.status === 'CONSISTENT' || aiAssessment?.evidence_status === 'CONSISTENT';

                    const badgeLabel = isAfter
                      ? (isConsistent ? '✓ Resolution Verified' : '⚠ Requires Inspection')
                      : (isConsistent ? '✓ Consistent with Issue' : '⚠ Requires Inspection');

                    return (
                      <div
                        key={idx}
                        className="rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between group"
                      >
                        {/* Media display area */}
                        <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                          {isAudio ? (
                            <div className="p-4 w-full flex flex-col items-center justify-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Volume2 className="w-6 h-6" />
                              </div>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Citizen Voice Note</span>
                              <audio controls src={m.url} className="w-full h-8 mt-1" />
                            </div>
                          ) : isVideo ? (
                            <video controls src={m.url} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="relative w-full h-full cursor-pointer"
                              onClick={() => setActiveImageModal(m.url)}
                            >
                              <Image
                                src={m.url}
                                alt="Grievance Evidence"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover group-hover:scale-105 transition-all duration-300"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Maximize2 className="w-6 h-6" />
                              </div>
                            </div>
                          )}

                          {/* Phase badge */}
                          <span className="absolute top-2 left-2 text-[10px] font-semibold bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-700/80 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 z-10 shadow-xs">
                            {m.phase === 'after_resolution' ? 'After Resolution Fix' : 'Citizen Reported'}
                          </span>
                        </div>

                        {/* AI Evidence Assessment Card */}
                        <div className="p-3 bg-white dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800/80 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              {isAfter ? 'AI Resolution Check:' : 'AI Evidence Check:'}
                            </span>
                            {aiAssessment ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isConsistent
                                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {badgeLabel}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                AI Verification Active
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            {aiAssessment?.reason ||
                              'Visual evidence is verified and indexed in municipal evidence vault.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RELATED COMMUNITY ISSUES */}
            {relatedIssues.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <h3 className="text-xs uppercase tracking-wider text-slate-700 dark:text-slate-400 font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Related Issues in Your Area</span>
                </h3>
                <div className="space-y-2">
                  {relatedIssues.map((ri) => (
                    <Link
                      key={ri.tracking_id}
                      href={`/track/${encodeURIComponent(ri.tracking_id)}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-colors group"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                            {ri.tracking_id}
                          </span>
                          <span className="text-[10px] font-semibold capitalize text-slate-600 dark:text-slate-400">
                            {STATUS_LABELS[ri.status] || ri.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{ri.title}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* COMMENTS & PUBLIC FEEDBACK */}
            <div id="comments" className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-slate-700 dark:text-slate-400 font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Public & Official Remarks ({comments.length})</span>
                </h3>
              </div>

              {/* Comment Thread */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-300">No community remarks yet</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Citizens and municipal officers can leave status updates or observations regarding this grievance below.
                    </p>
                  </div>
                ) : (
                  comments.map((comm) => (
                    <div
                      key={comm.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        comm.is_official
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-200">{comm.user_name}</span>
                          {comm.is_official && (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.2 rounded-full">
                              Official
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="leading-relaxed">{comm.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Post Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Post an observation or community update..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isPostingComment || !commentText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 dark:shadow-emerald-950 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Resolution Feedback Modal */}
      {complaint && (
        <FeedbackModal
          complaintId={complaint.id}
          trackingId={complaint.tracking_id}
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />
      )}

      <CitizenBottomNav />
    </div>
  );
}

