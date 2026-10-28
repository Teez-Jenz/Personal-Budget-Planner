'use client';

import React, { useState, useMemo } from 'react';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, fromMinorUnits, toMinorUnits, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { getPeriodDateRange } from '@/lib/budget-engine';
import {
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ListOrdered,
  DollarSign,
  Layers,
} from 'lucide-react';

export default function IrregularIncomePage() {
  const {
    profile,
    updateProfile,
    irregularPlan,
    saveIrregularPlan,
    transactions,
    categories,
    recurringBills,
    debts,
    selectedPeriod,
  } = useBudgetPlanner();

  const isModeActive = profile.irregular_income_mode;
  const dateRange = useMemo(() => getPeriodDateRange(selectedPeriod), [selectedPeriod]);

  // Form states for conservative planning
  const [conservativeInput, setConservativeInput] = useState(
    irregularPlan ? String(fromMinorUnits(irregularPlan.conservative_estimate_minor, profile.default_currency)) : ''
  );
  const [bufferInput, setBufferInput] = useState(
    irregularPlan ? String(fromMinorUnits(irregularPlan.essential_buffer_minor, profile.default_currency)) : ''
  );
  const [notesInput, setNotesInput] = useState(irregularPlan?.notes || '');
  const [isEditingPlan, setIsEditingPlan] = useState(!irregularPlan);

  // Actual received income in period
  const actualReceivedIncomeMinor = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.type === 'income' &&
          t.transaction_date >= dateRange.start &&
          t.transaction_date <= dateRange.end
      )
      .reduce((sum, t) => sum + t.amount_minor, 0);
  }, [transactions, dateRange]);

  // Essential expenses total recorded in period
  const essentialExpensesMinor = useMemo(() => {
    const essentialCategoryIds = new Set(
      categories.filter((c) => c.is_essential).map((c) => c.id)
    );
    return transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          essentialCategoryIds.has(t.category_id) &&
          t.transaction_date >= dateRange.start &&
          t.transaction_date <= dateRange.end
      )
      .reduce((sum, t) => sum + t.amount_minor, 0);
  }, [transactions, categories, dateRange]);

  // Upcoming bills in period
  const totalUpcomingBillsMinor = useMemo(() => {
    return recurringBills
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + b.amount_minor, 0);
  }, [recurringBills]);

  // Minimum debt payments
  const totalDebtMinPaymentsMinor = useMemo(() => {
    return debts
      .filter((d) => d.status === 'active')
      .reduce((sum, d) => sum + d.minimum_payment_minor, 0);
  }, [debts]);

  const conservativeFloorMinor = irregularPlan?.conservative_estimate_minor || 0;
  const bufferMinor = irregularPlan?.essential_buffer_minor || 0;

  // Milestone pacing
  const pacingPercent =
    conservativeFloorMinor > 0
      ? Math.min(100, Math.round((actualReceivedIncomeMinor / conservativeFloorMinor) * 100))
      : 0;

  const handleToggleMode = () => {
    updateProfile({ irregular_income_mode: !isModeActive });
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const cons = parseFloat(conservativeInput.replace(/,/g, '')) || 0;
    const buf = parseFloat(bufferInput.replace(/,/g, '')) || 0;
    saveIrregularPlan(
      toMinorUnits(cons, profile.default_currency),
      toMinorUnits(buf, profile.default_currency),
      notesInput
    );
    setIsEditingPlan(false);
  };

  const currSymbol = SUPPORTED_CURRENCIES[profile.default_currency]?.symbol || '₦';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Irregular Income Planning
            </h1>
            <Badge variant={isModeActive ? 'warning' : 'secondary'}>
              {isModeActive ? 'Mode Active' : 'Mode Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Designed for freelancers, traders, and variable income earners who cannot assume a fixed monthly paycheck.
          </p>
        </div>

        <Button
          variant={isModeActive ? 'outline' : 'primary'}
          onClick={handleToggleMode}
          className="text-xs self-start sm:self-auto"
        >
          {isModeActive ? 'Disable Irregular Mode' : 'Enable Irregular Mode'}
        </Button>
      </div>

      {/* Critical Principle Callout */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Conservative Forecast Rule</p>
          <p className="leading-relaxed">
            Expected income is never treated as spendable money until it is actually received in your account. Forecasts are conservative estimates only and do not constitute guaranteed cash.
          </p>
        </div>
      </div>

      {/* Pacing Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Planned Conservative Floor */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs uppercase font-semibold text-slate-500">
              Conservative Income Target
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(conservativeFloorMinor, profile.default_currency)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Your conservative baseline floor for this period
            </p>
          </CardContent>
        </Card>

        {/* Actual Received */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs uppercase font-semibold text-slate-500">
              Actual Income Received
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(actualReceivedIncomeMinor, profile.default_currency)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {pacingPercent}% of conservative floor realized
            </p>
          </CardContent>
        </Card>

        {/* Pacing Gap / Surplus */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs uppercase font-semibold text-slate-500">
              Variance vs Target
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className={`text-2xl font-bold ${
                actualReceivedIncomeMinor >= conservativeFloorMinor
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {actualReceivedIncomeMinor >= conservativeFloorMinor ? '+' : ''}
              {formatCurrency(actualReceivedIncomeMinor - conservativeFloorMinor, profile.default_currency)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {actualReceivedIncomeMinor >= conservativeFloorMinor
                ? 'Target achieved. Surplus can fund buffer or goals.'
                : 'Pacing below floor. Maintain essential spending discipline.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-World Priority Order Framework */}
      <Card className="p-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <ListOrdered className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Variable Income Waterfall Allocation Priority
            </h2>
            <p className="text-xs text-slate-500">
              As cash trickles in, allocate funds in this exact priority sequence before non-essential purchases.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {/* Tier 1: Essential Living Expenses */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                1
              </span>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Essential Living Expenses (Food, Housing, Health, Fuel)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Non-negotiable survival obligations
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(essentialExpensesMinor, profile.default_currency)}
              </span>
              <span className="block text-[10px] text-slate-400">Recorded so far</span>
            </div>
          </div>

          {/* Tier 2: Upcoming Recurring Bills */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                2
              </span>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Scheduled Bills & Subscriptions
                </h3>
                <p className="text-[11px] text-slate-500">
                  Keep power, data, and utilities running without disconnection
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalUpcomingBillsMinor, profile.default_currency)}
              </span>
              <span className="block text-[10px] text-slate-400">Total active bills</span>
            </div>
          </div>

          {/* Tier 3: Minimum Debt Obligations */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                3
              </span>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Minimum Debt Repayments
                </h3>
                <p className="text-[11px] text-slate-500">
                  Avoid penalties, late interest spikes, and damaged credit
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalDebtMinPaymentsMinor, profile.default_currency)}
              </span>
              <span className="block text-[10px] text-slate-400">Required minimums</span>
            </div>
          </div>

          {/* Tier 4: Emergency Lean Buffer */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                4
              </span>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Lean Emergency Buffer (User Selected)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pads against delayed client payments or slow sales cycles
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(bufferMinor, profile.default_currency)}
              </span>
              <span className="block text-[10px] text-slate-400">Configured target</span>
            </div>
          </div>

          {/* Tier 5: Optional Discretionary */}
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs dark:bg-slate-700 dark:text-slate-300">
                5
              </span>
              <div>
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Discretionary Spending & Leisure
                </h3>
                <p className="text-[11px] text-slate-400">
                  Only spend from actual received surplus after Tiers 1–4 are fully funded.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500">Surplus Only</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit / Configure Conservative Plan */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Configure Conservative Floor for {dateRange.start} – {dateRange.end}
            </h2>
            <p className="text-xs text-slate-500">
              Set realistic, lower-bound estimates based on contract minimums or past worst-case months.
            </p>
          </div>
          {!isEditingPlan && (
            <Button size="sm" variant="outline" onClick={() => setIsEditingPlan(true)} className="text-xs">
              Edit Plan
            </Button>
          )}
        </div>

        {isEditingPlan ? (
          <form onSubmit={handleSavePlan} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={`Conservative Income Floor (${currSymbol})`}
                type="number"
                step="any"
                min="0"
                required
                value={conservativeInput}
                onChange={(e) => setConservativeInput(e.target.value)}
                placeholder="e.g. 350000"
                helperText="Use a realistic worst-case expected income for the period."
              />
              <Input
                label={`Emergency Buffer Reserve (${currSymbol})`}
                type="number"
                step="any"
                min="0"
                value={bufferInput}
                onChange={(e) => setBufferInput(e.target.value)}
                placeholder="e.g. 50000"
                helperText="Safety buffer reserved before any non-essential spending."
              />
            </div>

            <Input
              label="Planning Notes & Deliverables"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. 2 retainer clients (₦200k) + 1 expected project milestone (₦150k)"
            />

            <div className="flex justify-end gap-2 pt-2">
              {irregularPlan && (
                <Button type="button" variant="ghost" onClick={() => setIsEditingPlan(false)}>
                  Cancel
                </Button>
              )}
              <Button type="submit">Save Plan</Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 text-xs space-y-2 text-slate-600 dark:text-slate-400">
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Current Estimate: </span>
              {formatCurrency(conservativeFloorMinor, profile.default_currency)}
            </p>
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Buffer Target: </span>
              {formatCurrency(bufferMinor, profile.default_currency)}
            </p>
            {irregularPlan?.notes && (
              <p>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Notes: </span>
                {irregularPlan.notes}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
