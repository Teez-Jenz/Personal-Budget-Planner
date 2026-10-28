'use client';

import React, { useState } from 'react';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { CurrencyCode, BudgetPeriodType } from '@/lib/types';
import {
  Sliders,
  Download,
  Trash2,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const { profile, updateProfile, exportCsv, clearAllData, seedSampleData } = useBudgetPlanner();

  const [name, setName] = useState(profile.display_name || '');
  const [currency, setCurrency] = useState<CurrencyCode>(profile.default_currency);
  const [period, setPeriod] = useState<BudgetPeriodType>(profile.budget_period);

  const [isSaved, setIsSaved] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      display_name: name.trim(),
      default_currency: currency,
      budget_period: period,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClearConfirm = () => {
    clearAllData();
    setIsClearModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-600" />
          Student Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your name, pocket money currency, and budget tracking cycle.
        </p>
      </div>

      {/* Student Profile & Currency Card */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            My Student Profile
          </CardTitle>
          <CardDescription>Set your student name and preferred currency</CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <Input
            label="Your Name or Nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex, Jordan, Sarah..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pref-currency" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Your Currency
              </label>
              <select
                id="pref-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol}) — {curr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pref-period" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                How Often Do You Plan Money?
              </label>
              <select
                id="pref-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as BudgetPeriodType)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="weekly">Weekly (Recommended for School Pocket Money)</option>
                <option value="monthly">Monthly (For Monthly Allowances)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {isSaved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <CheckCircle2 className="h-4 w-4" /> Preferences updated successfully!
              </span>
            )}
            <div className="ml-auto">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                Save Profile
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Quick Data Actions */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Data Tools & Demo
          </CardTitle>
          <CardDescription>Export your pocket money history, load demo examples, or start fresh</CardDescription>
        </CardHeader>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={seedSampleData}
            className="text-xs font-bold border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" />
            Load Student Demo Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="text-xs font-bold gap-1.5"
          >
            <Download className="h-4 w-4" />
            Download Money History (CSV)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClearModalOpen(true)}
            className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/20 ml-auto"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Reset All Data
          </Button>
        </div>
      </Card>

      {/* Privacy Notice */}
      <div className="rounded-2xl p-4 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200">100% Student Privacy:</strong> PocketWise stores all your pocket money, cafeteria expenses, and savings goals right on your device in local browser storage. No ads, no tracking, and no bank account connection required.
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Reset All Pocket Money Data?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This will clear all recorded pocket money, cafeteria expenses, spending plans, and piggy bank goals. You will start with a fresh slate.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsClearModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleClearConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Yes, Reset Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
