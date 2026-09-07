'use client';

// =============================================================================
// CivicConnect TN — Theme Toggle Button (Light / Dark Mode Switcher)
// =============================================================================

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'labeled';
  size?: 'sm' | 'md';
}

export function ThemeToggle({
  className = '',
  variant = 'icon',
  size = 'md',
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 ${
          size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
        } animate-pulse ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      className={`relative inline-flex items-center justify-center rounded-xl transition-all cursor-pointer select-none touch-target focus-visible:ring-2 focus-visible:ring-emerald-400 ${
        size === 'sm' ? 'p-1.5' : 'p-2'
      } ${
        isDark
          ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-slate-700'
          : 'bg-white hover:bg-slate-100 text-amber-600 border border-slate-200 hover:border-slate-300 shadow-xs'
      } ${className}`}
    >
      {isDark ? (
        <Sun className={`${size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5'} transition-transform duration-200 rotate-0 hover:rotate-45`} />
      ) : (
        <Moon className={`${size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5'} transition-transform duration-200 rotate-0 hover:-rotate-12`} />
      )}

      {variant === 'labeled' && (
        <span className="ml-2 text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
