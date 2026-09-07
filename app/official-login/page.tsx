'use client';

// =============================================================================
// CivicConnect TN — Official Government Portal Login Gateway (/official-login)
// =============================================================================
// High-security restricted gateway for Tamil Nadu State Government Officials.
// Gated by the 4-digit authorization passcode: 1927.
// Categorizes all administrative tiers: Field Worker, Area Officer, Dept Head,
// City Commissioner, District Collector, Dept Secretary, Chief Secretary, CM Cell, Admin.

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/enums';
import { ROLE_LABELS, getRoleHomePath } from '@/config/roles';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  Building,
  CheckCircle2,
  Users,
  Compass,
  Briefcase,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Crown,
  Search,
} from 'lucide-react';

interface OfficialRoleMeta {
  role: UserRole;
  title: string;
  name: string;
  cadre: string;
  jurisdiction: string;
  email: string;
  tier: 'field' | 'urban' | 'state' | 'system';
  badgeColor: string;
  avatarBg: string;
  icon: typeof Building;
}

const OFFICIAL_DIRECTORY: OfficialRoleMeta[] = [
  // Tier 1: Field & Ward Operations
  {
    role: UserRole.FIELD_WORKER,
    title: 'Field Worker (Ward Gang)',
    name: 'Murugan K',
    cadre: 'Ward Maintenance Staff',
    jurisdiction: 'Ward 114, Chennai',
    email: 'worker.murugan@tn.gov.in',
    tier: 'field',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    avatarBg: 'from-amber-600 to-orange-600',
    icon: Briefcase,
  },
  {
    role: UserRole.AREA_OFFICER,
    title: 'Area Officer (Assistant Engineer)',
    name: 'Anand Kumar, AE',
    cadre: 'Greater Chennai Corporation',
    jurisdiction: 'Ward 114, Zone 9, Chennai',
    email: 'ae.ward114@chennaicorp.gov.in',
    tier: 'field',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    avatarBg: 'from-emerald-600 to-teal-600',
    icon: Compass,
  },
  // Tier 2: Department & Urban Administration
  {
    role: UserRole.DEPARTMENT_HEAD,
    title: 'Department Head (Executive Engineer)',
    name: 'Rajendran P, EE',
    cadre: 'Roads & Bridges Department',
    jurisdiction: 'Greater Chennai Corporation',
    email: 'ee.roads@chennaicorp.gov.in',
    tier: 'urban',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    avatarBg: 'from-blue-600 to-cyan-600',
    icon: Building,
  },
  {
    role: UserRole.CITY_COMMISSIONER,
    title: 'City Commissioner (IAS)',
    name: 'Dr. J. Radhakrishnan, IAS',
    cadre: 'Municipal Commissioner',
    jurisdiction: 'Greater Chennai Corporation (GCC)',
    email: 'commissioner@chennaicorp.gov.in',
    tier: 'urban',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    avatarBg: 'from-indigo-600 to-blue-700',
    icon: Layers,
  },
  // Tier 3: District & Secretariat Governance
  {
    role: UserRole.DISTRICT_COLLECTOR,
    title: 'District Collector (IAS)',
    name: 'Rashmi Siddharth, IAS',
    cadre: 'District Magistrate & Collector',
    jurisdiction: 'Chennai District Administration',
    email: 'collector.cni@tn.gov.in',
    tier: 'state',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    avatarBg: 'from-violet-600 to-purple-700',
    icon: Building,
  },
  {
    role: UserRole.DEPARTMENT_SECRETARY,
    title: 'Department Secretary (MAWS)',
    name: 'D. Karthikeyan, IAS',
    cadre: 'Principal Secretary to Government',
    jurisdiction: 'Municipal Admin & Water Supply Dept',
    email: 'sec.maws@tn.gov.in',
    tier: 'state',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    avatarBg: 'from-fuchsia-600 to-pink-700',
    icon: Layers,
  },
  {
    role: UserRole.CHIEF_SECRETARY,
    title: 'Chief Secretary (IAS)',
    name: 'Shiv Das Meena, IAS',
    cadre: 'Head of State Civil Services',
    jurisdiction: 'Government of Tamil Nadu',
    email: 'cs@tn.gov.in',
    tier: 'state',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    avatarBg: 'from-amber-600 to-yellow-600',
    icon: Crown,
  },
  {
    role: UserRole.CHIEF_MINISTER,
    title: 'Hon. Chief Minister Office',
    name: 'CM Special Cell / Monitoring Unit',
    cadre: 'State Executive Leadership',
    jurisdiction: 'Statewide Tamil Nadu',
    email: 'cmcell@tn.gov.in',
    tier: 'state',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    avatarBg: 'from-rose-600 to-red-700',
    icon: Crown,
  },
  // Tier 4: System Administration
  {
    role: UserRole.ADMIN,
    title: 'System Administrator',
    name: 'CivicConnect TN Administrator',
    cadre: 'State e-Governance Security Admin',
    jurisdiction: 'State Data Center (TNeGA)',
    email: 'admin@civicconnect.tn.gov.in',
    tier: 'system',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    avatarBg: 'from-slate-700 to-slate-900',
    icon: ShieldCheck,
  },
];

import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function OfficialPortalLoginPage() {
  const router = useRouter();
  const { devLogin, isLoading, user } = useAuth();

  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | 'field' | 'urban' | 'state' | 'system'>('all');

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus passcode input on load
  useEffect(() => {
    if (!isUnlocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isUnlocked]);

  const handleVerifyPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasscodeError(null);

    if (passcode.trim() === '1927') {
      setIsUnlocked(true);
      setPasscodeError(null);
    } else {
      setPasscodeError('Access Denied: Invalid Security Passcode. Authorization code required.');
      setPasscode('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleOfficerLogin = async (role: UserRole) => {
    setActionLoading(role);
    setPasscodeError(null);
    try {
      // Pass the verified secretCode '1927' to the backend auth provider
      await devLogin(role, '1927');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Official authentication failed';
      setPasscodeError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOfficers = OFFICIAL_DIRECTORY.filter((officer) => {
    const matchesTier = selectedTier === 'all' || officer.tier === selectedTier;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      officer.name.toLowerCase().includes(q) ||
      officer.title.toLowerCase().includes(q) ||
      officer.jurisdiction.toLowerCase().includes(q) ||
      officer.email.toLowerCase().includes(q);

    return matchesTier && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-950/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-emerald-400 text-sm">
              TN
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                தமிழ்நாடு அரசு • Government of Tamil Nadu
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                Official Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              State Administration, District Governance & Field Engineering Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle size="sm" />
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Citizen Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Gateway Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        {!isUnlocked ? (
          /* ========================================================================= */
          /* STAGE 1: CHALLENGE PASSCODE AUTHENTICATION GATE */
          /* ========================================================================= */
          <div className="max-w-md w-full mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80 space-y-6 text-center">
              {/* Shield Icon Lock Emblem */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600/30 to-emerald-600/30 border border-amber-500/40 p-1 shadow-2xl shadow-amber-950/40 mx-auto">
                <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center text-amber-400">
                  <Lock className="w-9 h-9" />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800/60 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Restricted Department Access
                </span>
                <h1 className="text-2xl font-black text-white mt-3">
                  Government Authorization Gateway
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Enter the 4-digit State Administration authorization security passcode to unlock departmental officer logins.
                </p>
              </div>

              {/* Error Message */}
              {passcodeError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 text-left animate-in shake">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{passcodeError}</span>
                </div>
              )}

              {/* Passcode Form */}
              <form onSubmit={handleVerifyPasscode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Security Authorization Code:
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="password"
                      maxLength={8}
                      placeholder="••••"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full text-center tracking-[0.5em] text-2xl font-black bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-2xl py-3 text-amber-300 placeholder:text-slate-700 outline-none transition-all shadow-inner font-mono"
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="unlock-official-btn"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Verify Passcode & Enter</span>
                </button>
              </form>

              {/* Keypad Quick Helper */}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center gap-2">
                <Lock className="w-3 h-3 text-amber-400/70" />
                <span>Protected by Department Security Policy (Passcode: 1927)</span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STAGE 2: UNLOCKED OFFICIAL DIRECTORY & ONE-CLICK LOGIN */
          /* ========================================================================= */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Unlock Status Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/85 border border-emerald-500/40 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Official State Department Directory
                    </h2>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Session Authorized
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Select an official designation below to access your executive governance dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsUnlocked(false);
                    setPasscode('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lock Gateway</span>
                </button>
              </div>
            </div>

            {/* Error Notification if any */}
            {passcodeError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {[
                  { id: 'all', label: 'All Roles (9)' },
                  { id: 'field', label: 'Ward & Field' },
                  { id: 'urban', label: 'Corporation & City' },
                  { id: 'state', label: 'Secretariat & State' },
                  { id: 'system', label: 'System Admin' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTier(tier.id as typeof selectedTier)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedTier === tier.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, cadre, ward..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Officer Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOfficers.map((officer) => {
                const Icon = officer.icon;
                const isCurrentAction = actionLoading === officer.role;

                return (
                  <div
                    key={officer.role}
                    className="p-5 rounded-3xl bg-slate-900/75 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-4 shadow-lg group relative overflow-hidden"
                  >
                    {/* Top Tier Tag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${officer.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform shrink-0`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {officer.name}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {officer.cadre}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Meta Details */}
                    <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Designation:</span>
                        <span className="font-semibold text-white">{officer.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Jurisdiction:</span>
                        <span className="font-medium text-emerald-400">{officer.jurisdiction}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Gov Email:</span>
                        <span className="font-mono text-[10px] text-slate-400">{officer.email}</span>
                      </div>
                    </div>

                    {/* 1-Click Login Button */}
                    <button
                      type="button"
                      id={`officer-login-btn-${officer.role}`}
                      onClick={() => handleOfficerLogin(officer.role)}
                      disabled={isLoading || !!actionLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      {isCurrentAction ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Enter as {officer.title.split('(')[0].trim()}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer Notice */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 text-center text-[11px] text-slate-500">
        Tamil Nadu State e-Governance Agency (TNeGA) • Information Technology & Digital Services Department
      </footer>
    </div>
  );
}
