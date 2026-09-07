'use client';

// =============================================================================
// CivicConnect TN — Citizen Header Component with Mobile Drawer & Realtime Alerts
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  PlusCircle,
  Search,
  Compass,
  Users,
  Mic,
  MapPin,
  Cpu,
  Sparkles,
  FileText,
  Menu,
  X,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { VoiceAssistantModal } from '@/components/voice/voice-assistant-modal';
import { NotificationDrawer } from '@/components/notifications/notification-drawer';
import { LiveToastListener } from '@/components/notifications/live-toast-listener';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function CitizenHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real-time notifications hook with Supabase live stream & fallback
  const {
    notifications,
    unreadCount,
    isRealtimeConnected,
    markAsRead,
    markAllAsRead,
    refresh,
    latestNotification,
  } = useRealtimeNotifications();

  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null);

  const activeToast =
    latestNotification && latestNotification.id !== dismissedToastId
      ? latestNotification
      : null;

  const navLinks = [
    { label: 'Report Problem', href: '/submit-issue', icon: PlusCircle },
    { label: 'Track Issue', href: '/track', icon: Search },
    { label: 'Nearby Issues', href: '/nearby', icon: Compass },
    { label: 'Spatial Map', href: '/map', icon: MapPin },
    { label: 'Data Mining', href: '/data-mining', icon: Cpu },
    { label: 'Predictive AI', href: '/predictive', icon: Sparkles },
    { label: 'Reports', href: '/reports', icon: FileText },
    { label: 'Community Feed', href: '/community', icon: Users },
  ];

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Left: Mobile Hamburger Trigger + Brand Logo */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Hamburger Button (Hidden on xl screens) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              className="xl:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all touch-target focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-500" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group touch-target">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-all shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-emerald-400 text-xs sm:text-sm">
                  TN
                </div>
              </div>
              <div>
                <span className="font-bold tracking-tight text-slate-900 dark:text-white text-xs sm:text-sm block">
                  CivicConnect TN
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5 truncate max-w-[130px] sm:max-w-none">
                  Citizen Public Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isActive
                      ? 'bg-emerald-600/15 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Voice Assistant, Theme Toggle, Realtime Notifications & User */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle (Light / Dark Mode) */}
            <ThemeToggle size="sm" />

            {/* Quick Voice Assistant Button */}
            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-semibold shadow-xs transition-all cursor-pointer touch-target focus-visible:ring-2 focus-visible:ring-emerald-400"
              title="Voice Assistant (Tamil & English)"
              aria-label="Open Voice AI Assistant"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Voice AI</span>
            </button>

            {/* Supabase Realtime Notification Bell Trigger */}
            <button
              type="button"
              onClick={() => setShowNotificationDrawer(true)}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer touch-target focus-visible:ring-2 focus-visible:ring-emerald-400"
              title={`Notifications & Alerts (${unreadCount} unread)`}
              aria-label={`Open notifications, ${unreadCount} unread`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-md">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isAuthenticated && user ? (
              <Link
                href="/dashboard/citizen"
                className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 transition-all touch-target focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Open citizen profile dashboard"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-[10px]">
                  {user.display_name?.charAt(0) || 'U'}
                </div>
                <span className="hidden md:inline font-medium truncate max-w-[100px]">
                  {user.display_name}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/20 transition-all touch-target focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer (Full Responsive Slide-Down / Slide-Over for < xl) */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-drawer"
            className="xl:hidden border-t border-slate-800/80 bg-slate-950/98 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200 shadow-2xl"
          >
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium transition-all touch-target ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                        : 'bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Government of Tamil Nadu
              </span>
              {isAuthenticated && (
                <Link
                  href="/dashboard/citizen"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1"
                >
                  <User className="w-3 h-3" />
                  My Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Header Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />

      {/* Realtime Notification Slide-Over Drawer */}
      <NotificationDrawer
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        isRealtimeConnected={isRealtimeConnected}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onRefresh={refresh}
      />

      {/* Global Live Realtime Incoming Notification Toast */}
      <LiveToastListener
        notification={activeToast}
        onDismiss={() => setDismissedToastId(activeToast?.id || null)}
        onOpenDrawer={() => {
          setDismissedToastId(activeToast?.id || null);
          setShowNotificationDrawer(true);
        }}
      />
    </>
  );
}
