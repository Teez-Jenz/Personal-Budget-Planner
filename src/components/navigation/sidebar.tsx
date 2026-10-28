'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Layers,
  PiggyBank,
  Calculator,
  BarChart3,
  Sliders,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBudgetPlanner } from '@/lib/store';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/transactions', label: 'Incomes & Expenses', icon: Receipt },
  { href: '/budgets', label: 'Spending Plan', icon: Layers },
  { href: '/savings', label: 'Piggy Bank (Savings)', icon: PiggyBank },
  { href: '/calculator', label: 'Student Calculator', icon: Calculator },
  { href: '/reports', label: 'Reports & Summary', icon: BarChart3 },
  { href: '/settings', label: 'Settings & Currency', icon: Sliders },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useBudgetPlanner();

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/70 sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 text-white shadow-md shadow-emerald-500/20">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-base tracking-tight flex items-center gap-1">
            PocketWise <span className="inline-block text-xs text-amber-500">✨</span>
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
            Student Budget Planner
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold dark:bg-emerald-600 dark:text-white'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-transform group-hover:scale-110',
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                )}
              />
              <span>{item.label}</span>
              {item.href === '/calculator' && (
                <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Student Tip of the Day Footer */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            Student Smart Rule
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
            Save at least 20% of every allowance or gift straight into your Piggy Bank before spending! 🐷
          </p>
        </div>
      </div>
    </aside>
  );
}
