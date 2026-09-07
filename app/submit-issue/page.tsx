'use client';

// =============================================================================
// CivicConnect TN — Submit Issue / Report Grievance Page (/submit-issue)
// =============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  PlusCircle,
  Building,
  Mic,
  Sparkles,
} from 'lucide-react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { CitizenLocationPicker } from '@/components/maps/citizen-location-picker';
import { MediaUploader, type UploadedMediaItem } from '@/components/citizen/media-uploader';
import { VoiceAssistantModal } from '@/components/voice/voice-assistant-modal';
import { useAuth } from '@/hooks/use-auth';
import { Priority, ComplaintSource } from '@/types/enums';

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  default_priority?: string;
  sla_hours?: number;
}

interface CategoryGroup {
  department_id?: string;
  department_name: string;
  department_code: string;
  categories: CategoryItem[];
}

interface SubmittedComplaint {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  address?: string;
  sla_deadline?: string;
}

export default function SubmitIssuePage() {
  // Category state
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');

  // Text state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Location state
  const [latitude, setLatitude] = useState<number | null>(13.0827);
  const [longitude, setLongitude] = useState<number | null>(80.2707);
  const [address, setAddress] = useState('Anna Salai, Chennai');
  const [ward, setWard] = useState<number | null>(114);
  const [district, setDistrict] = useState('Chennai');

  // Media state
  const [media, setMedia] = useState<UploadedMediaItem[]>([]);

  // Config & state
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();
  const [submittedComplaint, setSubmittedComplaint] = useState<SubmittedComplaint | null>(null);
  const [copied, setCopied] = useState(false);
  const currentUser = authUser ? { id: authUser.id, role: authUser.role, display_name: authUser.display_name || '' } : null;

  useEffect(() => {

    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.groups) {
            setCategoryGroups(data.data.groups);
            if (data.data.groups.length > 0 && data.data.groups[0].categories.length > 0) {
              const firstGroup = data.data.groups[0];
              setSelectedDept(firstGroup.department_id || firstGroup.department_code);
              setSelectedCategory(firstGroup.categories[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    for (const group of categoryGroups) {
      const found = group.categories.find((c) => c.id === catId);
      if (found) {
        setSelectedDept(group.department_id || group.department_code);
        break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and detailed description.');
      return;
    }

    if (!address.trim()) {
      setError('Please provide a street address or landmark.');
      return;
    }

    // Mandatory photo evidence rule for literate/web form users
    if (media.length === 0) {
      setError('Photo evidence is mandatory for web grievance submissions. Please upload at least one photo showing the issue.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category_id: selectedCategory || null,
        department_id: selectedDept || null,
        latitude,
        longitude,
        address: address.trim(),
        ward,
        district,
        source: ComplaintSource.TEXT,
        is_public: isPublic,
        media: media.map((m) => ({
          url: m.url,
          storage_path: m.storage_path,
          media_type: m.media_type,
        })),
      };

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit grievance');
      }

      setSubmittedComplaint(data.data.complaint);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit grievance';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingId = () => {
    if (submittedComplaint?.tracking_id) {
      navigator.clipboard.writeText(submittedComplaint.tracking_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // SUCCESS STATE VIEW
  if (submittedComplaint) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 sm:pb-8 selection:bg-emerald-500 selection:text-white transition-colors">
        <CitizenHeader />
        <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-in zoom-in-75">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
              Grievance Registered Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Your issue has been dispatched to Municipal Cell
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              We have assigned an Area Officer and municipal maintenance division to investigate your report.
            </p>
          </div>

          {/* Tracking ID Copy Box */}
          <div className="w-full p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-xl space-y-3">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">
              Official Grievance Tracking ID:
            </span>
            <div className="flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                {submittedComplaint.tracking_id}
              </span>
              <button
                type="button"
                onClick={copyTrackingId}
                className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border border-slate-200 dark:border-transparent"
                title="Copy ID"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Tracking ID copied to clipboard!</p>}
          </div>

          {/* Next Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href={`/track/${encodeURIComponent(submittedComplaint.tracking_id)}`}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 dark:shadow-emerald-950 flex items-center justify-center gap-2"
            >
              <span>Track Live Resolution</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/nearby"
              className="py-3 px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center"
            >
              Explore Nearby Issues
            </Link>
          </div>
        </main>
        <CitizenBottomNav />
      </div>
    );
  }

  // FORM VIEW
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 sm:pb-8 selection:bg-emerald-500 selection:text-white transition-colors">
      <CitizenHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Civic Issue Reporting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Report a Civic Problem
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Submit road, sanitation, water, or electrical issues directly to Tamil Nadu municipal authorities.
          </p>
        </div>

        {/* Officer Mode Warning Banner */}
        {currentUser && currentUser.role !== 'citizen' && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                Government Officer Mode Active ({currentUser.display_name} • {currentUser.role.toUpperCase()})
              </span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                Public grievance submission is reserved for citizens. Government officials manage, inspect, and verify work orders from their respective administrative consoles.
              </p>
            </div>
          </div>
        )}

        {/* Voice Assistant Shortcut Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-100 via-white to-emerald-100 dark:from-purple-950/80 dark:via-slate-900 dark:to-emerald-950/60 border border-purple-200 dark:border-purple-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md dark:shadow-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-200 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Prefer speaking in Tamil or English?</span>
                <span className="text-[9px] bg-purple-100 dark:bg-purple-900/80 px-2 py-0.2 rounded text-purple-700 dark:text-purple-300 font-mono">AI Voice</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                Register this complaint in seconds using voice recognition without typing.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Mic className="w-4 h-4" />
            <span>Use Voice Assistant • பேசுக</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: CATEGORY SELECTION */}
          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xs">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              1. Select Issue Category <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>

            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {categoryGroups.map((group, idx) => (
                <optgroup key={idx} label={group.department_name}>
                  {group.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (SLA: {cat.sla_hours} hrs)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* STEP 2: TITLE & DESCRIPTION */}
          <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xs">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              2. Describe the Grievance <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Issue Title / Summary</label>
              <input
                type="text"
                placeholder="e.g. Deep pothole causing accidents near bus stop"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <span className="text-[10px] text-slate-500 text-right block">{title.length}/100</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Detailed Description</label>
              <textarea
                rows={4}
                placeholder="Provide details such as how long the issue has persisted, severity, and any landmark nearby..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
              />
              <span className="text-[10px] text-slate-500 text-right block">{description.length}/500</span>
            </div>

            {/* AI Automated Priority Assessment Note */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                  AI Triage & Urgency Assessment Active
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  CivicConnect AI automatically analyzes problem severity, public safety risk, and evidence to assign priority and dispatch to the correct department within seconds.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 3: INTERACTIVE GIS LOCATION PICKER */}
          <CitizenLocationPicker
            value={{
              latitude,
              longitude,
              address,
              ward,
              district,
            }}
            onChange={(data) => {
              setLatitude(data.latitude);
              setLongitude(data.longitude);
              setAddress(data.address);
              setWard(data.ward);
              setDistrict(data.district);
            }}
          />

          {/* STEP 4: PHOTO & VIDEO UPLOADER (MANDATORY FOR WEB GRIEVANCES) */}
          <MediaUploader
            media={media}
            onChange={setMedia}
            maxPhotos={4}
            maxVideos={1}
            required={true}
          />

          {/* STEP 5: PRIVACY TOGGLE */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Public Community Visibility
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
                Allow neighbors in your ward to see, upvote, and track this grievance.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                isPublic ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  isPublic ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 dark:shadow-emerald-950 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registering Civic Grievance...</span>
              </>
            ) : (
              <>
                <span>Submit Grievance to Tamil Nadu Government</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </main>

      <CitizenBottomNav />

      {/* Interactive Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSubmitted={(trackingId) => {
          setShowVoiceModal(false);
          // Navigate to tracking
          window.location.href = `/track/${encodeURIComponent(trackingId)}`;
        }}
      />
    </div>
  );
}
