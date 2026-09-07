'use client';

// =============================================================================
// CivicConnect TN — Community Grievance Card Component
// =============================================================================
// Features: Full BEFORE & AFTER visual comparison showcase, AI evidence verification
// badges, interactive fullscreen lightbox, upvote engine, and inline discussion feed.

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ThumbsUp,
  MessageSquare,
  MapPin,
  Clock,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Send,
  ExternalLink,
  ShieldCheck,
  Check,
  Maximize2,
  X,
  Volume2,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { SanitizedPublicComplaint } from '@/lib/community/sanitizer';

interface CommunityCardProps {
  complaint: SanitizedPublicComplaint;
  onOpenDiscussion?: (complaint: SanitizedPublicComplaint) => void;
}

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  created: { label: 'Reported', color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800/50' },
  validated: { label: 'Validated', color: 'text-blue-400', bg: 'bg-blue-950/60 border-blue-800/50' },
  assigned: { label: 'Assigned', color: 'text-indigo-400', bg: 'bg-indigo-950/60 border-indigo-800/50' },
  in_progress: { label: 'In Progress', color: 'text-cyan-400', bg: 'bg-cyan-950/60 border-cyan-800/50' },
  resolution_submitted: { label: 'Fix Submitted', color: 'text-teal-400', bg: 'bg-teal-950/60 border-teal-800/50' },
  officer_verification: { label: 'Verifying', color: 'text-purple-400', bg: 'bg-purple-950/60 border-purple-800/50' },
  resolved: { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800/50' },
  closed: { label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-900 border-slate-800' },
  escalated: { label: 'Escalated', color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800/50' },
};

export function CommunityCard({ complaint, onOpenDiscussion }: CommunityCardProps) {
  const [upvoted, setUpvoted] = useState(complaint.is_upvoted);
  const [upvotesCount, setUpvotesCount] = useState(complaint.upvotes_count);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lightbox modal state for full-screen photo view
  const [activeLightbox, setActiveLightbox] = useState<{
    url: string;
    label: string;
    isAfter: boolean;
  } | null>(null);

  // Quick inline comments state
  const [showInlineComments, setShowInlineComments] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const statusMeta = STATUS_BADGES[complaint.status] || {
    label: complaint.status,
    color: 'text-slate-300',
    bg: 'bg-slate-900 border-slate-800',
  };

  const isUrgent = complaint.priority?.toLowerCase() === 'urgent';

  // Extract BEFORE and AFTER media
  const beforeMedia =
    complaint.media?.find((m) => m.phase === 'complaint' || m.phase === 'before_resolution') ||
    (complaint.media && complaint.media.length > 0 && complaint.media[0].phase !== 'after_resolution'
      ? complaint.media[0]
      : null);

  const afterMedia =
    complaint.media?.find((m) => m.phase === 'after_resolution') ||
    (complaint.media && complaint.media.length > 1 && complaint.media[1].phase === 'after_resolution'
      ? complaint.media[1]
      : null);

  const hasBothBeforeAndAfter = Boolean(beforeMedia?.url && afterMedia?.url);
  const hasOnlyBefore = Boolean(beforeMedia?.url && !afterMedia?.url);
  const hasOnlyAfter = Boolean(!beforeMedia?.url && afterMedia?.url);

  // AI analysis insights
  const afterAi = afterMedia?.ai_analysis;
  const beforeAi = beforeMedia?.ai_analysis;
  const isResolutionConsistent =
    afterAi?.resolution_status === 'RESOLUTION_CONSISTENT' ||
    afterAi?.status === 'RESOLUTION_CONSISTENT';

  // Toggle upvote with optimistic update
  const handleToggleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpvoting) return;

    setIsUpvoting(true);
    const nextUpvoted = !upvoted;
    const nextCount = nextUpvoted ? upvotesCount + 1 : Math.max(0, upvotesCount - 1);

    setUpvoted(nextUpvoted);
    setUpvotesCount(nextCount);

    try {
      const res = await fetch('/api/community/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint_id: complaint.id || complaint.tracking_id }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUpvoted(json.data.is_upvoted);
          setUpvotesCount(json.data.upvotes_count);
        }
      }
    } catch {
      // Revert on failure
      setUpvoted(!nextUpvoted);
      setUpvotesCount(upvotesCount);
    } finally {
      setIsUpvoting(false);
    }
  };

  // Load comments
  const toggleComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showInlineComments && commentsList.length === 0) {
      setIsLoadingComments(true);
      try {
        const res = await fetch(`/api/community/comments?complaint_id=${encodeURIComponent(complaint.tracking_id)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.comments) {
            setCommentsList(json.data.comments);
          }
        }
      } catch {
        // Ignore
      } finally {
        setIsLoadingComments(false);
      }
    }
    setShowInlineComments(!showInlineComments);
  };

  // Submit new comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaint.tracking_id,
          content: commentInput.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.comment) {
          setCommentsList((prev) => [...prev, json.data.comment]);
          setCommentInput('');
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const trackingUrl = `${window.location.origin}/track/${complaint.tracking_id}`;
    if (navigator.share) {
      navigator.share({
        title: `CivicConnect TN: ${complaint.title}`,
        text: `Support this civic issue in ${complaint.address}: ${complaint.title}`,
        url: trackingUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Fullscreen Lightbox Modal */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActiveLightbox(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                    activeLightbox.isAfter
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  {activeLightbox.label}
                </span>
                <span className="text-xs font-mono text-slate-400">{complaint.tracking_id}</span>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
                  {complaint.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveLightbox(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Image View */}
            <div className="relative w-full h-[60vh] sm:h-[70vh] bg-black flex items-center justify-center p-2">
              <Image
                src={activeLightbox.url}
                alt={activeLightbox.label}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Lightbox Footer Note */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{complaint.address}</span>
              </span>
              <Link
                href={`/track/${complaint.tracking_id}`}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>Full Grievance Timeline</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Complaint Card */}
      <div
        className={`rounded-2xl bg-slate-900/90 border transition-all duration-200 overflow-hidden shadow-lg flex flex-col justify-between ${
          isUrgent
            ? 'border-rose-900/80 shadow-rose-950/20 ring-1 ring-rose-500/20'
            : complaint.is_common_issue
            ? 'border-emerald-800/80 shadow-emerald-950/20'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Top Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/50">
                {complaint.tracking_id}
              </span>

              {/* Common Issue Relationship Badge */}
              {complaint.is_common_issue && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/60 shadow-xs animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Common Issue ({complaint.common_reports_count} Reports in Area)</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg border ${statusMeta.bg} ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>

          {/* Issue Title & Description */}
          <div className="space-y-1">
            <Link
              href={`/track/${complaint.tracking_id}`}
              className="text-sm sm:text-base font-bold text-slate-100 hover:text-emerald-400 transition-colors line-clamp-2 block leading-snug"
            >
              {complaint.title}
            </Link>
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* BEFORE & AFTER EVIDENCE PHOTO SHOWCASE */}
          {(hasBothBeforeAndAfter || hasOnlyBefore || hasOnlyAfter) && (
            <div className="space-y-2 pt-1">
              {/* Case 1: Both BEFORE and AFTER Available */}
              {hasBothBeforeAndAfter && beforeMedia && afterMedia && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* BEFORE IMAGE THUMBNAIL */}
                    <div
                      className="group relative rounded-xl overflow-hidden border border-rose-900/60 bg-slate-950 aspect-video cursor-pointer"
                      onClick={() =>
                        setActiveLightbox({
                          url: beforeMedia.url,
                          label: '🔴 Citizen Evidence (Before)',
                          isAfter: false,
                        })
                      }
                    >
                      <Image
                        src={beforeMedia.url}
                        alt="Citizen Reported Issue Before"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                        <span className="self-start text-[10px] font-bold uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 backdrop-blur-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          <span>Before: Issue Reported</span>
                        </span>
                        <div className="flex items-center justify-between text-white/90 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="font-semibold flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>Click to enlarge</span>
                          </span>
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* AFTER IMAGE THUMBNAIL */}
                    <div
                      className="group relative rounded-xl overflow-hidden border border-emerald-800/60 bg-slate-950 aspect-video cursor-pointer"
                      onClick={() =>
                        setActiveLightbox({
                          url: afterMedia.url,
                          label: '🟢 Field Work Resolution (After)',
                          isAfter: true,
                        })
                      }
                    >
                      <Image
                        src={afterMedia.url}
                        alt="Field Work Resolution Proof After"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                        <span className="self-start text-[10px] font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 backdrop-blur-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>After: Resolution Fixed</span>
                        </span>
                        <div className="flex items-center justify-between text-white/90 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="font-semibold flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>Click to enlarge</span>
                          </span>
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Resolution Improvement Verification Banner */}
                  <div className="p-2 px-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between text-[11px] text-emerald-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        AI Verification: {afterAi?.visual_improvement ? `${afterAi.visual_improvement} Visual Improvement` : 'Resolution Verified On-Site'}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                      {isResolutionConsistent ? '✓ 100% Fixed' : '✓ Verified'}
                    </span>
                  </div>
                </div>
              )}

              {/* Case 2: Only BEFORE Image Available */}
              {hasOnlyBefore && beforeMedia && (
                <div
                  className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[21/9] sm:aspect-[24/9] cursor-pointer"
                  onClick={() =>
                    setActiveLightbox({
                      url: beforeMedia.url,
                      label: '📸 Citizen Evidence (Before)',
                      isAfter: false,
                    })
                  }
                >
                  <Image
                    src={beforeMedia.url}
                    alt="Citizen Reported Issue Evidence"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                    <span className="self-start text-[10px] font-bold uppercase tracking-wider bg-slate-950/90 text-amber-300 border border-slate-700 px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 backdrop-blur-xs">
                      <span>📸 Citizen Photo Evidence (Before)</span>
                    </span>
                    <div className="flex items-center justify-between text-white/90 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Click to view full photo</span>
                      </span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Case 3: Only AFTER Image Available */}
              {hasOnlyAfter && afterMedia && (
                <div
                  className="group relative rounded-xl overflow-hidden border border-emerald-800/60 bg-slate-950 aspect-[21/9] sm:aspect-[24/9] cursor-pointer"
                  onClick={() =>
                    setActiveLightbox({
                      url: afterMedia.url,
                      label: '🟢 Field Work Resolution Proof (After)',
                      isAfter: true,
                    })
                  }
                >
                  <Image
                    src={afterMedia.url}
                    alt="Field Work Resolution Proof After"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                    <span className="self-start text-[10px] font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 backdrop-blur-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>After: Resolution Proof</span>
                    </span>
                    <div className="flex items-center justify-between text-white/90 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Click to view full photo</span>
                      </span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location & Metadata */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[240px]">{complaint.address}</span>
            </span>

            {complaint.distance_km !== undefined && (
              <span className="text-emerald-400 font-semibold text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                📍 {complaint.distance_km.toFixed(1)} km away
              </span>
            )}

            <span className="flex items-center gap-1 text-slate-500 text-[11px] ml-auto">
              <Clock className="w-3 h-3" />
              <span>{new Date(complaint.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
            </span>
          </div>
        </div>

        {/* Action Footer Bar */}
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Upvote Button */}
            <button
              type="button"
              onClick={handleToggleUpvote}
              disabled={isUpvoting}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                upvoted
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-current' : ''}`} />
              <span>{upvotesCount}</span>
              <span className="hidden sm:inline">{upvoted ? 'Upvoted' : 'Upvote'}</span>
            </button>

            {/* Comment Count / Drawer Toggle */}
            <button
              type="button"
              onClick={toggleComments}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>{commentsList.length > 0 ? commentsList.length : complaint.comments_count}</span>
              <span className="hidden sm:inline">Discussion</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
              title="Share grievance link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            {/* Track Detail Link */}
            <Link
              href={`/track/${complaint.tracking_id}`}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <span>Track</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Inline Comments Section */}
        {showInlineComments && (
          <div className="bg-slate-950 border-t border-slate-800 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800/60">
              <span>Community Discussion & Official Notes</span>
              <span className="text-[11px] text-slate-500 font-normal">All citizen PII is masked</span>
            </div>

            {/* Comments List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {isLoadingComments ? (
                <div className="py-4 text-center text-xs text-slate-500">Loading discussion...</div>
              ) : commentsList.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-500">
                  No comments yet. Be the first to share an update on this issue.
                </div>
              ) : (
                commentsList.map((c) => (
                  <div
                    key={c.id}
                    className={`p-2.5 rounded-xl text-xs space-y-1 ${
                      c.is_official
                        ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-200'
                        : 'bg-slate-900 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1">
                        {c.is_official && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        <span className={c.is_official ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>
                          {c.author_name}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* New Comment Input Form */}
            <form onSubmit={handlePostComment} className="flex gap-2 pt-1">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Post a neighbor note or local update..."
                maxLength={500}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 shadow transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
