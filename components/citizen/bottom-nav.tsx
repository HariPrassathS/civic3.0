'use client';

// =============================================================================
// CivicConnect TN — Citizen Mobile Bottom Navigation Bar
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Search, Compass, Users, User } from 'lucide-react';

export function CitizenBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Nearby', href: '/nearby', icon: Compass },
    { label: 'Report', href: '/submit-issue', icon: PlusCircle, isPrimary: true },
    { label: 'Track', href: '/track', icon: Search },
    { label: 'Community', href: '/community', icon: Users },
    { label: 'Profile', href: '/dashboard/citizen', icon: User },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),8px)] sm:hidden shadow-2xl safe-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="flex flex-col items-center -mt-6 group touch-target"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 group-active:scale-95 transition-all">
                  <div className="w-full h-full bg-emerald-600 rounded-full flex items-center justify-center text-white">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all touch-target focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
