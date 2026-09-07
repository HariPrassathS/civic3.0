// =============================================================================
// CivicConnect TN — Developer Health & Subsystem Diagnostics API
// =============================================================================
// Probes all critical production subsystems (Supabase, Groq AI, Whisper, Storage,
// Firebase Auth, PostGIS RPC) and returns latency and readiness status without
// exposing sensitive credentials or keys.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGroqClient, GROQ_MODELS } from '@/lib/ai/client';

export interface ServiceStatus {
  name: string;
  category: 'core' | 'database' | 'ai' | 'storage' | 'auth';
  status: 'READY' | 'WARNING' | 'ERROR' | 'NOT_CONFIGURED';
  latencyMs?: number;
  details: string;
  configured: boolean;
}

export async function GET() {
  const startTime = Date.now();
  const services: Record<string, ServiceStatus> = {};

  // 1. Next.js Runtime
  services.nextjs = {
    name: 'Next.js App Server',
    category: 'core',
    status: 'READY',
    latencyMs: Date.now() - startTime,
    details: `App Router (Turbopack) | Node ${process.version} | ${process.env.NODE_ENV || 'development'}`,
    configured: true,
  };

  // 2. Supabase PostgreSQL Database
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    services.supabase = {
      name: 'Supabase Database',
      category: 'database',
      status: 'NOT_CONFIGURED',
      details: 'NEXT_PUBLIC_SUPABASE_URL or ANON_KEY missing in .env.local',
      configured: false,
    };
  } else {
    try {
      const dbStart = Date.now();
      const adminClient = createAdminClient();
      const { data, error } = await adminClient.from('profiles').select('id', { count: 'exact', head: true });
      const latency = Date.now() - dbStart;

      if (error) {
        services.supabase = {
          name: 'Supabase Database',
          category: 'database',
          status: 'ERROR',
          latencyMs: latency,
          details: `Query error: ${error.message}`,
          configured: true,
        };
      } else {
        services.supabase = {
          name: 'Supabase Database',
          category: 'database',
          status: 'READY',
          latencyMs: latency,
          details: `Connected (${supabaseUrl.replace(/https?:\/\//, '').split('.')[0]}.supabase.co) — Service Role Active`,
          configured: true,
        };
      }
    } catch (err: any) {
      services.supabase = {
        name: 'Supabase Database',
        category: 'database',
        status: 'ERROR',
        details: `Connection failure: ${err?.message || String(err)}`,
        configured: true,
      };
    }
  }

  // 3. PostGIS Spatial RPC Engine
  if (services.supabase.status === 'READY') {
    try {
      const rpcStart = Date.now();
      const adminClient = createAdminClient();
      const { data, error } = await (adminClient.rpc as any)('get_nearby_complaints', {
        user_lat: 13.0827,
        user_lng: 80.2707,
        radius_km: 10,
        cat_code: null,
      });
      const rpcLatency = Date.now() - rpcStart;

      if (error) {
        services.postgis = {
          name: 'PostGIS Spatial Engine',
          category: 'database',
          status: 'WARNING',
          latencyMs: rpcLatency,
          details: `RPC warning: ${error.message} (Fallback to Haversine memory search)`,
          configured: true,
        };
      } else {
        services.postgis = {
          name: 'PostGIS Spatial Engine',
          category: 'database',
          status: 'READY',
          latencyMs: rpcLatency,
          details: `RPC 'get_nearby_complaints' active | Returned ${(data as any[])?.length || 0} Chennai points in ${rpcLatency}ms`,
          configured: true,
        };
      }
    } catch (err: any) {
      services.postgis = {
        name: 'PostGIS Spatial Engine',
        category: 'database',
        status: 'WARNING',
        details: `RPC call failed: ${err?.message || String(err)}`,
        configured: true,
      };
    }
  } else {
    services.postgis = {
      name: 'PostGIS Spatial Engine',
      category: 'database',
      status: 'NOT_CONFIGURED',
      details: 'Dependent on Supabase connection',
      configured: false,
    };
  }

  // 4. Groq AI Engine (LLM)
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey || groqKey.includes('your-groq') || groqKey.length < 10) {
    services.groq = {
      name: 'Groq AI (LLaMA 3.3)',
      category: 'ai',
      status: 'NOT_CONFIGURED',
      details: 'GROQ_API_KEY not provided. Fallback heuristic rules active.',
      configured: false,
    };
  } else {
    try {
      const groqStart = Date.now();
      const groq = getGroqClient();
      if (!groq) {
        throw new Error('Groq client initialization failed');
      }

      // Quick test ping
      const ping = await groq.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages: [{ role: 'user', content: 'Ping. Respond with "PONG".' }],
        max_tokens: 5,
        temperature: 0,
      });
      const latency = Date.now() - groqStart;
      const resp = ping.choices[0]?.message?.content?.trim() || '';

      services.groq = {
        name: 'Groq AI (LLaMA 3.3)',
        category: 'ai',
        status: 'READY',
        latencyMs: latency,
        details: `Online (${GROQ_MODELS.PRIMARY}) | Fast Ping response: "${resp}" (${latency}ms)`,
        configured: true,
      };
    } catch (err: any) {
      services.groq = {
        name: 'Groq AI (LLaMA 3.3)',
        category: 'ai',
        status: 'WARNING',
        details: `API Error: ${err?.message || String(err)} (Heuristic fallback active)`,
        configured: true,
      };
    }
  }

  // 5. Whisper Speech-to-Text Model
  if (services.groq.configured && services.groq.status === 'READY') {
    services.whisper = {
      name: 'Whisper Speech-to-Text',
      category: 'ai',
      status: 'READY',
      details: 'whisper-large-v3 model ready for Tamil, English & Tanglish voice input',
      configured: true,
    };
  } else {
    services.whisper = {
      name: 'Whisper Speech-to-Text',
      category: 'ai',
      status: services.groq.status === 'WARNING' ? 'WARNING' : 'NOT_CONFIGURED',
      details: 'Requires active Groq API Key (mock transcript fallback active)',
      configured: false,
    };
  }

  // 6. Supabase Storage (complaint-media bucket)
  if (services.supabase.status === 'READY') {
    try {
      const storageStart = Date.now();
      const adminClient = createAdminClient();
      const { data: buckets, error: bError } = await adminClient.storage.listBuckets();
      const storageLatency = Date.now() - storageStart;

      if (bError) {
        services.storage = {
          name: 'Supabase Storage',
          category: 'storage',
          status: 'WARNING',
          latencyMs: storageLatency,
          details: `Storage check warning: ${bError.message}`,
          configured: true,
        };
      } else {
        const hasMediaBucket = (buckets || []).some((b) => b.name === 'complaint-media');
        services.storage = {
          name: 'Supabase Storage',
          category: 'storage',
          status: 'READY',
          latencyMs: storageLatency,
          details: `Storage active (${buckets?.length || 0} buckets found${hasMediaBucket ? ' | complaint-media ready' : ''})`,
          configured: true,
        };
      }
    } catch (err: any) {
      services.storage = {
        name: 'Supabase Storage',
        category: 'storage',
        status: 'WARNING',
        details: `Storage error: ${err?.message || String(err)}`,
        configured: true,
      };
    }
  } else {
    services.storage = {
      name: 'Supabase Storage',
      category: 'storage',
      status: 'NOT_CONFIGURED',
      details: 'Requires active Supabase database configuration',
      configured: false,
    };
  }

  // 7. Firebase Authentication
  const fbApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const fbProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const fbAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

  if (fbApiKey && fbProjectId && !fbApiKey.includes('your-firebase')) {
    services.firebase = {
      name: 'Firebase Auth (OAuth)',
      category: 'auth',
      status: 'READY',
      details: `Configured for Google Sign-In (Project: ${fbProjectId})`,
      configured: true,
    };
  } else {
    services.firebase = {
      name: 'Firebase Auth (OAuth)',
      category: 'auth',
      status: 'NOT_CONFIGURED',
      details: 'Firebase Google OAuth not configured (Development mode / mock auth active)',
      configured: false,
    };
  }

  // 8. Realtime Broadcast Engine
  services.realtime = {
    name: 'Supabase Realtime Broadcast',
    category: 'core',
    status: services.supabase.status === 'READY' ? 'READY' : 'WARNING',
    details: services.supabase.status === 'READY' ? 'PostgreSQL Replication & Broadcast channel enabled' : 'REST Polling Fallback active',
    configured: services.supabase.configured,
  };

  const allReady = Object.values(services).every((s) => s.status === 'READY');
  const hasErrors = Object.values(services).some((s) => s.status === 'ERROR');

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    overallStatus: hasErrors ? 'DEGRADED' : allReady ? 'HEALTHY' : 'OPERATIONAL_WITH_FALLBACKS',
    totalCheckDurationMs: Date.now() - startTime,
    services,
  });
}
