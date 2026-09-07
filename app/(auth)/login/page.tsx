'use client';

// =============================================================================
// CivicConnect TN — Citizen Authentication Portal (/login)
// =============================================================================
// Exclusively for Citizens of Tamil Nadu.
// Provides Google Sign-In, Instant Demo Citizen access, and Voice-first support.
// Government / Official access is separated into a dedicated passcode-gated portal.

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/enums';
import {
  Shield,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  Mic,
  AlertCircle,
  Building2,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function CitizenLoginPage() {
  const { loginWithGoogle, devLogin, isLoading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setActionLoading('google');
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCitizenDemoLogin = async () => {
    setError(null);
    setActionLoading('citizen');
    try {
      await devLogin(UserRole.CITIZEN);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Citizen login failed';
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/50 relative overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors">
      {/* Ambient decorative glow elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 right-1/3 w-80 h-80 bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />

      {/* Floating Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle size="sm" />
      </div>

      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/85 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-300/40 dark:shadow-slate-950/80 relative z-10 space-y-6 transition-colors">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-1">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                TN
              </span>
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60">
              <Shield className="w-3 h-3 text-emerald-400" />
              Government of Tamil Nadu
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Citizen Grievance Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            பொது மக்கள் குறைதீர்க்கும் தளம் • Report issues, track resolutions & engage with your ward.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Citizen Login Actions */}
        <div className="space-y-4">
          {/* Primary: Google Sign-In */}
          <button
            type="button"
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading || !!actionLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-lg shadow-black/30 active:scale-[0.99] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed group"
          >
            {actionLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Instant Citizen Demo
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* 1-Click Instant Demo Citizen Login */}
          <button
            type="button"
            id="demo-citizen-btn"
            onClick={handleCitizenDemoLogin}
            disabled={isLoading || !!actionLoading}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 hover:from-emerald-900/90 hover:to-teal-900/90 border border-emerald-700/60 hover:border-emerald-500 text-emerald-100 font-medium text-sm transition-all shadow-xl shadow-emerald-950/40 active:scale-[0.99] disabled:opacity-60 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span>Login as Demo Citizen</span>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Instant ⚡
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-0.5">
                  Priya Sundaram • Ward 114, Chennai
                </div>
              </div>
            </div>
            <div className="text-emerald-400 group-hover:translate-x-1 transition-transform">
              {actionLoading === 'citizen' ? (
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </div>
          </button>
        </div>

        {/* Citizen Quick Features Highlight */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Mandatory Login for Quick Filing:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <Link
              href="/submit-issue"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Voice Report</span>
            </Link>
            <Link
              href="/track"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Track Grievance</span>
            </Link>
          </div>
        </div>

        {/* Existing Session status */}
        {user && (
          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Logged in as <span className="text-emerald-400 font-medium">{user.display_name}</span>
            </p>
          </div>
        )}

        {/* Subtle Government Official Gateway Footer Link */}
        <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
          <Link
            href="/official-login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors font-medium py-1 px-3 rounded-lg hover:bg-slate-800/50"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Government & Department Official Portal Access →</span>
          </Link>
          <p className="text-[10px] text-slate-600">
            Secure Government of Tamil Nadu e-Governance Network
          </p>
        </div>
      </div>
    </div>
  );
}
