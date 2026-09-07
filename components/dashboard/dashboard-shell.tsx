'use client';

// =============================================================================
// CivicConnect TN — Executive Dashboard Shell Component
// =============================================================================
// Responsive desktop & mobile layout with Tamil Nadu government header,
// role-based navigation sidebar, jurisdiction indicators, and quick profile controls.

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/types/enums';
import { ROLE_LABELS } from '@/config/roles';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Shield,
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  Users,
  Building2,
  SlidersHorizontal,
  LogOut,
  Menu,
  X,
  FileText,
  Clock,
  Compass,
  Briefcase,
  Layers,
  Award,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface DashboardShellProps {
  children: React.ReactNode;
  role: UserRole;
  title: string;
  subtitle: string;
  jurisdictionScope?: string;
  customNavItems?: NavItem[];
}

export function DashboardShell({
  children,
  role,
  title,
  subtitle,
  jurisdictionScope,
  customNavItems,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Default navigation items based on role
  const getNavItems = (): NavItem[] => {
    if (customNavItems && customNavItems.length > 0) return customNavItems;

    switch (role) {
      case UserRole.FIELD_WORKER:
        return [
          { label: 'My Assigned Work', href: '/dashboard/field-worker', icon: <Briefcase className="w-5 h-5" /> },
          { label: 'Work History', href: '/dashboard/field-worker?tab=history', icon: <CheckCircle2 className="w-5 h-5" /> },
        ];
      case UserRole.AREA_OFFICER:
        return [
          { label: 'Ward Overview', href: '/dashboard/area-officer', icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: 'Verification Queue', href: '/dashboard/area-officer?tab=verification', icon: <CheckCircle2 className="w-5 h-5" /> },
          { label: 'Task Assignment', href: '/dashboard/area-officer?tab=assign', icon: <ClipboardList className="w-5 h-5" /> },
          { label: 'Spatial GIS Map', href: '/map', icon: <Compass className="w-5 h-5" /> },
          { label: 'SLA Watch', href: '/dashboard/area-officer?tab=sla', icon: <Clock className="w-5 h-5" /> },
        ];
      case UserRole.DEPARTMENT_HEAD:
        return [
          { label: 'Department KPIs', href: '/dashboard/department-head', icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: 'Complaints Matrix', href: '/dashboard/department-head?tab=complaints', icon: <ClipboardList className="w-5 h-5" /> },
          { label: 'Spatial GIS Map', href: '/map', icon: <Compass className="w-5 h-5" /> },
          { label: 'Ward Performance', href: '/dashboard/department-head?tab=wards', icon: <Layers className="w-5 h-5" /> },
          { label: 'SLA Analytics', href: '/dashboard/department-head?tab=sla', icon: <Clock className="w-5 h-5" /> },
        ];
      case UserRole.CITY_COMMISSIONER:
        return [
          { label: 'City Overview', href: '/dashboard/commissioner', icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: 'Department Benchmark', href: '/dashboard/commissioner?tab=departments', icon: <Building2 className="w-5 h-5" /> },
          { label: 'Spatial GIS Map', href: '/map', icon: <Compass className="w-5 h-5" /> },
          { label: 'City Escalations', href: '/dashboard/commissioner?tab=escalations', icon: <Shield className="w-5 h-5" /> },
        ];
      case UserRole.DISTRICT_COLLECTOR:
        return [
          { label: 'District Overview', href: '/dashboard/district-collector', icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: 'Spatial GIS Map', href: '/map', icon: <Compass className="w-5 h-5" /> },
          { label: 'Escalations Monitor', href: '/dashboard/district-collector?tab=escalations', icon: <Shield className="w-5 h-5" /> },
          { label: 'Critical Issues', href: '/dashboard/district-collector?tab=critical', icon: <ClipboardList className="w-5 h-5" /> },
          { label: 'Taluk Comparison', href: '/dashboard/district-collector?tab=taluks', icon: <Building2 className="w-5 h-5" /> },
        ];
      case UserRole.DEPARTMENT_SECRETARY:
        return [
          { label: 'State Department Analytics', href: '/dashboard/department-secretary', icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: 'Spatial GIS Map', href: '/map', icon: <Compass className="w-5 h-5" /> },
          { label: 'District League Table', href: '/dashboard/department-secretary?tab=districts', icon: <Layers className="w-5 h-5" /> },
          { label: 'Policy Trends', href: '/dashboard/department-secretary?tab=trends', icon: <FileText className="w-5 h-5" /> },
        ];
      case UserRole.CHIEF_SECRETARY:
        return [
          { label: 'State Governance Matrix', href: '/dashboard/chief-secretary', icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: 'Spatial GIS Map', href: '/map', icon: <Compass className="w-5 h-5" /> },
          { label: 'Inter-Departmental SLA', href: '/dashboard/chief-secretary?tab=sla', icon: <Layers className="w-5 h-5" /> },
          { label: 'Red Flag Bottlenecks', href: '/dashboard/chief-secretary?tab=redflags', icon: <Shield className="w-5 h-5" /> },
        ];
      case UserRole.CHIEF_MINISTER:
        return [
          { label: 'Apex Command Center', href: '/dashboard/chief-minister', icon: <Award className="w-5 h-5" /> },
          { label: 'Spatial GIS Map', href: '/map', icon: <Compass className="w-5 h-5" /> },
          { label: 'Critical Red Escalations', href: '/dashboard/chief-minister?tab=escalations', icon: <Shield className="w-5 h-5" /> },
          { label: 'District Rankings', href: '/dashboard/chief-minister?tab=districts', icon: <Building2 className="w-5 h-5" /> },
          { label: 'Citizen Voice & Feedback', href: '/dashboard/chief-minister?tab=feedback', icon: <Users className="w-5 h-5" /> },
        ];
      case UserRole.ADMIN:
        return [
          { label: 'Governance Console', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: 'Users & Roles', href: '/admin?tab=users', icon: <Users className="w-5 h-5" /> },
          { label: 'Departments & Categories', href: '/admin?tab=catalog', icon: <Building2 className="w-5 h-5" /> },
          { label: 'SLA & Escalation Rules', href: '/admin?tab=rules', icon: <SlidersHorizontal className="w-5 h-5" /> },
          { label: 'System Audit Logs', href: '/admin?tab=audit', icon: <FileText className="w-5 h-5" /> },
        ];
      default:
        return [{ label: 'Dashboard', href: pathname, icon: <LayoutDashboard className="w-5 h-5" /> }];
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Government Executive Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: TN Emblem & System Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-hidden"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center font-bold text-sm text-white shadow-xs">
                  TN
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold tracking-tight text-white text-base sm:text-lg">
                      CivicConnect TN
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
                      Govt of Tamil Nadu
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 hidden sm:block">
                    Unified Civic Grievance Redressal & Operations Platform
                  </p>
                </div>
              </Link>
            </div>

            {/* Right: Jurisdiction Scope & Role Profile */}
            <div className="flex items-center gap-3 sm:gap-4">
              {jurisdictionScope && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">{jurisdictionScope}</span>
                </div>
              )}

              {/* Theme Switcher */}
              <ThemeToggle size="sm" />

              {/* Role Pill */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hidden xs:inline-block">
                  {ROLE_LABELS[role] || role}
                </span>

                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-white">{user?.display_name || 'Officer'}</p>
                  <p className="text-[10px] text-slate-400">{user?.email || 'officer@tn.gov.in'}</p>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Operations Navigation
              </p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href.split('?')[0];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
            <div className="w-72 bg-white dark:bg-slate-900 h-full p-5 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">Navigation</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        pathname === item.href.split('?')[0]
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Center Main Content Body */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Header Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Live Operations
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 font-medium">{subtitle}</p>
            </div>
            {jurisdictionScope && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 self-start md:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{jurisdictionScope}</span>
              </div>
            )}
          </div>

          {/* Child Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
