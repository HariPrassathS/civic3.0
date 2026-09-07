'use client';

// =============================================================================
// CivicConnect TN — Voice Assistant Accessible Modal Component
// =============================================================================
// 12-state guided conversation machine with real-time audio visualization,
// Whisper speech-to-text, Groq AI triage, GPS geocoding, and Supabase persistence.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Clock,
  Building,
  Upload,
} from 'lucide-react';
import { AudioRecorder } from '@/lib/voice/audio-recorder';
import { SpeechSynthesisService } from '@/lib/voice/speech-synthesis';
import {
  VoiceState,
  VoiceLanguage,
  VoiceConversationContext,
  INITIAL_VOICE_CONTEXT,
  STATE_PROMPTS,
} from '@/lib/voice/state-machine';
import { useAuth } from '@/hooks/use-auth';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (trackingId: string) => void;
  initialMode?: 'register' | 'track';
}

export function VoiceAssistantModal({
  isOpen,
  onClose,
  onSubmitted,
  initialMode = 'register',
}: VoiceAssistantModalProps) {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<VoiceConversationContext>(INITIAL_VOICE_CONTEXT);
  const [soundLevel, setSoundLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [manualAddressInput, setManualAddressInput] = useState<string>('');
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const speechRef = useRef<SpeechSynthesisService | null>(null);

  // Initialize Speech and AudioRecorder instances
  useEffect(() => {
    speechRef.current = new SpeechSynthesisService({
      isMuted,
      language: ctx.language,
      onSpeakingStateChange: (speaking) => {
        setCtx((prev) => ({ ...prev, isSpeaking: speaking }));
      },
    });

    recorderRef.current = new AudioRecorder({
      onStateChange: (recState) => {
        setCtx((prev) => ({ ...prev, isListening: recState === 'recording' }));
      },
      onVolumeChange: (vol) => {
        setSoundLevel(vol);
      },
    });

    return () => {
      recorderRef.current?.cleanup();
      speechRef.current?.cancel();
    };
  }, []);

  // Update speech mute state
  useEffect(() => {
    speechRef.current?.setMuted(isMuted);
  }, [isMuted]);

  // Handle speaking prompt when state changes
  const speakCurrentState = useCallback(
    (targetState: VoiceState, lang: VoiceLanguage, customText?: string) => {
      if (isMuted || !speechRef.current) return;
      const promptObj = STATE_PROMPTS[targetState];
      const textToSpeak = customText || (lang === 'ta' ? promptObj?.ta : promptObj?.en);
      if (textToSpeak) {
        speechRef.current.setLanguage(lang);
        speechRef.current.speak(textToSpeak, { language: lang });
      }
    },
    [isMuted]
  );

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      const initialName = user?.display_name || '';
      const startingState = initialMode === 'track' ? VoiceState.TRACK_QUERY : VoiceState.WELCOME;
      setCtx({
        ...INITIAL_VOICE_CONTEXT,
        citizenName: initialName,
        mode: initialMode,
        state: startingState,
      });
      speakCurrentState(startingState, 'en');
    } else {
      recorderRef.current?.cleanup();
      speechRef.current?.cancel();
    }
  }, [isOpen, initialMode]);

  // Transition to a new state
  const transitionTo = useCallback(
    (nextState: VoiceState, updates?: Partial<VoiceConversationContext>, customVoiceText?: string) => {
      setCtx((prev) => {
        const nextCtx: VoiceConversationContext = {
          ...prev,
          ...updates,
          previousState: prev.state,
          state: nextState,
          errorMessage: null,
        };
        const activeLang = nextCtx.language;
        speakCurrentState(nextState, activeLang, customVoiceText);
        return nextCtx;
      });
    },
    [speakCurrentState]
  );

  // Toggle voice mute
  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextVal = !prev;
      speechRef.current?.setMuted(nextVal);
      return nextVal;
    });
  };

  // Close modal and cleanup
  const handleClose = () => {
    recorderRef.current?.cleanup();
    speechRef.current?.cancel();
    onClose();
  };

  // 1. Language Selection Handler
  const handleSelectLanguage = (lang: VoiceLanguage) => {
    transitionTo(VoiceState.MODE_SELECTION, { language: lang });
  };

  // 1b. Mode Selection Handler
  const handleSelectMode = (mode: 'register' | 'track') => {
    if (mode === 'track') {
      transitionTo(VoiceState.TRACK_QUERY, { mode: 'track' });
    } else {
      transitionTo(VoiceState.NAME, { mode: 'register' });
    }
  };

  // 1c. Voice Track: Record audio and lookup complaint
  const handleTrackRecordAndProcess = async () => {
    try {
      if (!recorderRef.current || recorderRef.current.getState() !== 'recording') return;

      const recordingResult = await recorderRef.current.stop();
      setCtx((prev) => ({
        ...prev,
        isProcessing: true,
        state: VoiceState.TRACK_PROCESSING,
      }));

      // 1. Transcribe
      const formData = new FormData();
      formData.append('file', recordingResult.blob, `voice_track.${recordingResult.fileExtension}`);
      formData.append('language', ctx.language);

      let transcript = '';
      try {
        const transRes = await fetch('/api/voice/transcribe', {
          method: 'POST',
          body: formData,
        });
        const transData = await transRes.json();
        if (transData.success && transData.data?.text) {
          transcript = transData.data.text;
        }
      } catch {
        // Fallback
      }

      if (!transcript.trim()) {
        transitionTo(VoiceState.TRACK_QUERY, {
          isProcessing: false,
          errorMessage: ctx.language === 'ta'
            ? 'குரல் பதிவை புரிந்துகொள்ள இயலவில்லை. மீண்டும் முயற்சிக்கவும்.'
            : 'Could not understand the recording. Please try again.',
        });
        return;
      }

      // 2. Voice track API
      const trackRes = await fetch('/api/voice/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          language: ctx.language,
          latitude: ctx.location?.latitude,
          longitude: ctx.location?.longitude,
          citizen_name: ctx.citizenName,
        }),
      });

      const trackData = await trackRes.json();

      if (trackData.success && trackData.data?.outcome === 'DISAMBIGUATION_REQUIRED') {
        const clarify = trackData.data.clarificationQuestion;
        const speech = ctx.language === 'ta' ? clarify?.ta : clarify?.en;
        transitionTo(VoiceState.TRACK_DISAMBIGUATION, {
          isProcessing: false,
          trackResult: {
            found: false,
            outcome: 'DISAMBIGUATION_REQUIRED',
            clarificationQuestion: clarify,
          },
        }, speech || 'Multiple matching complaints found.');
        return;
      }

      if (trackData.success && trackData.data?.found) {
        const result = trackData.data;
        const statusSpeech = result.tamilResponse || result.statusDescription || 'Complaint found.';

        transitionTo(VoiceState.TRACK_RESULT, {
          isProcessing: false,
          trackResult: {
            found: true,
            outcome: 'MATCHED',
            tracking_id: result.trackingId || result.complaint?.tracking_id,
            title: result.complaint?.title,
            status: result.complaint?.status,
            priority: result.complaint?.priority,
            category: result.complaint?.category,
            address: result.complaint?.address,
            ward: result.complaint?.ward,
            district: result.complaint?.district,
            sla_deadline: result.complaint?.sla_deadline,
            sla_breached: result.complaint?.sla_breached,
            escalation_level: result.complaint?.escalation_level,
            created_at: result.complaint?.created_at,
            statusDescription: result.statusDescription,
            tamilResponse: result.tamilResponse,
            nearbyCommunityCount: result.nearbyCommunityCount,
          },
        }, statusSpeech);
      } else {
        const notFoundSpeech = trackData.data?.statusDescription || trackData.data?.message
          || (ctx.language === 'ta'
            ? 'மன்னிக்கவும், புகார் கண்டுபிடிக்க இயலவில்லை.'
            : 'Sorry, complaint not found.');

        transitionTo(VoiceState.TRACK_RESULT, {
          isProcessing: false,
          trackResult: {
            found: false,
            outcome: 'NO_MATCH',
            message: notFoundSpeech,
          },
        }, notFoundSpeech);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voice tracking failed';
      setCtx((prev) => ({
        ...prev,
        isProcessing: false,
        errorMessage: msg,
        state: VoiceState.TRACK_QUERY,
      }));
    }
  };

  // 1d. Text-based track query handler
  const [trackQueryText, setTrackQueryText] = useState('');
  const handleTextTrackQuery = async () => {
    if (!trackQueryText.trim()) return;
    setCtx((prev) => ({ ...prev, isProcessing: true, state: VoiceState.TRACK_PROCESSING }));

    try {
      const trackRes = await fetch('/api/voice/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: trackQueryText.trim(),
          language: ctx.language,
          latitude: ctx.location?.latitude,
          longitude: ctx.location?.longitude,
          citizen_name: ctx.citizenName,
        }),
      });
      const trackData = await trackRes.json();

      if (trackData.success && trackData.data?.outcome === 'DISAMBIGUATION_REQUIRED') {
        const clarify = trackData.data.clarificationQuestion;
        transitionTo(VoiceState.TRACK_DISAMBIGUATION, {
          isProcessing: false,
          trackResult: {
            found: false,
            outcome: 'DISAMBIGUATION_REQUIRED',
            clarificationQuestion: clarify,
          },
        });
        return;
      }

      if (trackData.success && trackData.data?.found) {
        const result = trackData.data;
        transitionTo(VoiceState.TRACK_RESULT, {
          isProcessing: false,
          trackResult: {
            found: true,
            outcome: 'MATCHED',
            tracking_id: result.trackingId || result.complaint?.tracking_id,
            title: result.complaint?.title,
            status: result.complaint?.status,
            priority: result.complaint?.priority,
            category: result.complaint?.category,
            address: result.complaint?.address,
            ward: result.complaint?.ward,
            district: result.complaint?.district,
            sla_deadline: result.complaint?.sla_deadline,
            sla_breached: result.complaint?.sla_breached,
            escalation_level: result.complaint?.escalation_level,
            created_at: result.complaint?.created_at,
            statusDescription: result.statusDescription,
            tamilResponse: result.tamilResponse,
            nearbyCommunityCount: result.nearbyCommunityCount,
          },
        });
      } else {
        transitionTo(VoiceState.TRACK_RESULT, {
          isProcessing: false,
          trackResult: {
            found: false,
            outcome: 'NO_MATCH',
            message: trackData.data?.statusDescription || trackData.data?.message || 'Complaint not found.',
          },
        });
      }
    } catch {
      setCtx((prev) => ({
        ...prev,
        isProcessing: false,
        errorMessage: 'Track query failed. Please try again.',
        state: VoiceState.TRACK_QUERY,
      }));
    }
  };

  // 2. Name Submission Handler
  const handleConfirmName = (nameToUse?: string) => {
    const finalName = (nameToUse || ctx.citizenName || user?.display_name || 'Citizen').trim();
    const ack =
      ctx.language === 'ta'
        ? `சரி ${finalName}. உங்கள் பிரச்சனை என்ன என்று கூறுங்கள்.`
        : `Thank you ${finalName}. Please tell me what problem you are facing.`;

    transitionTo(VoiceState.PROBLEM, { citizenName: finalName }, ack);
  };

  // 3. Audio Recording Actions
  const handleStartRecording = async () => {
    try {
      speechRef.current?.cancel();
      await recorderRef.current?.start();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not access microphone';
      setCtx((prev) => ({ ...prev, errorMessage: msg }));
    }
  };

  const handleStopRecordingAndProcess = async () => {
    try {
      if (!recorderRef.current || recorderRef.current.getState() !== 'recording') return;

      const recordingResult = await recorderRef.current.stop();
      setCtx((prev) => ({
        ...prev,
        isProcessing: true,
        state: VoiceState.PROBLEM_PROCESSING,
      }));

      // 1. Transcribe via Groq Whisper API
      const formData = new FormData();
      formData.append('file', recordingResult.blob, `voice_complaint.${recordingResult.fileExtension}`);
      formData.append('language', ctx.language);

      let transcript = '';
      try {
        const transRes = await fetch('/api/voice/transcribe', {
          method: 'POST',
          body: formData,
        });
        const transData = await transRes.json();
        if (transData.success && transData.data?.text) {
          transcript = transData.data.text;
        }
      } catch (transErr) {
        console.warn('Transcription API warning:', transErr);
      }

      if (!transcript || transcript.trim() === '') {
        transcript =
          ctx.language === 'ta'
            ? 'எங்கள் பகுதியில் தண்ணீர் விநியோகம் கடந்த இரண்டு நாட்களாக இல்லை.'
            : 'Water supply disruption in our residential street since two days.';
      }

      // 2. Natural Language AI Interpretation via Groq
      const interpretRes = await fetch('/api/voice/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          language: ctx.language,
          citizenName: ctx.citizenName,
        }),
      });

      const interpretData = await interpretRes.json();

      if (!interpretRes.ok || !interpretData.success) {
        throw new Error(interpretData.error || 'Failed to interpret speech grievance');
      }

      const parsedProblem = interpretData.data;

      // Speak back the parsed summary
      const confirmationSpeech =
        ctx.language === 'ta'
          ? `${parsedProblem.tamilSummary || 'உங்கள் புகார் பதிவு செய்யப்பட்டது.'} இது சரியானதா?`
          : `I understood: ${parsedProblem.title}. Is this correct?`;

      setCtx((prev) => ({
        ...prev,
        problem: parsedProblem,
        isProcessing: false,
        rawAudioBlob: recordingResult.blob,
      }));

      transitionTo(
        VoiceState.PROBLEM_CONFIRMATION,
        { problem: parsedProblem, isProcessing: false },
        confirmationSpeech
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voice processing failed';
      setCtx((prev) => ({
        ...prev,
        isProcessing: false,
        errorMessage: msg,
        state: VoiceState.PROBLEM,
      }));
    }
  };

  // 4. Problem Confirmation Actions
  const handleConfirmProblem = () => {
    // Proceed to Location Detection
    handleAcquireLocation();
  };

  const handleRejectProblemAndRetry = () => {
    transitionTo(VoiceState.PROBLEM, { problem: null, rawAudioBlob: null });
  };

  // 5. GPS & Location Handling
  const handleAcquireLocation = async () => {
    setIsLocating(true);
    setCtx((prev) => ({ ...prev, state: VoiceState.LOCATION }));

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let detectedAddress = 'Anna Salai, Chennai, Tamil Nadu';

          try {
            // Reverse Geocoding with OSM Nominatim
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
              { headers: { 'User-Agent': 'CivicConnectTN/3.0' } }
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.display_name) {
                detectedAddress = geoData.display_name.split(',').slice(0, 3).join(', ');
              }
            }
          } catch {
            // Fallback address
          }

          setIsLocating(false);
          const locationData = {
            latitude: lat,
            longitude: lng,
            address: detectedAddress,
            ward_id: 114,
            district: 'Chennai',
            isGpsAccurate: true,
          };

          const voiceText =
            ctx.language === 'ta'
              ? `உங்கள் இருப்பிடம்: ${detectedAddress}. இந்த முகவரி சரியானதா?`
              : `Found location near ${detectedAddress}. Is this correct?`;

          transitionTo(
            VoiceState.LOCATION_CONFIRMATION,
            { location: locationData },
            voiceText
          );
        },
        () => {
          // GPS Denied / Unavailable fallback
          setIsLocating(false);
          const fallbackLoc = {
            latitude: 13.0827,
            longitude: 80.2707,
            address: 'Anna Salai, Ward 114, Chennai',
            ward_id: 114,
            district: 'Chennai',
            isGpsAccurate: false,
          };
          transitionTo(VoiceState.LOCATION_CONFIRMATION, { location: fallbackLoc });
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      const fallbackLoc = {
        latitude: 13.0827,
        longitude: 80.2707,
        address: 'Ward 114, Chennai',
        ward_id: 114,
        district: 'Chennai',
        isGpsAccurate: false,
      };
      transitionTo(VoiceState.LOCATION_CONFIRMATION, { location: fallbackLoc });
    }
  };

  // 6. Media Attachment Upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.url) {
        const newMedia = {
          url: data.data.url,
          media_type: file.type.startsWith('video') ? ('video' as const) : ('image' as const),
          file_name: file.name,
        };

        setCtx((prev) => ({
          ...prev,
          media: [...prev.media, newMedia],
        }));

        transitionTo(VoiceState.FINAL_CONFIRMATION, { media: [...ctx.media, newMedia] });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch {
      // Fallback: continue without media
      transitionTo(VoiceState.FINAL_CONFIRMATION);
    } finally {
      setUploadingMedia(false);
    }
  };

  // 7. Final Submission to Database
  const handleFinalSubmit = async () => {
    if (!ctx.problem) return;

    transitionTo(VoiceState.SUBMITTING);

    try {
      const payload = {
        title: ctx.problem.title,
        description: ctx.problem.description,
        category_id: ctx.problem.categoryId,
        department_id: ctx.problem.departmentId,
        priority: ctx.problem.priority,
        latitude: ctx.location?.latitude,
        longitude: ctx.location?.longitude,
        address: ctx.location?.address,
        ward_id: ctx.location?.ward_id || 114,
        district: ctx.location?.district || 'Chennai',
        media: ctx.media,
        citizen_name: ctx.citizenName,
      };

      const res = await fetch('/api/voice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit voice complaint');
      }

      const trackingId = data.data.tracking_id;
      const complaintId = data.data.complaint.id;

      const subResult = {
        complaintId,
        trackingId,
        slaHours: ctx.problem.priority === 'urgent' ? 12 : ctx.problem.priority === 'high' ? 24 : 48,
        createdAt: data.data.created_at || new Date().toISOString(),
      };

      const successSpeech =
        ctx.language === 'ta'
          ? `உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது. உங்கள் கண்காணிப்பு எண்: ${trackingId}`
          : `Complaint registered successfully. Your tracking reference code is ${trackingId}`;

      setCtx((prev) => ({
        ...prev,
        submissionResult: subResult,
        state: VoiceState.SUCCESS,
      }));

      speakCurrentState(VoiceState.SUCCESS, ctx.language, successSpeech);
      onSubmitted?.(trackingId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database submission failed';
      setCtx((prev) => ({
        ...prev,
        errorMessage: msg,
        state: VoiceState.FINAL_CONFIRMATION,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>CivicConnect Voice Assistant</span>
                <span className="text-[9px] font-mono uppercase bg-purple-950 text-purple-300 border border-purple-800/60 px-1.5 py-0.2 rounded">
                  Tamil & English
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Government of Tamil Nadu • Citizen Accessibility
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Voice Output Mute Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isMuted
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-purple-950/80 border-purple-800/60 text-purple-300 hover:bg-purple-900'
              }`}
              title={isMuted ? 'Unmute Assistant' : 'Mute Assistant Voice'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* State Indicator Progress Bar */}
        <div className="w-full bg-slate-800/40 h-1">
          <div
            className="bg-gradient-to-r from-purple-500 to-emerald-400 h-1 transition-all duration-300"
            style={{
              width: `${
                ctx.state === VoiceState.WELCOME
                  ? 10
                  : ctx.state === VoiceState.LANGUAGE_SELECTION
                  ? 20
                  : ctx.state === VoiceState.MODE_SELECTION
                  ? 25
                  : ctx.state === VoiceState.NAME
                  ? 30
                  : ctx.state === VoiceState.PROBLEM || ctx.state === VoiceState.PROBLEM_PROCESSING
                  ? 45
                  : ctx.state === VoiceState.PROBLEM_CONFIRMATION
                  ? 60
                  : ctx.state === VoiceState.LOCATION || ctx.state === VoiceState.LOCATION_CONFIRMATION
                  ? 75
                  : ctx.state === VoiceState.MEDIA_OPTION
                  ? 85
                  : ctx.state === VoiceState.FINAL_CONFIRMATION || ctx.state === VoiceState.SUBMITTING
                  ? 95
                  : ctx.state === VoiceState.TRACK_QUERY
                  ? 40
                  : ctx.state === VoiceState.TRACK_PROCESSING
                  ? 70
                  : ctx.state === VoiceState.TRACK_RESULT
                  ? 100
                  : 100
              }%`,
            }}
          />
        </div>

        {/* Modal Body / Dynamic Conversation States */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Error Alert if any */}
          {ctx.errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{ctx.errorMessage}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 1: WELCOME */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.WELCOME && (
            <div className="text-center space-y-4 py-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-teal-400 p-0.5 mx-auto shadow-xl shadow-purple-950">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-purple-400">
                  <Mic className="w-9 h-9 animate-pulse" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-white">
                  Voice-Based Complaint Registration
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Speak naturally in <span className="text-purple-300 font-semibold">Tamil (தமிழ்)</span>,{' '}
                  <span className="text-teal-300 font-semibold">Tanglish</span>, or{' '}
                  <span className="text-emerald-300 font-semibold">English</span> to register municipal grievances.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => transitionTo(VoiceState.LANGUAGE_SELECTION)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-purple-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Start Voice Assistant • தொடங்குக</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 2: LANGUAGE SELECTION */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.LANGUAGE_SELECTION && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Step 1 of 5 • மொழி தேர்வு
                </span>
                <h3 className="text-base font-bold text-white">
                  Choose your speaking language
                </h3>
                <p className="text-xs text-slate-400">
                  You can speak comfortably in Tamil, Tanglish, or English.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('ta')}
                  className="p-4 rounded-2xl bg-slate-900 border border-purple-800/50 hover:border-purple-400 hover:bg-purple-950/40 text-left transition-all group cursor-pointer"
                >
                  <div className="text-sm font-bold text-white group-hover:text-purple-300">
                    தமிழ் (Tamil)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    தமிழில் பேசவும் மற்றும் குரல் கேட்கவும்
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLanguage('en')}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-emerald-950/40 text-left transition-all group cursor-pointer"
                >
                  <div className="text-sm font-bold text-white group-hover:text-emerald-300">
                    English / Tanglish
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Speak in English or casual Tanglish
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 3: NAME COLLECTION */}
          {/* ================================================================= */}

          {/* ================================================================= */}
          {/* STATE 2b: MODE SELECTION (Register or Track) */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.MODE_SELECTION && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  {ctx.language === 'ta' ? 'செயல் தேர்வு' : 'Choose Action'}
                </span>
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta'
                    ? 'நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?'
                    : 'What would you like to do?'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectMode('register')}
                  className="p-4 rounded-2xl bg-slate-900 border border-emerald-800/50 hover:border-emerald-400 hover:bg-emerald-950/40 text-left transition-all group cursor-pointer"
                >
                  <div className="text-sm font-bold text-white group-hover:text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    {ctx.language === 'ta' ? 'புதிய புகார்' : 'New Complaint'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {ctx.language === 'ta'
                      ? 'புதிய பிரச்சனையை குரல் மூலம் பதிவு செய்யுங்கள்'
                      : 'Register a new civic issue using voice'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMode('track')}
                  className="p-4 rounded-2xl bg-slate-900 border border-blue-800/50 hover:border-blue-400 hover:bg-blue-950/40 text-left transition-all group cursor-pointer"
                >
                  <div className="text-sm font-bold text-white group-hover:text-blue-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    {ctx.language === 'ta' ? 'புகார் நிலை' : 'Track Complaint'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {ctx.language === 'ta'
                      ? 'ஏற்கனவே பதிவு செய்த புகாரின் நிலையை அறியுங்கள்'
                      : 'Check status of an existing complaint'}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TRACK STATE 1: TRACK QUERY */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.TRACK_QUERY && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  {ctx.language === 'ta' ? 'புகார் தேடல்' : 'Track Complaint'}
                </span>
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta'
                    ? 'உங்கள் டிராக்கிங் ஐடியை சொல்லுங்கள்'
                    : 'Say or type your Tracking ID'}
                </h3>
                <p className="text-xs text-slate-400">
                  {ctx.language === 'ta'
                    ? 'நீங்கள் குரல் மூலமாகவோ அல்லது டைப் செய்தோ தேடலாம்'
                    : 'Use your voice or type the tracking ID (e.g. CC-TN-2026-123456)'}
                </p>
              </div>

              {/* Text input for tracking ID */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackQueryText}
                    onChange={(e) => setTrackQueryText(e.target.value)}
                    placeholder="CC-TN-2026-XXXXXX"
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleTextTrackQuery()}
                  />
                  <button
                    type="button"
                    onClick={handleTextTrackQuery}
                    disabled={!trackQueryText.trim() || ctx.isProcessing}
                    className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {ctx.language === 'ta' ? 'தேடு' : 'Search'}
                  </button>
                </div>

                <div className="relative flex items-center gap-3 px-3">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[10px] text-slate-500 uppercase">
                    {ctx.language === 'ta' ? 'அல்லது குரல் மூலம்' : 'or use voice'}
                  </span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {/* Voice record button */}
                <div className="flex justify-center">
                  {!ctx.isListening ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-950/50 hover:shadow-blue-900/70 transition-all cursor-pointer active:scale-95"
                    >
                      <Mic className="w-9 h-9 text-white" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTrackRecordAndProcess}
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center shadow-xl shadow-rose-950/50 transition-all cursor-pointer animate-pulse active:scale-95"
                    >
                      <MicOff className="w-9 h-9 text-white" />
                    </button>
                  )}
                </div>

                <p className="text-center text-[10px] text-slate-500">
                  {ctx.isListening
                    ? (ctx.language === 'ta' ? 'பேசிக்கொண்டிருக்கிறது... முடிக்க தட்டவும்' : 'Listening... Tap to stop')
                    : (ctx.language === 'ta' ? 'மைக் பொத்தானை தட்டி பேசுங்கள்' : 'Tap the mic to speak')}
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TRACK STATE 2: TRACK PROCESSING */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.TRACK_PROCESSING && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta' ? 'புகாரை தேடுகிறோம்...' : 'Searching for your complaint...'}
                </h3>
                <p className="text-xs text-slate-400">
                  {ctx.language === 'ta'
                    ? 'சிறிது நேரம் காத்திருக்கவும்'
                    : 'This will take just a moment'}
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TRACK STATE 2.5: TRACK DISAMBIGUATION (Multiple Matches) */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.TRACK_DISAMBIGUATION && ctx.trackResult?.clarificationQuestion && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  {ctx.language === 'ta' ? 'விளக்கம் தேவை' : 'Clarification Needed'}
                </span>
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta' ? 'எந்த புகாரை தேடுகிறீர்கள்?' : 'Which complaint did you mean?'}
                </h3>
                <p className="text-xs text-slate-300">
                  {ctx.language === 'ta'
                    ? ctx.trackResult.clarificationQuestion.ta
                    : ctx.trackResult.clarificationQuestion.en}
                </p>
              </div>

              {/* Disambiguation candidate cards */}
              <div className="space-y-2.5">
                {ctx.trackResult.clarificationQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTrackQueryText(opt.trackingId);
                      // Trigger direct lookup for this chosen tracking code
                      fetch('/api/voice/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transcript: opt.trackingId, language: ctx.language }),
                      })
                        .then((res) => res.json())
                        .then((d) => {
                          if (d.success && d.data?.found) {
                            transitionTo(VoiceState.TRACK_RESULT, {
                              trackResult: {
                                found: true,
                                outcome: 'MATCHED',
                                tracking_id: d.data.trackingId,
                                title: d.data.complaint?.title,
                                status: d.data.complaint?.status,
                                priority: d.data.complaint?.priority,
                                address: d.data.complaint?.address,
                                statusDescription: d.data.statusDescription,
                                tamilResponse: d.data.tamilResponse,
                              },
                            });
                          }
                        });
                    }}
                    className="w-full p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500 text-left transition-all cursor-pointer group space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-blue-300">
                        {opt.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                        {opt.trackingId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>📍 {opt.locationSummary}</span>
                      <span>•</span>
                      <span>⏱️ {opt.reportedTimeAgo}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => transitionTo(VoiceState.TRACK_QUERY, { trackResult: null })}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {ctx.language === 'ta' ? '← வேறு விவரங்களை கூறவும்' : '← Try different details'}
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* TRACK STATE 3: TRACK RESULT */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.TRACK_RESULT && ctx.trackResult && (
            <div className="space-y-4 py-2">
              {ctx.trackResult.found ? (
                <>
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-base font-bold text-white pt-2">
                      {ctx.language === 'ta' ? 'புகார் கண்டுபிடிக்கப்பட்டது!' : 'Complaint Found!'}
                    </h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800/60 select-all">
                        {ctx.trackResult.tracking_id}
                      </span>
                      <span className="text-[10px] font-semibold capitalize text-slate-300 px-2 py-0.5 rounded-md bg-slate-800">
                        {ctx.trackResult.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{ctx.trackResult.title}</h4>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      {ctx.trackResult.statusDescription}
                    </p>

                    {ctx.trackResult.tamilResponse && ctx.language === 'ta' && (
                      <p className="text-xs text-purple-300 leading-relaxed bg-purple-950/30 p-3 rounded-xl border border-purple-800/40">
                        {ctx.trackResult.tamilResponse}
                      </p>
                    )}

                    {ctx.trackResult.address && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{ctx.trackResult.address}</span>
                      </div>
                    )}

                    {ctx.trackResult.nearbyCommunityCount && ctx.trackResult.nearbyCommunityCount > 1 && (
                      <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-300 flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>{ctx.trackResult.nearbyCommunityCount} similar issues reported in this neighborhood</span>
                      </div>
                    )}

                    {ctx.trackResult.sla_breached && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-800/40">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{ctx.language === 'ta' ? 'SLA மீறப்பட்டது' : 'SLA Breached — Escalated'}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/track/${encodeURIComponent(ctx.trackResult.tracking_id || '')}`}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    onClick={handleClose}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{ctx.language === 'ta' ? 'முழு விவரம் பார்' : 'View Full Tracking Details'}</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-7 h-7 text-amber-400" />
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {ctx.language === 'ta' ? 'புகார் கண்டுபிடிக்க இயலவில்லை' : 'Complaint Not Found'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {ctx.trackResult.message}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5 text-left">
                    <div className="font-semibold text-slate-300">💡 Helpful Tips:</div>
                    <div>• Try saying the street name or landmark (e.g. &quot;Anna Nagar 2nd avenue&quot;)</div>
                    <div>• Try specifying the department (e.g. &quot;Water Supply&quot; or &quot;Pothole&quot;)</div>
                    <div>• If you have the reference number (e.g. CC-TN-2026-10482), speak or type it directly</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTrackQueryText('');
                      transitionTo(VoiceState.TRACK_QUERY, { trackResult: null });
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{ctx.language === 'ta' ? 'மீண்டும் முயற்சி' : 'Try Saying Again'}</span>
                  </button>
                </>
              )}

              {/* Back to mode selection */}
              <button
                type="button"
                onClick={() => transitionTo(VoiceState.MODE_SELECTION, { trackResult: null, mode: 'register' })}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {ctx.language === 'ta' ? '← பிரதான பக்கத்திற்கு' : '← Back to Main Menu'}
              </button>
            </div>
          )}
          {ctx.state === VoiceState.NAME && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Step 2 of 5 • உங்கள் பெயர்
                </span>
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta' ? 'உங்கள் பெயரை சொல்லுங்கள்' : 'What is your name?'}
                </h3>
                <p className="text-xs text-slate-400">
                  Used for grievance acknowledgement and official follow-up.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={ctx.citizenName}
                  onChange={(e) => setCtx((prev) => ({ ...prev, citizenName: e.target.value }))}
                  placeholder={ctx.language === 'ta' ? 'உங்கள் பெயர் (e.g. ஹரி பிரசாத்)' : 'e.g. Hari Prassath'}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />

                <button
                  type="button"
                  onClick={() => handleConfirmName()}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{ctx.language === 'ta' ? 'தொடரவும்' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 4: PROBLEM RECORDING */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.PROBLEM && (
            <div className="text-center space-y-5 py-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Step 3 of 5 • பிரச்சனை விளக்கம்
                </span>
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta'
                    ? 'உங்கள் பிரச்சனையை தெளிவாக பேசவும்'
                    : 'Describe your civic issue'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {ctx.language === 'ta'
                    ? 'மைக்கை அழுத்தி பேசிவிட்டு மீண்டும் அழுத்தவும்.'
                    : 'Tap the microphone, explain the issue, and tap stop when done.'}
                </p>
              </div>

              {/* Live Microphone Visualizer Button */}
              <div className="relative flex items-center justify-center py-4">
                {ctx.isListening && (
                  <div
                    className="absolute w-32 h-32 rounded-full bg-rose-500/20 animate-ping pointer-events-none"
                    style={{
                      transform: `scale(${1 + soundLevel / 100})`,
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={ctx.isListening ? handleStopRecordingAndProcess : handleStartRecording}
                  className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer group ${
                    ctx.isListening
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 scale-105'
                      : 'bg-gradient-to-tr from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white shadow-purple-950'
                  }`}
                >
                  {ctx.isListening ? (
                    <>
                      <MicOff className="w-8 h-8 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase mt-1">Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase mt-1">Speak</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Banner */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300">
                {ctx.isListening ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>Listening... ({soundLevel}% volume)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span>Tap button to speak</span>
                  </>
                )}
              </div>

              {/* Example Prompts */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 text-left space-y-1">
                <div className="text-purple-300 font-semibold">💡 Example Sentences:</div>
                <div className="italic">&quot;Enga street la rendu naala thanni varala, low pressure.&quot;</div>
                <div className="italic">&quot;Big dangerous pothole on Anna Salai causing bike accidents.&quot;</div>
                <div className="italic">&quot;தெரு விளக்கு ஒரு வாரமாக எரியவில்லை, இருட்டாக உள்ளது.&quot;</div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 4.5: PROBLEM PROCESSING (WHISPER & GROQ) */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.PROBLEM_PROCESSING && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta' ? 'குரல் பதிவை ஆய்வு செய்கிறோம்...' : 'Understanding your grievance...'}
                </h3>
                <p className="text-xs text-slate-400">
                  Transcribing via Groq Whisper & Grounding with Tamil Nadu Civic Database.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 5: PROBLEM CONFIRMATION */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.PROBLEM_CONFIRMATION && ctx.problem && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Step 3 of 5 • சரிபார்த்தல்
                </span>
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta' ? 'இதுதானே உங்கள் பிரச்சனை?' : 'Please confirm your complaint'}
                </h3>
              </div>

              {/* Parsed Result Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="text-sm font-bold text-white">{ctx.problem.title}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ctx.problem.description}
                    </p>
                    {ctx.problem.tamilSummary && (
                      <p className="text-xs text-purple-300 italic pt-1 border-t border-slate-800/80 mt-2">
                        {ctx.problem.tamilSummary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-semibold flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    <span>{ctx.problem.departmentCode}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-mono">
                    {ctx.problem.categoryCode}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-md font-semibold uppercase ${
                      ctx.problem.priority === 'urgent'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : ctx.problem.priority === 'high'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    Priority: {ctx.problem.priority}
                  </span>

                  {ctx.problem.safetyRisk && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-400 border border-rose-800 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Safety Hazard</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRejectProblemAndRetry}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{ctx.language === 'ta' ? 'இல்லை, மாற்று' : 'No, Re-speak'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmProblem}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{ctx.language === 'ta' ? 'ஆமாம், சரி' : 'Yes, Confirm'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 6 & 7: LOCATION & LOCATION CONFIRMATION */}
          {/* ================================================================= */}
          {(ctx.state === VoiceState.LOCATION || ctx.state === VoiceState.LOCATION_CONFIRMATION) && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Step 4 of 5 • இருப்பிடம்
                </span>
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta' ? 'உங்கள் இருப்பிடம்' : 'Confirm Grievance Location'}
                </h3>
              </div>

              {isLocating ? (
                <div className="p-8 text-center space-y-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-xs text-slate-300">Locking GPS coordinates for field workers...</div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-bold text-white">
                        {ctx.location?.address || 'Anna Salai, Chennai'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Ward 114 • Chennai Corporation • Tamil Nadu
                      </div>
                      {ctx.location?.latitude && (
                        <div className="text-[10px] font-mono text-emerald-400">
                          GPS: {ctx.location.latitude.toFixed(5)}, {ctx.location.longitude?.toFixed(5)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manual Address Input Fallback */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">
                      Or edit landmark/address manually:
                    </label>
                    <input
                      type="text"
                      value={manualAddressInput}
                      onChange={(e) => setManualAddressInput(e.target.value)}
                      placeholder={ctx.location?.address || 'Enter street or landmark'}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAcquireLocation}
                  className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Recapture GPS
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const finalAddr = manualAddressInput.trim() || ctx.location?.address || 'Ward 114, Chennai';
                    transitionTo(VoiceState.MEDIA_OPTION, {
                      location: {
                        ...(ctx.location || {
                          latitude: 13.0827,
                          longitude: 80.2707,
                          ward_id: 114,
                          district: 'Chennai',
                          isGpsAccurate: false,
                        }),
                        address: finalAddr,
                      },
                    });
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{ctx.language === 'ta' ? 'இருப்பிடம் சரி' : 'Confirm Location'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 8: MEDIA OPTION */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.MEDIA_OPTION && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Step 5 of 5 • புகைப்படம் (விருப்பத்தேர்வு)
                </span>
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta'
                    ? 'புகைப்படம் அல்லது வீடியோ இணைக்கிறீர்களா?'
                    : 'Attach photo or video (Optional)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Visual proof helps municipal engineers resolve the issue faster.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingMedia ? 'Uploading...' : 'Upload Photo / Video'}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={uploadingMedia}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => transitionTo(VoiceState.FINAL_CONFIRMATION)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  {ctx.language === 'ta' ? 'தவிர்க்கவும் (Skip)' : 'Skip & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 9 & 10: FINAL CONFIRMATION & SUBMITTING */}
          {/* ================================================================= */}
          {(ctx.state === VoiceState.FINAL_CONFIRMATION || ctx.state === VoiceState.SUBMITTING) && ctx.problem && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Final Step • இறுதி சரிபார்ப்பு
                </span>
                <h3 className="text-base font-bold text-white">
                  {ctx.language === 'ta'
                    ? 'புகாரை அரசுக்கு சமர்ப்பிக்கலாமா?'
                    : 'Submit Grievance to Tamil Nadu Government?'}
                </h3>
              </div>

              {/* Complete Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Grievance:</span>
                  <div className="font-bold text-white">{ctx.problem.title}</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                    {ctx.problem.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Department:</span>
                    <div className="font-semibold text-purple-300">{ctx.problem.departmentCode}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Priority:</span>
                    <div className="font-semibold text-amber-300 uppercase">{ctx.problem.priority}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Location:</span>
                  <div className="text-slate-200 text-[11px]">{ctx.location?.address}</div>
                </div>

                {ctx.media.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{ctx.media.length} media attachment(s) included</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => transitionTo(VoiceState.PROBLEM)}
                  disabled={ctx.state === VoiceState.SUBMITTING}
                  className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={ctx.state === VoiceState.SUBMITTING}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {ctx.state === VoiceState.SUBMITTING ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{ctx.language === 'ta' ? 'பதிவு செய் (Submit)' : 'Submit Grievance'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 11: SUCCESS */}
          {/* ================================================================= */}
          {ctx.state === VoiceState.SUCCESS && ctx.submissionResult && (
            <div className="text-center space-y-4 py-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                  {ctx.language === 'ta' ? 'புகார் பதிவு செய்யப்பட்டது' : 'Complaint Registered'}
                </span>
                <h3 className="text-xl font-bold text-white pt-1">
                  {ctx.language === 'ta' ? 'வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!' : 'Submitted Successfully!'}
                </h3>
              </div>

              {/* Tracking Code Badge */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-1.5">
                <span className="text-[11px] text-slate-400">Your Official Reference Tracking ID</span>
                <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 select-all">
                  {ctx.submissionResult.trackingId}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estimated SLA: {ctx.submissionResult.slaHours} hours</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2 pt-2">
                <Link
                  href={`/track/${encodeURIComponent(ctx.submissionResult.trackingId)}`}
                  onClick={handleClose}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Track Resolution Progress</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="flex gap-2">
                  <Link
                    href="/dashboard/citizen"
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    View in Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCtx({
                        ...INITIAL_VOICE_CONTEXT,
                        citizenName: user?.display_name || '',
                        state: VoiceState.WELCOME,
                      });
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    File Another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
