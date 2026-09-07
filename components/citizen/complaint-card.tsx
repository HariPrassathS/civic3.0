'use client';

// =============================================================================
// CivicConnect TN — Citizen Complaint Card Component
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp, MessageSquare, MapPin, Clock, ArrowRight } from 'lucide-react';
import { ComplaintStatus, Priority } from '@/types/enums';

interface ComplaintCardProps {
  complaint: {
    id: string;
    tracking_id: string;
    title: string;
    description: string;
    status: ComplaintStatus | string;
    priority?: Priority | string;
    address?: string | null;
    ward?: number | null;
    district?: string | null;
    created_at: string;
    upvotes_count?: number;
    comments_count?: number;
    is_upvoted?: boolean;
    distance_km?: number;
    media?: { url: string; media_type?: string }[];
  };
  onUpvoteToggle?: (complaintId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  [ComplaintStatus.CREATED]: { label: 'Reported', color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-800/40' },
  [ComplaintStatus.VALIDATED]: { label: 'Validated', color: 'text-blue-400', bg: 'bg-blue-950/60', border: 'border-blue-800/40' },
  [ComplaintStatus.ASSIGNED]: { label: 'Assigned', color: 'text-indigo-400', bg: 'bg-indigo-950/60', border: 'border-indigo-800/40' },
  [ComplaintStatus.IN_PROGRESS]: { label: 'In Progress', color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-800/40' },
  [ComplaintStatus.RESOLUTION_SUBMITTED]: { label: 'Fix Submitted', color: 'text-teal-400', bg: 'bg-teal-950/60', border: 'border-teal-800/40' },
  [ComplaintStatus.OFFICER_VERIFICATION]: { label: 'Verifying', color: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-800/40' },
  [ComplaintStatus.RESOLVED]: { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-800/40' },
  [ComplaintStatus.CLOSED]: { label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-900', border: 'border-slate-800' },
  [ComplaintStatus.REJECTED]: { label: 'Rejected', color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-800/40' },
  [ComplaintStatus.REOPENED]: { label: 'Reopened', color: 'text-orange-400', bg: 'bg-orange-950/60', border: 'border-orange-800/40' },
  [ComplaintStatus.ESCALATED]: { label: 'Escalated', color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-800/40' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  [Priority.URGENT]: { label: 'Urgent', color: 'text-rose-400 bg-rose-950/80 border-rose-800/50' },
  [Priority.HIGH]: { label: 'High Priority', color: 'text-orange-400 bg-orange-950/80 border-orange-800/50' },
  [Priority.MEDIUM]: { label: 'Medium', color: 'text-blue-400 bg-blue-950/80 border-blue-800/50' },
  [Priority.LOW]: { label: 'Low', color: 'text-slate-400 bg-slate-900 border-slate-800' },
};

export function ComplaintCard({ complaint, onUpvoteToggle }: ComplaintCardProps) {
  const [upvoted, setUpvoted] = useState(complaint.is_upvoted ?? false);
  const [count, setCount] = useState(complaint.upvotes_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);

  const statusInfo = STATUS_CONFIG[complaint.status] || {
    label: complaint.status,
    color: 'text-slate-300',
    bg: 'bg-slate-900',
    border: 'border-slate-800',
  };

  const priorityInfo = PRIORITY_CONFIG[complaint.priority || Priority.MEDIUM] || PRIORITY_CONFIG[Priority.MEDIUM];

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    const newUpvoted = !upvoted;
    const newCount = newUpvoted ? count + 1 : Math.max(0, count - 1);

    setUpvoted(newUpvoted);
    setCount(newCount);

    try {
      await fetch('/api/community/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint_id: complaint.id }),
      });
      if (onUpvoteToggle) onUpvoteToggle(complaint.id);
    } catch (error) {
      console.error('Upvote error:', error);
      // Revert on error
      setUpvoted(!newUpvoted);
      setCount(count);
    } finally {
      setIsLiking(false);
    }
  };

  const hasMedia = complaint.media && complaint.media.length > 0;
  const firstImage = hasMedia ? complaint.media![0].url : null;

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all p-4 sm:p-5 flex flex-col justify-between group relative overflow-hidden backdrop-blur-sm">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
            >
              {statusInfo.label}
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${priorityInfo.color}`}
            >
              {priorityInfo.label}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-0.5 rounded-md border border-slate-800">
            {complaint.tracking_id}
          </span>
        </div>

        {/* Media Thumbnail + Title */}
        <div className="flex gap-3 items-start">
          {firstImage && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 relative">
              <Image
                src={firstImage}
                alt={complaint.title}
                fill
                sizes="(max-width: 640px) 64px, 80px"
                className="object-cover group-hover:scale-105 transition-all"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link
              href={`/track/${encodeURIComponent(complaint.tracking_id)}`}
              className="text-sm sm:text-base font-semibold text-slate-100 hover:text-emerald-400 transition-colors line-clamp-2 block"
            >
              {complaint.title}
            </Link>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Location & Meta info */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap pt-1">
          {complaint.address && (
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[180px] sm:max-w-xs">{complaint.address}</span>
            </span>
          )}
          {complaint.ward && (
            <span className="text-slate-400">
              Ward {complaint.ward}
            </span>
          )}
          {complaint.distance_km !== undefined && (
            <span className="text-emerald-400 font-medium">
              📍 {complaint.distance_km} km away
            </span>
          )}
          <span className="flex items-center gap-1 text-slate-500 ml-auto">
            <Clock className="w-3.5 h-3.5" />
            {new Date(complaint.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Bottom Actions: Upvote, Comment count, Track link */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleUpvote}
            disabled={isLiking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              upvoted
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-white' : ''}`} />
            <span>{count}</span>
          </button>

          <Link
            href={`/track/${encodeURIComponent(complaint.tracking_id)}#comments`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{complaint.comments_count ?? 0}</span>
          </Link>
        </div>

        <Link
          href={`/track/${encodeURIComponent(complaint.tracking_id)}`}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-all"
        >
          <span>Track Status</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
