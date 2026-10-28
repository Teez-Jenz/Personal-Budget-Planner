'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent, fromMinorUnits, toMinorUnits, SUPPORTED_CURRENCIES } from '@/lib/currency';
import {
  calculatePeriodSummary,
  calculateCategoryBudgets,
  generateDailyCashFlow,
  getPeriodDateRange,
} from '@/lib/budget-engine';
import { TransactionModal } from '@/components/transactions/transaction-modal';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Target,
  Sparkles,
  Receipt,
  Layers,
  PiggyBank,
  GraduationCap,
  Calculator,
  Utensils,
  Car,
  Gift,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    profile,
    transactions,
    categories,
    activeBudget,
    budgetCategories,
    savingsGoals,
    selectedPeriod,
    seedSampleData,
    isLoaded,
    addTransaction,
    recordSavingsMovement,
  } = useBudgetPlanner();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<string | null>(null);

  // Quick Deposit to Piggy Bank modal state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmountStr, setDepositAmountStr] = useState('');

  // Calculate current period dates
  const dateRange = useMemo(() => getPeriodDateRange(selectedPeriod), [selectedPeriod]);

  // Financial calculations for period
  const summary = useMemo(() => {
    return calculatePeriodSummary(
      transactions,
      activeBudget,
      dateRange.start,
      dateRange.end,
      profile.default_currency
    );
  }, [transactions, activeBudget, dateRange, profile.default_currency]);

  // Category budget analysis
  const categoryBudgets = useMemo(() => {
    const periodTxs = transactions.filter(
      (t) => t.transaction_date >= dateRange.start && t.transaction_date <= dateRange.end
    );
    return calculateCategoryBudgets(categories, budgetCategories, periodTxs);
  }, [categories, budgetCategories, transactions, dateRange]);

  // Total Piggy Bank Saved across all goals
  const totalPiggyBankSavedMinor = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + g.current_amount_minor, 0);
  }, [savingsGoals]);

  // Safe daily spend calculation
  const safeDailySpend = useMemo(() => {
    const daysLeft = Math.max(1, summary.daysRemainingInPeriod);
    const remainingMinor = Math.max(0, summary.budgetRemainingMinor);
    // If no budget set, use net savings
    const baseMinor = summary.budgetLimitMinor > 0 ? remainingMinor : Math.max(0, summary.netSavingsMinor);
    return fromMinorUnits(baseMinor, profile.default_currency) / daysLeft;
  }, [summary, profile.default_currency]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // Handle Quick Add shortcuts
  const handleQuickAdd = (categoryNameSnippet: string, defaultAmount: number, type: 'expense' | 'income', defaultNote: string) => {
    const matchedCat = categories.find(
      (c) => c.type === type && c.name.toLowerCase().includes(categoryNameSnippet.toLowerCase())
    ) || categories.find((c) => c.type === type);

    if (!matchedCat) {
      setIsModalOpen(true);
      return;
    }

    const minor = toMinorUnits(defaultAmount, profile.default_currency);
    const todayIso = new Date().toISOString().slice(0, 10);

    addTransaction({
      type,
      amount_minor: minor,
      category_id: matchedCat.id,
      currency: profile.default_currency,
      transaction_date: todayIso,
      note: defaultNote,
      merchant_or_payee: matchedCat.name,
      source: 'manual',
    });
  };

  const handleDepositToGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const cleanAmount = parseFloat(depositAmountStr.replace(/,/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    recordSavingsMovement(
      depositGoalId,
      toMinorUnits(cleanAmount, profile.default_currency),
      'deposit',
      'Quick deposit from dashboard'
    );

    setDepositGoalId(null);
    setDepositAmountStr('');
  };

  if (!isLoaded) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const isEmpty = transactions.length === 0;
  const currSymbol = SUPPORTED_CURRENCIES[profile.default_currency]?.symbol || '$';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Student Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, {profile.display_name?.split(' ')[0] || 'Scholar'}! 🎒
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              ⭐ Smart Saver
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tracking period: <span className="font-semibold text-slate-700 dark:text-slate-300">{dateRange.start}</span> to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{dateRange.end}</span> •{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{summary.daysRemainingInPeriod} days left</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/calculator">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-300">
              <Calculator className="h-4 w-4 text-indigo-600" />
              <span>Student Calculator</span>
            </Button>
          </Link>
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Record Money</span>
          </Button>
        </div>
      </div>

      {/* Honest Empty State for New Students */}
      {isEmpty && (
        <Card className="border-dashed border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-6 dark:border-emerald-800 dark:bg-emerald-950/20 text-center rounded-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 shadow-xs">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-slate-100">
            Welcome to Your Student Budget Planner! 🌟
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Ready to master your pocket money? Start by logging your lunch, snacks, and transport, or load realistic student demo data to see how it works!
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              Record First Money
            </Button>
            <Button onClick={seedSampleData} variant="outline" className="border-emerald-400 text-emerald-800 font-bold text-xs dark:text-emerald-300">
              <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" />
              Load Student Sample Scenario
            </Button>
          </div>
        </Card>
      )}

      {/* HERO: Safe-to-Spend Today Card */}
      <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-3 -bottom-4 text-white/10 pointer-events-none">
          <Wallet className="h-48 w-48" />
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              Daily Safe Spending Compass
            </span>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">
                {currSymbol}{safeDailySpend.toFixed(2)}
              </span>
              <span className="text-emerald-100 font-semibold text-sm">/ school day</span>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-emerald-50 max-w-xl leading-relaxed font-medium">
              You have <strong>{summary.daysRemainingInPeriod} days left</strong> in this period. As long as your daily lunch, snacks, and bus fare stay around <strong>{currSymbol}{safeDailySpend.toFixed(2)}</strong>, you will stay completely on plan!
            </p>

            {/* Quick Add Student Shortcuts */}
            <div className="mt-5 pt-4 border-t border-white/20">
              <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block mb-2">
                ⚡ Quick 1-Tap Log for Students:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickAdd('lunch', 5, 'expense', 'School cafeteria hot meal')}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-bold text-white backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/20"
                >
                  <Utensils className="h-3.5 w-3.5" />
                  + Cafeteria Lunch
                </button>
                <button
                  onClick={() => handleQuickAdd('snack', 2, 'expense', 'Tuck shop snack & drink')}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-bold text-white backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/20"
                >
                  <span>🧃</span>
                  + Break Snack
                </button>
                <button
                  onClick={() => handleQuickAdd('bus', 3, 'expense', 'Daily school bus fare')}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-bold text-white backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/20"
                >
                  <Car className="h-3.5 w-3.5" />
                  + Bus Fare
                </button>
                <button
                  onClick={() => handleQuickAdd('pocket', 20, 'income', 'Weekly pocket money allowance')}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-bold text-white backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/20"
                >
                  <Gift className="h-3.5 w-3.5 text-amber-300" />
                  + Allowance In
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-100 font-semibold">Spending Plan Progress</span>
              <span className="font-black text-white">{summary.budgetPercentUsed}%</span>
            </div>
            <Progress
              value={summary.budgetPercentUsed}
              status={summary.budgetStatus}
              className="h-2.5 bg-white/20"
            />
            <div className="flex justify-between text-[11px] text-emerald-100 font-medium">
              <span>Spent: {formatCurrency(summary.totalExpenseMinor, profile.default_currency)}</span>
              <span>Limit: {formatCurrency(summary.budgetLimitMinor, profile.default_currency)}</span>
            </div>

            <Link href="/budgets" className="block w-full">
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs font-bold border-white/30 text-white hover:bg-white/20 bg-white/10"
              >
                View & Adjust Spending Plan
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Money In */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Money In (Allowances)
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalIncomeMinor, profile.default_currency)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Pocket money, gifts & chores
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Money Out */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Money Out (Spent)
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatCurrency(summary.totalExpenseMinor, profile.default_currency)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Cafeteria, snacks, bus & fun
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Piggy Bank Savings */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Piggy Bank Total
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <PiggyBank className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(totalPiggyBankSavedMinor, profile.default_currency)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Across {savingsGoals.length} savings goals
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Plan Left */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Plan Remaining
            </CardTitle>
            <Badge status={summary.budgetStatus}>
              {summary.budgetLimitMinor > 0 ? `${summary.budgetPercentUsed}% used` : 'No Limit'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {summary.budgetLimitMinor > 0
                ? formatCurrency(summary.budgetRemainingMinor, profile.default_currency)
                : formatCurrency(summary.netSavingsMinor, profile.default_currency)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Safe buffer for rest of period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Spending Plan Categories & Piggy Bank Goals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Budget Tracker (2 Cols) */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-600" />
                My Spending Plan by Category
              </CardTitle>
              <CardDescription>
                Keep an eye on what you spend on school lunch, snacks, bus, and fun!
              </CardDescription>
            </div>
            <Link href="/budgets">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Adjust Plan →
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="space-y-3 pt-0">
            {categoryBudgets.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Layers className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold">No category limits set yet.</p>
                <Link href="/budgets">
                  <Button size="sm" variant="outline" className="mt-3 text-xs font-bold">
                    Create Spending Plan
                  </Button>
                </Link>
              </div>
            ) : (
              categoryBudgets.slice(0, 6).map((cat) => (
                <div
                  key={cat.categoryId}
                  className="space-y-1.5 rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.categoryColor }} />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {cat.categoryName}
                      </span>
                      {cat.isEssential && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded dark:bg-emerald-950/60 dark:text-emerald-300">
                          School Need
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-300 font-bold">
                        {formatCurrency(cat.spentMinor, profile.default_currency)} /{' '}
                        {cat.limitMinor > 0 ? formatCurrency(cat.limitMinor, profile.default_currency) : 'No Limit'}
                      </span>
                      <Badge status={cat.status}>{cat.percentUsed}%</Badge>
                    </div>
                  </div>
                  {cat.limitMinor > 0 && (
                    <Progress value={cat.percentUsed} status={cat.status} aria-label={`${cat.categoryName} budget progress`} />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Piggy Bank Goals Column (1 Col) */}
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-amber-500" />
                  Piggy Bank Goals
                </CardTitle>
                <CardDescription>Save up for what you want!</CardDescription>
              </div>
              <Link href="/savings">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-amber-600 hover:text-amber-700">
                  All Goals →
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {savingsGoals.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Target className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600 mb-1.5" />
                  <p className="text-xs font-semibold">No piggy bank goals yet.</p>
                  <Link href="/savings">
                    <Button size="sm" variant="outline" className="mt-2 text-xs font-bold">
                      Set Your First Goal
                    </Button>
                  </Link>
                </div>
              ) : (
                savingsGoals.slice(0, 3).map((goal) => {
                  const percent = Math.min(
                    100,
                    Math.round((goal.current_amount_minor / goal.target_amount_minor) * 100)
                  );
                  return (
                    <div
                      key={goal.id}
                      className="space-y-1.5 rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-amber-50/20 dark:bg-amber-950/10"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate text-slate-900 dark:text-slate-100">{goal.name}</span>
                        <span className="font-black text-amber-600">{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-2" aria-label={`${goal.name} progress`} />
                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(goal.current_amount_minor, profile.default_currency)}
                        </span>
                        <span>Target: {formatCurrency(goal.target_amount_minor, profile.default_currency)}</span>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => {
                            setDepositGoalId(goal.id);
                            setDepositAmountStr('');
                          }}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 flex items-center gap-1"
                        >
                          + Feed Piggy Bank
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Calculator Shortcut Banner */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-sm font-bold">
              <Calculator className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Student Money Calculator
            </div>
            <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Calculate your daily school spend, savings timeline, or take the <strong>"Can I Afford This?"</strong> test!
            </p>
            <Link href="/calculator" className="mt-3 inline-block">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1 shadow-sm">
                Open Calculator
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Recent Money Activity
            </CardTitle>
            <CardDescription>Your latest pocket money, lunch, and snack entries</CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              View All History →
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="pt-0">
          {recentTransactions.length === 0 ? (
            <div className="py-6 text-center text-slate-400">
              <p className="text-xs font-medium">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {isIncome ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {tx.note || tx.merchant_or_payee || (isIncome ? 'Allowance In' : 'Expense')}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {tx.transaction_date} • {tx.merchant_or_payee || ''}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-black ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount_minor, profile.default_currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Deposit to Piggy Bank Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-amber-500" />
              Deposit to Piggy Bank
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {savingsGoals.find((g) => g.id === depositGoalId)?.name}
            </p>

            <form onSubmit={handleDepositToGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Amount ({currSymbol})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  autoFocus
                  required
                  value={depositAmountStr}
                  onChange={(e) => setDepositAmountStr(e.target.value)}
                  placeholder="e.g. 5.00"
                  className="w-full px-3 py-2 text-lg font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDepositGoalId(null)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Confirm Deposit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Transaction Modal */}
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
