'use client';

import React, { useMemo, useState } from 'react';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, fromMinorUnits } from '@/lib/currency';
import { getPeriodDateRange, calculatePeriodSummary, calculateCategoryBudgets } from '@/lib/budget-engine';
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart';
import { CategoryBreakdownChart } from '@/components/dashboard/category-breakdown-chart';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  Info,
  Scale,
} from 'lucide-react';

export default function ReportsPage() {
  const {
    transactions,
    categories,
    activeBudget,
    budgetCategories,
    profile,
    selectedPeriod,
    exportCsv,
  } = useBudgetPlanner();

  // Primary active period
  const primaryRange = useMemo(() => getPeriodDateRange(selectedPeriod), [selectedPeriod]);
  const primarySummary = useMemo(() => {
    return calculatePeriodSummary(
      transactions,
      activeBudget,
      primaryRange.start,
      primaryRange.end,
      profile.default_currency
    );
  }, [transactions, activeBudget, primaryRange, profile.default_currency]);

  // Comparison period: previous month
  const prevRange = useMemo(() => getPeriodDateRange('previous_month'), []);
  const prevSummary = useMemo(() => {
    return calculatePeriodSummary(
      transactions,
      null,
      prevRange.start,
      prevRange.end,
      profile.default_currency
    );
  }, [transactions, prevRange, profile.default_currency]);

  // Categories analysis
  const periodTxs = useMemo(() => {
    return transactions.filter(
      (t) => t.transaction_date >= primaryRange.start && t.transaction_date <= primaryRange.end
    );
  }, [transactions, primaryRange]);

  const categoryAnalysis = useMemo(() => {
    return calculateCategoryBudgets(categories, budgetCategories, periodTxs);
  }, [categories, budgetCategories, periodTxs]);

  // Essential vs Non-essential spending analysis
  const essentialSpendingMinor = useMemo(() => {
    const essentialIds = new Set(categories.filter((c) => c.is_essential).map((c) => c.id));
    return periodTxs
      .filter((t) => t.type === 'expense' && essentialIds.has(t.category_id))
      .reduce((sum, t) => sum + t.amount_minor, 0);
  }, [periodTxs, categories]);

  const nonEssentialSpendingMinor = Math.max(0, primarySummary.totalExpenseMinor - essentialSpendingMinor);
  const essentialPercent =
    primarySummary.totalExpenseMinor > 0
      ? Math.round((essentialSpendingMinor / primarySummary.totalExpenseMinor) * 100)
      : 0;

  // Period comparison deltas
  const expenseDeltaMinor = primarySummary.totalExpenseMinor - prevSummary.totalExpenseMinor;
  const incomeDeltaMinor = primarySummary.totalIncomeMinor - prevSummary.totalIncomeMinor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Student Money Reports & Summary 📊
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            See your pocket money habits: how much you received, what you spent, and your savings rate.
          </p>
        </div>

        <Button onClick={exportCsv} size="sm" variant="outline" className="gap-1.5 text-xs">
          <Download className="h-4 w-4" />
          <span>Download CSV Report</span>
        </Button>
      </div>

      {/* Non-judgmental Insights Policy */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Objective Reporting Guarantee
          </p>
          <p className="leading-relaxed">
            FinPlan uses strictly neutral and non-judgmental terminology. Calculations reflect mathematical variances between actual recorded periods rather than subjective assumptions.
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Active Period Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs uppercase font-semibold text-emerald-700 dark:text-emerald-400">
                Active Period ({selectedPeriod})
              </span>
              <p className="text-xs text-slate-500">{primaryRange.start} to {primaryRange.end}</p>
            </div>
            <Badge variant="success">Current</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Total Income:</span>
              <span className="text-base font-bold text-emerald-600">
                {formatCurrency(primarySummary.totalIncomeMinor, profile.default_currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Expenses:</span>
              <span className="text-base font-bold text-rose-600">
                {formatCurrency(primarySummary.totalExpenseMinor, profile.default_currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Net Cash Flow:</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(primarySummary.netSavingsMinor, profile.default_currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Budget Adherence:</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {primarySummary.budgetLimitMinor > 0 ? `${primarySummary.budgetPercentUsed}% used` : 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* Prior Period Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-500">
                Prior Month Reference
              </span>
              <p className="text-xs text-slate-500">{prevRange.start} to {prevRange.end}</p>
            </div>
            <Badge variant="secondary">Baseline</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Prior Income:</span>
              <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                {formatCurrency(prevSummary.totalIncomeMinor, profile.default_currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Prior Expenses:</span>
              <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                {formatCurrency(prevSummary.totalExpenseMinor, profile.default_currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Spending Change:</span>
              <span
                className={`text-base font-bold ${
                  expenseDeltaMinor > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {expenseDeltaMinor > 0 ? '+' : ''}
                {formatCurrency(expenseDeltaMinor, profile.default_currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Income Change:</span>
              <span
                className={`text-base font-bold ${
                  incomeDeltaMinor >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {incomeDeltaMinor >= 0 ? '+' : ''}
                {formatCurrency(incomeDeltaMinor, profile.default_currency)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Essential vs Discretionary Split Card */}
      <Card className="p-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Scale className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Needs vs. Wants Allocation (Essential Split)
            </h2>
            <p className="text-xs text-slate-500">
              Proportion of spending directed to survival categories (Housing, Groceries, Utilities, Health, Debt).
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
            <span className="text-slate-500 block">Essential Spending</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(essentialSpendingMinor, profile.default_currency)} ({essentialPercent}%)
            </span>
            <p className="mt-1 text-[11px] text-slate-400">
              Obligations necessary to sustain daily operations and well-being.
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
            <span className="text-slate-500 block">Discretionary Spending</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(nonEssentialSpendingMinor, profile.default_currency)} ({100 - essentialPercent}%)
            </span>
            <p className="mt-1 text-[11px] text-slate-400">
              Leisure, personal shopping, and non-mandatory purchases.
            </p>
          </div>
        </div>
      </Card>

      {/* Category Breakdown Component */}
      <CategoryBreakdownChart categoryBudgets={categoryAnalysis} currency={profile.default_currency} />
    </div>
  );
}
