'use client';

import React from 'react';
import { useBudgetPlanner } from '@/lib/store';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { CurrencyCode } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sparkles, Trash2, Calendar, Wallet, GraduationCap } from 'lucide-react';

export function Header() {
  const {
    profile,
    updateProfile,
    selectedPeriod,
    setSelectedPeriod,
    seedSampleData,
    clearAllData,
    transactions,
  } = useBudgetPlanner();

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateProfile({ default_currency: e.target.value as CurrencyCode });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-base">PocketWise</span>
        </div>

        {/* Period Selector Tabs */}
        <div className="hidden sm:flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              selectedPeriod === 'monthly'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setSelectedPeriod('weekly')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              selectedPeriod === 'weekly'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedPeriod('previous_month')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              selectedPeriod === 'previous_month'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Past Month
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Currency Switcher */}
        <div className="relative">
          <select
            value={profile.default_currency}
            onChange={handleCurrencyChange}
            aria-label="Select currency"
            className="h-9 appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} ({curr.symbol})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            ▼
          </div>
        </div>

        {/* Demo Data Seeder / Reset Quick Actions */}
        {transactions.length === 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={seedSampleData}
            title="Load sample financial scenario"
            className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/70 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/30"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden md:inline">Load Student Demo</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAllData}
            title="Reset to clean slate"
            className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Clear Slate</span>
          </Button>
        )}

        {/* User Profile Mini Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 text-xs dark:bg-slate-700 dark:text-slate-200">
            {(profile.display_name || 'U').charAt(0)}
          </div>
          <span className="hidden xl:inline text-xs font-medium text-slate-700 dark:text-slate-300">
            {profile.display_name}
          </span>
        </div>
      </div>
    </header>
  );
}
