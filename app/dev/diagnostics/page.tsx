'use client';

// =============================================================================
// CivicConnect TN — Developer Diagnostic Console
// =============================================================================
// Comprehensive observability, debugging, and testing interface for:
// 1. Voice Assistant (Microphone -> Whisper -> Groq AI -> Validation -> Supabase)
// 2. Voice Tracking (Microphone/Text -> Intent -> Ref Normalization -> DB Match -> RBAC)
// 3. System Health & Subsystem Probes (Supabase, PostGIS, Groq, Whisper, Storage)
// 4. Conversational State Machine Visualizer (10 states with audio TTS preview)
// 5. API Timing Breakdown & Live Chronological Event Logging

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  Mic,
  MicOff,
  Radio,
  Play,
  Square,
  RefreshCw,
  Copy,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  Brain,
  Search,
  Shield,
  Send,
  Layers,
  Sparkles,
  Volume2,
  FileText,
  Trash2,
  ChevronRight,
  UserCheck,
  MapPin,
  ExternalLink,
  Camera,
} from 'lucide-react';
import { STATE_PROMPTS, VoiceState } from '@/lib/voice/state-machine';

interface HealthReport {
  success: boolean;
  timestamp: string;
  overallStatus: string;
  totalCheckDurationMs: number;
  services: Record<
    string,
    {
      name: string;
      category: string;
      status: 'READY' | 'WARNING' | 'ERROR' | 'NOT_CONFIGURED';
      latencyMs?: number;
      details: string;
      configured: boolean;
    }
  >;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  tag: string;
  message: string;
  data?: any;
}

export default function DeveloperDiagnosticsPage() {
  const [activeTab, setActiveTab] = useState<'assistant' | 'tracking' | 'evidence' | 'statemachine' | 'health'>('assistant');
  const [healthData, setHealthData] = useState<HealthReport | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copiedReport, setCopiedReport] = useState(false);

  // ---------------------------------------------------------------------------
  // Voice Assistant State
  // ---------------------------------------------------------------------------
  const [assistantInputMode, setAssistantInputMode] = useState<'mic' | 'text'>('text');
  const [assistantText, setAssistantText] = useState('Enga street la moonu naala thanni varala, romba kashtama irukku.');
  const [assistantLanguage, setAssistantLanguage] = useState<'ta' | 'en' | 'auto'>('auto');
  const [assistantCitizenName, setAssistantCitizenName] = useState('Hari (Developer Test)');
  const [executionMode, setExecutionMode] = useState<'analyze' | 'submit'>('analyze');
  const [confirmSubmitCheck, setConfirmSubmitCheck] = useState(false);

  // Mic state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Assistant Pipeline Results
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantStep, setAssistantStep] = useState<number>(0);
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);
  const [aiInterpretationResult, setAiInterpretationResult] = useState<any>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [assistantTimings, setAssistantTimings] = useState<{ whisperMs?: number; aiMs?: number; dbMs?: number; totalMs?: number }>({});

  // ---------------------------------------------------------------------------
  // Voice Tracking State
  // ---------------------------------------------------------------------------
  const [trackingQuery, setTrackingQuery] = useState('My water complaint status');
  const [trackingCitizenId, setTrackingCitizenId] = useState('c0000000-0000-0000-0000-000000000001');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any>(null);

  // ---------------------------------------------------------------------------
  // Evidence Diagnostic State
  // ---------------------------------------------------------------------------
  const [evidenceMode, setEvidenceMode] = useState<'before' | 'after'>('before');
  const [evidenceTitle, setEvidenceTitle] = useState('Large Road Pothole near Bus Stop');
  const [evidenceDesc, setEvidenceDesc] = useState('Deep 2-foot pothole on main carriageway.');
  const [evidenceCategory, setEvidenceCategory] = useState('Road Damage');
  const [evidenceBeforeUrl, setEvidenceBeforeUrl] = useState('https://images.unsplash.com/photo-pothole-road-damage-sample-1.jpg');
  const [evidenceAfterUrl, setEvidenceAfterUrl] = useState('https://images.unsplash.com/photo-repaired-asphalt-smooth-surface.jpg');
  const [evidenceNotes, setEvidenceNotes] = useState('Filled with bituminous concrete and compacted with roller.');
  const [evidenceSimQualityFail, setEvidenceSimQualityFail] = useState(false);
  const [evidenceSimLocMismatch, setEvidenceSimLocMismatch] = useState(false);
  const [evidenceSimPartial, setEvidenceSimPartial] = useState(false);
  const [evidenceSimIssueStillPresent, setEvidenceSimIssueStillPresent] = useState(false);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceResult, setEvidenceResult] = useState<any>(null);

  const runEvidenceDiagnostic = async () => {
    setEvidenceLoading(true);
    const start = Date.now();
    addLog('info', 'EVIDENCE_AI', `Executing ${evidenceMode.toUpperCase()} evidence diagnostic...`);
    try {
      const res = await fetch('/api/dev/evidence-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: evidenceMode,
          beforeInput: {
            title: evidenceTitle,
            description: evidenceDesc,
            category: evidenceCategory,
            mediaUrl: evidenceBeforeUrl,
            isSimulatedQualityFail: evidenceSimQualityFail,
          },
          afterInput: {
            title: evidenceTitle,
            description: evidenceDesc,
            category: evidenceCategory,
            beforeMediaUrl: evidenceBeforeUrl,
            afterMediaUrl: evidenceAfterUrl,
            resolutionNotes: evidenceNotes,
            isSimulatedLocationMismatch: evidenceSimLocMismatch,
            isSimulatedPartialRepair: evidenceSimPartial,
            isSimulatedIssueStillPresent: evidenceSimIssueStillPresent,
          },
        }),
      });
      const data = await res.json();
      const dur = Date.now() - start;
      if (data.success && data.data) {
        setEvidenceResult(data.data);
        const status = data.data.evidence_status || data.data.resolution_status;
        addLog('success', 'EVIDENCE_AI', `Evaluation complete in ${dur}ms -> Status: [${status}] (Confidence: ${data.data.confidence})`);
      } else {
        throw new Error(data.error || 'Evaluation failed');
      }
    } catch (err: any) {
      addLog('error', 'EVIDENCE_AI', `Evaluation error: ${err?.message || err}`);
    } finally {
      setEvidenceLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // State Machine Visualizer State
  // ---------------------------------------------------------------------------
  const [currentState, setCurrentState] = useState<VoiceState>(VoiceState.WELCOME);
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'ta'>('ta');

  // Add Log Helper
  const addLog = (level: LogEntry['level'], tag: string, message: string, data?: any) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      tag,
      message,
      data,
    };
    setLogs((prev) => [entry, ...prev.slice(0, 99)]);
  };

  // Fetch Health Diagnostics
  const fetchHealth = async () => {
    setHealthLoading(true);
    addLog('info', 'HEALTH', 'Probing backend subsystem health endpoints...');
    try {
      const res = await fetch('/api/dev/health');
      const data = await res.json();
      setHealthData(data);
      if (data.success) {
        addLog('success', 'HEALTH', `Subsystem probe complete (${data.overallStatus}) in ${data.totalCheckDurationMs}ms`);
      } else {
        addLog('error', 'HEALTH', 'Health probe returned error', data);
      }
    } catch (err: any) {
      addLog('error', 'HEALTH', 'Failed to reach /api/dev/health', err);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // ---------------------------------------------------------------------------
  // Microphone Capture Handler
  // ---------------------------------------------------------------------------
  const startRecording = async () => {
    try {
      addLog('info', 'MIC', 'Requesting microphone permissions (navigator.mediaDevices)...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      setIsRecording(true);
      setRecordingDuration(0);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      addLog('info', 'MIC', `Microphone stream opened. Initializing MediaRecorder [${mimeType}]`);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        setAudioBlob(finalBlob);
        addLog('success', 'MIC', `Recording completed. Captured ${finalBlob.size} bytes of ${mimeType}`);
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setMicPermission('denied');
      setIsRecording(false);
      addLog('error', 'MIC', `Microphone permission or recording error: ${err.message || String(err)}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ---------------------------------------------------------------------------
  // Run Voice Assistant Pipeline
  // ---------------------------------------------------------------------------
  const runAssistantPipeline = async () => {
    setAssistantLoading(true);
    setAssistantStep(1);
    setTranscriptionResult(null);
    setAiInterpretationResult(null);
    setSubmissionResult(null);
    const pipelineStart = Date.now();
    let transcriptText = assistantText;
    let whisperDuration = 0;

    addLog('info', 'PIPELINE', `Starting Voice Assistant Pipeline in [${executionMode.toUpperCase()}] mode`);

    try {
      // Step 1 & 2: Audio Transcription (if using Mic)
      if (assistantInputMode === 'mic') {
        if (!audioBlob) {
          addLog('error', 'WHISPER', 'No recorded audio blob found. Please record audio first.');
          setAssistantLoading(false);
          return;
        }

        setAssistantStep(2);
        const whisperStart = Date.now();
        addLog('info', 'WHISPER', `Uploading ${audioBlob.size} bytes audio to /api/voice/transcribe...`);

        const formData = new FormData();
        formData.append('file', audioBlob, 'dev-voice-input.webm');
        formData.append('language', assistantLanguage);

        const transRes = await fetch('/api/voice/transcribe', {
          method: 'POST',
          body: formData,
        });
        const transJson = await transRes.json();
        whisperDuration = Date.now() - whisperStart;

        if (!transJson.success || !transJson.data?.text) {
          throw new Error(transJson.error || 'Whisper transcription failed');
        }

        transcriptText = transJson.data.text;
        setTranscriptionResult({
          text: transcriptText,
          language: transJson.data.language,
          isFallback: transJson.data.isFallback,
          durationMs: whisperDuration,
        });
        addLog('success', 'WHISPER', `Transcription complete in ${whisperDuration}ms: "${transcriptText}"`);
      } else {
        setTranscriptionResult({
          text: transcriptText,
          language: assistantLanguage,
          isSimulated: true,
          durationMs: 0,
        });
        addLog('info', 'TEXT_SIM', `Using simulated text input: "${transcriptText}"`);
      }

      // Step 3 & 4: Groq AI Natural Language Interpretation & Category Grounding
      setAssistantStep(3);
      const aiStart = Date.now();
      addLog('info', 'GROQ', `Calling /api/voice/interpret with transcript "${transcriptText.slice(0, 40)}..."`);

      const interpretRes = await fetch('/api/voice/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText,
          language: assistantLanguage,
          citizenName: assistantCitizenName,
        }),
      });
      const interpretJson = await interpretRes.json();
      const aiDuration = Date.now() - aiStart;

      if (!interpretJson.success || !interpretJson.data) {
        throw new Error(interpretJson.error || 'Groq AI interpretation failed');
      }

      setAiInterpretationResult({
        ...interpretJson.data,
        durationMs: aiDuration,
      });
      addLog('success', 'GROQ', `AI Interpretation complete in ${aiDuration}ms -> Category: [${interpretJson.data.categoryCode}] Priority: [${interpretJson.data.priority}]`);

      setAssistantStep(4); // Validation passed
      addLog('success', 'VALIDATION', `Grounded Category UUID: ${interpretJson.data.categoryId || 'Verified'} | Priority: ${interpretJson.data.priority}`);

      // Step 5 & 6: Optional Database Submission
      let dbDuration = 0;
      if (executionMode === 'submit') {
        if (!confirmSubmitCheck) {
          addLog('warn', 'SUBMISSION', 'Test Submission requested but confirmation checkbox was not checked. Halting at preview.');
        } else {
          setAssistantStep(5);
          const dbStart = Date.now();
          addLog('info', 'SUPABASE', 'Executing real test complaint creation via /api/voice/submit...');

          const submitRes = await fetch('/api/voice/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: interpretJson.data.title,
              description: interpretJson.data.description,
              category_id: interpretJson.data.categoryCode,
              department_id: interpretJson.data.departmentCode,
              priority: interpretJson.data.priority,
              citizen_name: assistantCitizenName,
              address: 'Developer Diagnostic Console Test Location, Chennai',
              ward_id: 114,
              district: 'Chennai',
              latitude: 13.0827,
              longitude: 80.2707,
            }),
          });
          const submitJson = await submitRes.json();
          dbDuration = Date.now() - dbStart;

          if (!submitJson.success) {
            throw new Error(submitJson.error || 'Database submission failed');
          }

          setSubmissionResult({
            tracking_id: submitJson.data?.tracking_id,
            complaint: submitJson.data?.complaint,
            durationMs: dbDuration,
          });
          setAssistantStep(6);
          addLog('success', 'SUPABASE', `Test complaint persisted! Generated Tracking ID: [${submitJson.data?.tracking_id}]`);
        }
      } else {
        addLog('info', 'ANALYZE_ONLY', 'Analyze Only mode active. Skipped Supabase mutation.');
      }

      setAssistantTimings({
        whisperMs: whisperDuration,
        aiMs: aiDuration,
        dbMs: dbDuration,
        totalMs: Date.now() - pipelineStart,
      });
    } catch (err: any) {
      addLog('error', 'PIPELINE', `Pipeline error: ${err.message || String(err)}`);
    } finally {
      setAssistantLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Run Voice Tracking Pipeline
  // ---------------------------------------------------------------------------
  const runTrackingPipeline = async () => {
    setTrackingLoading(true);
    setTrackingResult(null);
    addLog('info', 'TRACKING', `Running Tracking Diagnostic Query: "${trackingQuery}" (Citizen: ${trackingCitizenId || 'Anonymous'})`);

    try {
      const res = await fetch('/api/dev/track-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trackingQuery,
          citizenId: trackingCitizenId,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Tracking diagnostic failed');
      }

      setTrackingResult(data);
      addLog('success', 'TRACKING', `Tracking resolved: Outcome=[${data.pipeline?.outcome}] Candidates=${data.pipeline?.totalCandidatesFound} in ${data.timings?.totalMs}ms`);
    } catch (err: any) {
      addLog('error', 'TRACKING', `Tracking diagnostic error: ${err.message || String(err)}`);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Copy Debug Report
  const copyDebugReport = () => {
    const report = `# CivicConnect TN — Developer Diagnostic Report
Date: ${new Date().toISOString()}
Overall System Status: ${healthData?.overallStatus || 'UNKNOWN'}

## Subsystem Health
${Object.entries(healthData?.services || {})
  .map(([k, v]) => `- **${v.name}**: [${v.status}] ${v.details} (${v.latencyMs ?? 0}ms)`)
  .join('\n')}

## Last Voice Assistant Run
- Mode: ${executionMode}
- Input: "${assistantText}"
- Transcript: "${transcriptionResult?.text || 'N/A'}"
- AI Intent/Title: "${aiInterpretationResult?.title || 'N/A'}"
- Category Grounded: ${aiInterpretationResult?.categoryCode || 'N/A'} (Dept: ${aiInterpretationResult?.departmentCode || 'N/A'})
- Priority Grounded: ${aiInterpretationResult?.priority || 'N/A'}
- Safety Risk: ${aiInterpretationResult?.safetyRisk ? 'YES' : 'NO'}
- Tracking ID: ${submissionResult?.tracking_id || 'N/A (Analyze Only)'}
- Timing: Whisper: ${assistantTimings.whisperMs || 0}ms | Groq: ${assistantTimings.aiMs || 0}ms | DB: ${assistantTimings.dbMs || 0}ms | Total: ${assistantTimings.totalMs || 0}ms

## Last Voice Tracking Run
- Query: "${trackingQuery}"
- Regex Detected Code: ${trackingResult?.pipeline?.referenceExtraction?.normalizedCode || 'NONE'}
- AI Intent: ${trackingResult?.pipeline?.aiIntent?.intent || 'N/A'}
- Candidates Found: ${trackingResult?.pipeline?.totalCandidatesFound || 0}
- Outcome: ${trackingResult?.pipeline?.outcome || 'N/A'}
- Resolution En: "${trackingResult?.pipeline?.resolutionMessageEn || 'N/A'}"

## Recent Diagnostic Logs
${logs
  .slice(0, 15)
  .map((l) => `[${l.timestamp}] [${l.tag}] ${l.message}`)
  .join('\n')}
`;
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
    addLog('info', 'DEBUG', 'Copied comprehensive sanitized debug report to clipboard.');
  };

  // Audio Speech Preview Helper
  const playPromptTts = (text: string, lang: 'en' | 'ta') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      addLog('info', 'TTS', `Synthesized speech audio for prompt: "${text.slice(0, 30)}..."`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      {/* ------------------------------------------------------------------- */}
      {/* HEADER & TOP CONTROL BAR */}
      {/* ------------------------------------------------------------------- */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  CivicConnect TN <span className="text-emerald-400 font-mono text-sm uppercase px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 rounded">Dev Console</span>
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  DEVELOPMENT ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time backend & AI observability for Voice Assistant, Whisper, Groq LLaMA, Tracking & Supabase
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={copyDebugReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition"
            title="Copy sanitized markdown debug report"
          >
            {copiedReport ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedReport ? 'Copied Report!' : 'Copy Debug Report'}
          </button>

          <button
            onClick={fetchHealth}
            disabled={healthLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
            Refresh Health
          </button>

          <Link
            href="/citizen"
            target="_blank"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <span>Citizen App</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* ----------------------------------------------------------------- */}
        {/* TAB NAVIGATION BAR */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl max-w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'assistant'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Voice Assistant Pipeline
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'tracking'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Voice Tracking Pipeline
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'evidence'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Evidence AI & Before/After
          </button>

          <button
            onClick={() => setActiveTab('statemachine')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'statemachine'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            State Machine Debugger
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'health'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Subsystem Health Matrix
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* TAB 1: VOICE ASSISTANT DIAGNOSTIC PIPELINE */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Input Controls & Presets */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Input & Test Configuration
                  </h2>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setAssistantInputMode('text')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        assistantInputMode === 'text' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      Text Sim
                    </button>
                    <button
                      onClick={() => setAssistantInputMode('mic')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        assistantInputMode === 'mic' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      Real Mic
                    </button>
                  </div>
                </div>

                {/* Mode: Microphone */}
                {assistantInputMode === 'mic' ? (
                  <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Microphone State:</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono ${
                          isRecording
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                            : audioBlob
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isRecording ? `RECORDING (${recordingDuration}s)` : audioBlob ? `READY (${(audioBlob.size / 1024).toFixed(1)} KB)` : 'IDLE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-emerald-600/20 transition"
                        >
                          <Mic className="w-4 h-4" />
                          Start Recording
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-rose-600/20 animate-pulse transition"
                        >
                          <Square className="w-4 h-4" />
                          Stop Recording
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Mode: Text Simulation */
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-1.5">
                        Spoken Grievance Transcript (Simulated):
                      </label>
                      <textarea
                        rows={3}
                        value={assistantText}
                        onChange={(e) => setAssistantText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 font-mono"
                        placeholder="Type spoken Tamil, Tanglish, or English grievance..."
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                        Quick Simulation Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Tamil Water', text: 'Enga street la moonu naala thanni varala, romba kashtama irukku.' },
                          { label: 'Tanglish Pothole', text: 'Main road la periya pothole irukku, night la visible ah illa accident aaguthu.' },
                          { label: 'English Streetlight', text: 'Five street lights are not functioning on 4th Main Road, complete dark zone.' },
                          { label: 'Hazard Outage', text: 'Transformer sparking and high tension wire snapped near school entrance!' },
                          { label: 'Unclear Input', text: 'Something is wrong in our area please check.' },
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => setAssistantText(p.text)}
                            className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Target Language & Citizen Actor */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">Language Hint:</label>
                    <select
                      value={assistantLanguage}
                      onChange={(e: any) => setAssistantLanguage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="auto">Auto Detect (Tamil/En)</option>
                      <option value="ta">Tamil (தமிழ்)</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">Citizen Actor Name:</label>
                    <input
                      type="text"
                      value={assistantCitizenName}
                      onChange={(e) => setAssistantCitizenName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Execution Mode Selector */}
                <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5">
                  <span className="text-xs font-semibold text-slate-300 block">Execution Mode:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setExecutionMode('analyze');
                        setConfirmSubmitCheck(false);
                      }}
                      className={`p-2.5 rounded-lg text-xs font-semibold border text-left transition ${
                        executionMode === 'analyze'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold">ANALYZE ONLY</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Dry-run (No DB write)</div>
                    </button>

                    <button
                      onClick={() => setExecutionMode('submit')}
                      className={`p-2.5 rounded-lg text-xs font-semibold border text-left transition ${
                        executionMode === 'submit'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold">TEST SUBMISSION</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Creates test DB record</div>
                    </button>
                  </div>

                  {executionMode === 'submit' && (
                    <label className="flex items-start gap-2 pt-1 text-[11px] text-amber-300/90 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmSubmitCheck}
                        onChange={(e) => setConfirmSubmitCheck(e.target.checked)}
                        className="mt-0.5 rounded accent-amber-500"
                      />
                      <span>I confirm creating a real test complaint tagged with test metadata.</span>
                    </label>
                  )}
                </div>

                {/* Run Pipeline Button */}
                <button
                  onClick={runAssistantPipeline}
                  disabled={assistantLoading || (assistantInputMode === 'mic' && !audioBlob && !isRecording)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition"
                >
                  <Play className={`w-4 h-4 ${assistantLoading ? 'animate-spin' : ''}`} />
                  {assistantLoading ? 'Executing Diagnostic Pipeline...' : 'Run Voice Assistant Pipeline'}
                </button>
              </div>
            </div>

            {/* Right Column: Step-by-Step Observable Pipeline */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Observable Pipeline Telemetry
                  </h2>
                  {assistantTimings.totalMs ? (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                      Total: {assistantTimings.totalMs} ms
                    </span>
                  ) : null}
                </div>

                {/* Pipeline Stage Steps */}
                <div className="space-y-3">
                  {/* Stage 1: Audio / Input Capture */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">1</span>
                        Input / Audio Capture
                      </span>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${assistantStep >= 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {assistantStep >= 1 ? '✓ CAPTURED' : 'PENDING'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 pl-7">
                      Mode: <span className="text-slate-200">{assistantInputMode.toUpperCase()}</span> | Language: <span className="text-slate-200">{assistantLanguage}</span>
                    </p>
                  </div>

                  {/* Stage 2: Whisper Speech-to-Text */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">2</span>
                        Whisper Transcription (Groq whisper-large-v3)
                      </span>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${transcriptionResult ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {transcriptionResult ? `✓ ${transcriptionResult.durationMs}ms` : 'WAITING'}
                      </span>
                    </div>
                    {transcriptionResult ? (
                      <div className="pl-7 space-y-1">
                        <div className="text-xs text-slate-200 font-mono bg-slate-900/90 p-2.5 rounded border border-slate-800">
                          &quot;{transcriptionResult.text}&quot;
                        </div>
                        {transcriptionResult.isFallback && (
                          <span className="text-[10px] text-amber-400 font-mono">⚠ Whisper fallback transcript active</span>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Stage 3: Groq AI Natural Language Understanding */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">3</span>
                        Groq AI Structured Extraction (LLaMA 3.3)
                      </span>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${aiInterpretationResult ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {aiInterpretationResult ? `✓ ${aiInterpretationResult.durationMs}ms` : 'WAITING'}
                      </span>
                    </div>
                    {aiInterpretationResult ? (
                      <div className="pl-7 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded border border-slate-800">
                          <div>
                            <span className="text-slate-500 text-[10px] block">Title:</span>
                            <span className="text-slate-200 font-semibold">{aiInterpretationResult.title}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Priority & Safety:</span>
                            <span className="text-emerald-400 font-mono font-bold uppercase">{aiInterpretationResult.priority}</span>
                            {aiInterpretationResult.safetyRisk && (
                              <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] rounded font-mono">HAZARD</span>
                            )}
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 text-[10px] block">Tamil Summary Confirmation:</span>
                            <span className="text-emerald-300 font-medium">{aiInterpretationResult.tamilSummary}</span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Stage 4: Database Grounding & Validation */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">4</span>
                        Category & Priority Schema Grounding
                      </span>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${assistantStep >= 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {assistantStep >= 4 ? '✓ GROUNDED' : 'WAITING'}
                      </span>
                    </div>
                    {aiInterpretationResult ? (
                      <div className="pl-7 font-mono text-[11px] text-slate-400">
                        Category Code: <span className="text-emerald-400">{aiInterpretationResult.categoryCode}</span> | Dept:{' '}
                        <span className="text-emerald-400">{aiInterpretationResult.departmentCode}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Stage 5: Database Persistence Result */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">5</span>
                        Database Persistence (Supabase)
                      </span>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                          submissionResult
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : executionMode === 'analyze' && assistantStep >= 4
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {submissionResult ? `✓ ${submissionResult.durationMs}ms` : executionMode === 'analyze' && assistantStep >= 4 ? 'SKIPPED (DRY-RUN)' : 'WAITING'}
                      </span>
                    </div>
                    {submissionResult ? (
                      <div className="pl-7 bg-emerald-950/40 p-2.5 rounded border border-emerald-800/60 font-mono text-xs text-emerald-300">
                        Tracking Code: <span className="font-bold text-white">{submissionResult.tracking_id}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 2: VOICE TRACKING DIAGNOSTIC PIPELINE */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'tracking' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Tracking Input & Presets */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-400" />
                    Tracking Query Input
                  </h2>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">
                    Spoken Query, Reference Code, or Issue Keywords:
                  </label>
                  <input
                    type="text"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 font-mono"
                    placeholder="e.g. 'CC 2026 10482' or 'My water complaint in T Nagar'"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">
                    Authenticated Citizen ID (for RBAC Ownership Check):
                  </label>
                  <input
                    type="text"
                    value={trackingCitizenId}
                    onChange={(e) => setTrackingCitizenId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 font-mono"
                    placeholder="Optional citizen profile UUID"
                  />
                </div>

                {/* Presets */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Tracking Test Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Spoken Code "CC 2026 10482"', text: 'CC 2026 10482' },
                      { label: 'Standard Code "CC-TN-2026-TEST-001"', text: 'CC-TN-2026-TEST-001' },
                      { label: 'Tamil Water Query', text: 'Ennudaiya thanni pugaar enna nilaimaiyail irukku?' },
                      { label: 'Tanglish Pothole', text: 'Road pothole complaint status enna aachu?' },
                      { label: 'Multiple Matches', text: 'Water supply complaints in Chennai' },
                      { label: 'Invalid Code', text: 'CC-9999-INVALID' },
                      { label: 'Non-Reference "Year 2026"', text: 'I have 2026 water problem in my house' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTrackingQuery(p.text)}
                        className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={runTrackingPipeline}
                  disabled={trackingLoading || !trackingQuery.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition"
                >
                  <Search className={`w-4 h-4 ${trackingLoading ? 'animate-spin' : ''}`} />
                  {trackingLoading ? 'Processing Tracking Diagnostic...' : 'Execute Tracking Diagnostics'}
                </button>
              </div>
            </div>

            {/* Right Column: Tracking Diagnostic Waterfall */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Tracking Resolution Telemetry
                  </h2>
                  {trackingResult?.timings?.totalMs ? (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                      Total: {trackingResult.timings.totalMs} ms
                    </span>
                  ) : null}
                </div>

                {trackingResult ? (
                  <div className="space-y-3">
                    {/* Stage 1: Reference Code Extraction */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">1. Reference Code Regex & Normalization</span>
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                            trackingResult.pipeline.referenceExtraction.detected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {trackingResult.pipeline.referenceExtraction.detected ? 'CODE DETECTED' : 'NO CODE IN QUERY'}
                        </span>
                      </div>
                      {trackingResult.pipeline.referenceExtraction.detected ? (
                        <div className="font-mono text-xs text-slate-300">
                          Raw: <span className="text-slate-400">{trackingResult.pipeline.referenceExtraction.rawMatch}</span> → Normalized:{' '}
                          <span className="text-emerald-400 font-bold">{trackingResult.pipeline.referenceExtraction.normalizedCode}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Stage 2: AI Intent & Entities */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">2. Groq AI Intent & Entities</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          {trackingResult.pipeline.aiIntent.intent}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-slate-400">
                        Category: <span className="text-slate-200">{trackingResult.pipeline.aiIntent.categoryKeyword || 'All'}</span> | Location:{' '}
                        <span className="text-slate-200">{trackingResult.pipeline.aiIntent.locationKeyword || 'All'}</span>
                      </div>
                    </div>

                    {/* Stage 3: Outcome & Candidates */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">3. Resolution & Authorization</span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            trackingResult.pipeline.outcome === 'MATCHED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : trackingResult.pipeline.outcome === 'MULTIPLE_MATCHES'
                              ? 'bg-amber-500/20 text-amber-400'
                              : trackingResult.pipeline.outcome === 'ACCESS_DENIED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {trackingResult.pipeline.outcome}
                        </span>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
                        <div className="text-slate-200 font-medium">{trackingResult.pipeline.resolutionMessageEn}</div>
                        <div className="text-emerald-400 font-medium">{trackingResult.pipeline.resolutionMessageTa}</div>
                      </div>

                      {/* Candidate List */}
                      {trackingResult.pipeline.candidates?.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[11px] text-slate-400 font-medium">Candidate Records ({trackingResult.pipeline.candidates.length}):</span>
                          {trackingResult.pipeline.candidates.map((cand: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-xs font-mono">
                              <div>
                                <span className="text-emerald-400 font-bold">{cand.tracking_id}</span>
                                <span className="text-slate-400 ml-2">{cand.title}</span>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{cand.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Execute a tracking diagnostic query to view the full pipeline breakdown.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB: EVIDENCE AI & BEFORE/AFTER VERIFICATION */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'evidence' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Input Controls & Presets */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Evidence Analysis Mode
                  </h2>
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setEvidenceMode('before')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        evidenceMode === 'before'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Before Evidence
                    </button>
                    <button
                      onClick={() => setEvidenceMode('after')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        evidenceMode === 'after'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      After vs Before
                    </button>
                  </div>
                </div>

                {/* Scenario Presets */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-2">
                    Standard Test Scenarios:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setEvidenceMode('before');
                        setEvidenceTitle('Large Road Pothole near Bus Stop');
                        setEvidenceDesc('Deep 2-foot pothole on main carriageway.');
                        setEvidenceCategory('Road Damage');
                        setEvidenceBeforeUrl('https://images.unsplash.com/photo-pothole-road-damage-sample-1.jpg');
                        setEvidenceSimQualityFail(false);
                      }}
                      className="text-[11px] p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
                    >
                      <span className="font-bold block text-emerald-400">A. Valid Pothole</span>
                      <span>Consistent Before</span>
                    </button>

                    <button
                      onClick={() => {
                        setEvidenceMode('before');
                        setEvidenceTitle('Drinking Water Contamination');
                        setEvidenceDesc('Tap water is yellow with foul smell.');
                        setEvidenceCategory('Water Supply');
                        setEvidenceBeforeUrl('https://images.unsplash.com/photo-pothole-road-damage-sample-1.jpg');
                        setEvidenceSimQualityFail(false);
                      }}
                      className="text-[11px] p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
                    >
                      <span className="font-bold block text-amber-400">B. Wrong Image</span>
                      <span>Water with Pothole Photo</span>
                    </button>

                    <button
                      onClick={() => {
                        setEvidenceMode('before');
                        setEvidenceTitle('Blocked Storm Drain');
                        setEvidenceDesc('Underground drain clogged with debris.');
                        setEvidenceCategory('Drainage');
                        setEvidenceBeforeUrl('https://images.unsplash.com/photo-dark-blurred.jpg');
                        setEvidenceSimQualityFail(true);
                      }}
                      className="text-[11px] p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
                    >
                      <span className="font-bold block text-rose-400">C. Unclear Image</span>
                      <span>Dark/Blurred photo</span>
                    </button>

                    <button
                      onClick={() => {
                        setEvidenceMode('after');
                        setEvidenceTitle('Large Road Pothole near Bus Stop');
                        setEvidenceDesc('Deep 2-foot pothole on main carriageway.');
                        setEvidenceCategory('Road Damage');
                        setEvidenceBeforeUrl('https://images.unsplash.com/photo-pothole-road-damage-sample-1.jpg');
                        setEvidenceAfterUrl('https://images.unsplash.com/photo-repaired-asphalt-smooth-surface.jpg');
                        setEvidenceNotes('Asphalt macadam laid and compacted with vibratory roller.');
                        setEvidenceSimLocMismatch(false);
                        setEvidenceSimPartial(false);
                        setEvidenceSimIssueStillPresent(false);
                      }}
                      className="text-[11px] p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
                    >
                      <span className="font-bold block text-teal-400">D. Valid Repaired</span>
                      <span>Resolution Consistent</span>
                    </button>

                    <button
                      onClick={() => {
                        setEvidenceMode('after');
                        setEvidenceTitle('Large Road Pothole near Bus Stop');
                        setEvidenceDesc('Deep 2-foot pothole on main carriageway.');
                        setEvidenceCategory('Road Damage');
                        setEvidenceBeforeUrl('https://images.unsplash.com/photo-pothole-road-damage-sample-1.jpg');
                        setEvidenceAfterUrl('https://images.unsplash.com/photo-same-unrepaired-pothole.jpg');
                        setEvidenceNotes('Inspection complete.');
                        setEvidenceSimLocMismatch(false);
                        setEvidenceSimPartial(false);
                        setEvidenceSimIssueStillPresent(true);
                      }}
                      className="text-[11px] p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
                    >
                      <span className="font-bold block text-rose-400">E. Issue Still Present</span>
                      <span>Defect unrectified</span>
                    </button>

                    <button
                      onClick={() => {
                        setEvidenceMode('after');
                        setEvidenceTitle('Large Road Pothole near Bus Stop');
                        setEvidenceDesc('Deep 2-foot pothole on main carriageway.');
                        setEvidenceCategory('Road Damage');
                        setEvidenceBeforeUrl('https://images.unsplash.com/photo-pothole-road-damage-sample-1.jpg');
                        setEvidenceAfterUrl('https://images.unsplash.com/photo-different-location.jpg');
                        setEvidenceNotes('Patch work completed.');
                        setEvidenceSimLocMismatch(true);
                        setEvidenceSimPartial(false);
                        setEvidenceSimIssueStillPresent(false);
                      }}
                      className="text-[11px] p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300"
                    >
                      <span className="font-bold block text-purple-400">F. Location Mismatch</span>
                      <span>GPS &gt;2km discrepancy</span>
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Complaint Title
                    </label>
                    <input
                      type="text"
                      value={evidenceTitle}
                      onChange={(e) => setEvidenceTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Complaint Description
                    </label>
                    <textarea
                      rows={2}
                      value={evidenceDesc}
                      onChange={(e) => setEvidenceDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Before Photo URL
                    </label>
                    <input
                      type="text"
                      value={evidenceBeforeUrl}
                      onChange={(e) => setEvidenceBeforeUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300"
                    />
                  </div>

                  {evidenceMode === 'after' && (
                    <>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          After Resolution Photo URL
                        </label>
                        <input
                          type="text"
                          value={evidenceAfterUrl}
                          onChange={(e) => setEvidenceAfterUrl(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Field Work Notes
                        </label>
                        <textarea
                          rows={2}
                          value={evidenceNotes}
                          onChange={(e) => setEvidenceNotes(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={runEvidenceDiagnostic}
                  disabled={evidenceLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition"
                >
                  <Sparkles className={`w-4 h-4 ${evidenceLoading ? 'animate-spin' : ''}`} />
                  {evidenceLoading ? 'Analyzing Evidence via Groq...' : `Run ${evidenceMode === 'before' ? 'Before' : 'After'} AI Assessment`}
                </button>
              </div>
            </div>

            {/* Right Column: Evidence Telemetry Breakdown */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    AI Evidence Telemetry & Validation
                  </h2>
                  {evidenceResult?.confidence && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                      Confidence: {(evidenceResult.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {evidenceResult ? (
                  <div className="space-y-4">
                    {/* Status Banner */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Evaluated Outcome
                        </span>
                        <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                          {evidenceResult.evidence_status || evidenceResult.resolution_status}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded font-semibold ${
                          evidenceResult.needs_human_review
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {evidenceResult.needs_human_review ? 'Needs Human Review' : 'Auto-Verified'}
                      </span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                        <span className="text-slate-400 block text-[10px]">Location Consistency</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">
                          {evidenceResult.location_consistency || 'SUPPORTED'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                        <span className="text-slate-400 block text-[10px]">Visual Improvement</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">
                          {evidenceResult.visual_improvement || evidenceResult.visual_quality || 'CLEAR'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                        <span className="text-slate-400 block text-[10px]">Media Fingerprint</span>
                        <span className="font-mono text-emerald-400 mt-0.5 block text-[11px]">
                          {evidenceResult.media_hash}
                        </span>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                      <span className="font-bold text-slate-300">Technical Reason:</span>
                      <p className="text-slate-400 leading-relaxed">{evidenceResult.reason}</p>
                    </div>

                    {/* Officer / Citizen Message */}
                    {evidenceResult.officer_summary && (
                      <div className="p-3.5 bg-teal-950/30 rounded-xl border border-teal-800/40 space-y-1 text-xs">
                        <span className="font-bold text-teal-300">Officer Action Recommendation:</span>
                        <p className="text-slate-300">{evidenceResult.officer_summary}</p>
                      </div>
                    )}

                    {evidenceResult.citizen_message_en && (
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                        <span className="font-bold text-slate-300">Citizen Friendly Feedback (English):</span>
                        <p className="text-emerald-400">{evidenceResult.citizen_message_en}</p>
                        {evidenceResult.citizen_message_ta && (
                          <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                            தமிழ்: {evidenceResult.citizen_message_ta}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    Select a test scenario and run the Evidence Assessment above.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB: CONVERSATIONAL STATE MACHINE VISUALIZER */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'statemachine' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Voice Assistant 10-State Conversational State Machine
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactive state transition visualizer with live bilingual speech synthesis preview
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">TTS Language:</span>
                <select
                  value={previewLanguage}
                  onChange={(e: any) => setPreviewLanguage(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                >
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* State Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.values(VoiceState).map((st, idx) => {
                const isActive = currentState === st;
                const prompt = STATE_PROMPTS[st];
                const promptText = previewLanguage === 'ta' ? prompt?.ta : prompt?.en;

                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentState(st)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isActive
                        ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                        {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                      </div>
                      <h3 className={`text-xs font-bold font-mono ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>{st}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-sans">{promptText || 'No prompt'}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (promptText) playPromptTts(promptText, previewLanguage);
                        }}
                        className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300"
                      >
                        <Volume2 className="w-3 h-3" />
                        Play Audio
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 4: SUBSYSTEM HEALTH MATRIX */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'health' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Backend Subsystem Health Matrix
              </h2>
              <span className="text-xs text-slate-400 font-mono">Status: {healthData?.overallStatus || 'UNKNOWN'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(healthData?.services || {}).map(([key, s]) => (
                <div key={key} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{s.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          s.status === 'READY'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : s.status === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : s.status === 'ERROR'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{s.details}</p>
                  </div>
                  {s.latencyMs !== undefined && (
                    <span className="text-xs font-mono text-slate-500 shrink-0">{s.latencyMs} ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* LIVE CHRONOLOGICAL DEVELOPER LOGS */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Chronological Developer Execution Logs ({logs.length})
            </h3>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear Logs
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
            {logs.length > 0 ? (
              logs.map((l) => (
                <div key={l.id} className="flex items-start gap-2 py-0.5">
                  <span className="text-slate-500 shrink-0">[{l.timestamp}]</span>
                  <span
                    className={`font-bold shrink-0 ${
                      l.level === 'error'
                        ? 'text-rose-400'
                        : l.level === 'warn'
                        ? 'text-amber-400'
                        : l.level === 'success'
                        ? 'text-emerald-400'
                        : 'text-blue-400'
                    }`}
                  >
                    [{l.tag}]
                  </span>
                  <span className="text-slate-300">{l.message}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-600 text-[11px] py-4 text-center">No logs generated yet. Run a diagnostic test above.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
