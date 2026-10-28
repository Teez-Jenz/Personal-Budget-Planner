'use client';

import React, { useState, useMemo } from 'react';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, toMinorUnits, SUPPORTED_CURRENCIES } from '@/lib/currency';
import {
  Calculator,
  Wallet,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Calendar,
  Layers,
  GraduationCap,
  Percent,
  Clock,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

export default function StudentCalculatorPage() {
  const {
    profile,
    saveBudget,
    addSavingsGoal,
    transactions,
    activeBudget,
  } = useBudgetPlanner();

  const [activeTab, setActiveTab] = useState<'pocket-money' | 'goal-time' | 'can-i-afford' | 'split-rule'>('pocket-money');

  // Currency
  const currCode = profile.default_currency;
  const currSymbol = SUPPORTED_CURRENCIES[currCode]?.symbol || '$';

  // ==========================================
  // 1. POCKET MONEY & DAILY SPEND CALCULATOR
  // ==========================================
  const [pocketAmount, setPocketAmount] = useState<number>(25);
  const [pocketPeriod, setPocketPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [schoolDaysPerWeek, setSchoolDaysPerWeek] = useState<number>(5);
  const [savingsPercent, setSavingsPercent] = useState<number>(20);
  const [planSavedNotice, setPlanSavedNotice] = useState<string | null>(null);

  const pocketCalculations = useMemo(() => {
    const total = Math.max(0, pocketAmount);
    const saveAmount = (total * savingsPercent) / 100;
    const spendable = total - saveAmount;

    let dailySchoolSpend = 0;
    let weekendFunSpend = 0;

    if (pocketPeriod === 'weekly') {
      const weekendWeight = 2; // weekend days
      // Let's allocate 75% of spendable to school days and 25% to weekend
      const schoolTotal = spendable * 0.75;
      const weekendTotal = spendable * 0.25;
      dailySchoolSpend = schoolDaysPerWeek > 0 ? schoolTotal / schoolDaysPerWeek : 0;
      weekendFunSpend = weekendTotal;
    } else {
      // Monthly (approx 4 weeks, 20 school days)
      const schoolDaysPerMonth = schoolDaysPerWeek * 4;
      const schoolTotal = spendable * 0.75;
      dailySchoolSpend = schoolDaysPerMonth > 0 ? schoolTotal / schoolDaysPerMonth : 0;
      weekendFunSpend = spendable * 0.25;
    }

    const monthlySavingsProjection = pocketPeriod === 'weekly' ? saveAmount * 4.33 : saveAmount;
    const termSavingsProjection = monthlySavingsProjection * 3; // 3 months term

    return {
      total,
      saveAmount,
      spendable,
      dailySchoolSpend,
      weekendFunSpend,
      monthlySavingsProjection,
      termSavingsProjection,
    };
  }, [pocketAmount, pocketPeriod, schoolDaysPerWeek, savingsPercent]);

  const handleApplyToPlan = () => {
    const totalMinor = toMinorUnits(pocketCalculations.spendable, currCode);
    saveBudget(totalMinor, `Student ${pocketPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Spend Plan`);
    setPlanSavedNotice(`Great job! Spending limit of ${formatCurrency(totalMinor, currCode)} saved to your plan.`);
    setTimeout(() => setPlanSavedNotice(null), 4000);
  };

  // ==========================================
  // 2. SAVINGS GOAL TIMELINE CALCULATOR
  // ==========================================
  const [goalNameInput, setGoalNameInput] = useState('New Sneakers 👟');
  const [goalTargetCost, setGoalTargetCost] = useState<number>(80);
  const [goalCurrentSaved, setGoalCurrentSaved] = useState<number>(15);
  const [goalSavePerWeek, setGoalSavePerWeek] = useState<number>(10);
  const [goalCreatedNotice, setGoalCreatedNotice] = useState<string | null>(null);

  const goalCalculations = useMemo(() => {
    const remaining = Math.max(0, goalTargetCost - goalCurrentSaved);
    const weeklySave = Math.max(0.1, goalSavePerWeek);
    const weeksNeeded = Math.ceil(remaining / weeklySave);
    const daysNeeded = weeksNeeded * 7;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysNeeded);

    const boostWeekly = weeklySave * 1.5;
    const boostWeeksNeeded = Math.ceil(remaining / boostWeekly);

    return {
      remaining,
      weeksNeeded,
      daysNeeded,
      targetDateFormatted: targetDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      boostWeeksNeeded,
      savedWeeksIfBoosted: Math.max(0, weeksNeeded - boostWeeksNeeded),
    };
  }, [goalTargetCost, goalCurrentSaved, goalSavePerWeek]);

  const handleAddGoalDirectly = () => {
    if (!goalNameInput.trim() || goalTargetCost <= 0) return;
    const targetMinor = toMinorUnits(goalTargetCost, currCode);
    const targetDateIso = new Date(Date.now() + goalCalculations.daysNeeded * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);

    addSavingsGoal({
      name: goalNameInput.trim(),
      target_amount_minor: targetMinor,
      currency: currCode,
      target_date: targetDateIso,
      status: 'in_progress',
    });

    setGoalCreatedNotice(`Awesome! "${goalNameInput}" was added to your Piggy Bank goals! 🎯`);
    setTimeout(() => setGoalCreatedNotice(null), 4000);
  };

  // ==========================================
  // 3. "CAN I AFFORD THIS?" DECISION CHECKER
  // ==========================================
  const [affordItemName, setAffordItemName] = useState('Fast Food Combo');
  const [affordItemPrice, setAffordItemPrice] = useState<number>(8);
  const [affordCategoryType, setAffordCategoryType] = useState<'need' | 'want'>('want');

  // Compute student remaining money in current period
  const totalIncomeMinor = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount_minor, 0);
  const totalExpenseMinor = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount_minor, 0);
  const currentCashInWallet = Math.max(0, (totalIncomeMinor - totalExpenseMinor) / 100);

  const affordVerdict = useMemo(() => {
    const price = Math.max(0, affordItemPrice);
    if (price <= 0) {
      return { status: 'neutral', message: 'Enter a price to test affordability.' };
    }

    if (price > currentCashInWallet) {
      return {
        status: 'danger',
        badge: '🛑 CANNOT AFFORD NOW',
        color: 'rose',
        title: 'You do not have enough cash right now',
        advice: `This item costs ${currSymbol}${price.toFixed(2)}, but you only have ${currSymbol}${currentCashInWallet.toFixed(2)} available. Don't worry! Add it to your Piggy Bank goals to save for it.`,
      };
    }

    const percentOfWallet = (price / currentCashInWallet) * 100;

    if (affordCategoryType === 'need') {
      if (percentOfWallet > 80) {
        return {
          status: 'warning',
          badge: '⚠️ CAUTION: LARGE EXPENSE',
          color: 'amber',
          title: 'Takes over 80% of your remaining money',
          advice: `Even though it's a school essential, spending ${currSymbol}${price.toFixed(2)} leaves you with only ${currSymbol}${(currentCashInWallet - price).toFixed(2)} for the rest of the period. See if you can find a cheaper alternative or split the cost.`,
        };
      }
      return {
        status: 'success',
        badge: '✅ YES, SAFE TO BUY',
        color: 'emerald',
        title: 'Essential school expense fits your budget',
        advice: `Go ahead! You will have ${currSymbol}${(currentCashInWallet - price).toFixed(2)} remaining for your other school days.`,
      };
    } else {
      // It is a "Want" (Snack, Game, Toy, Cinema)
      if (percentOfWallet > 40) {
        return {
          status: 'warning',
          badge: '⚠️ HIGH RISK FOR A WANT',
          color: 'amber',
          title: 'Takes a big chunk of your pocket money',
          advice: `This item takes ${percentOfWallet.toFixed(0)}% of your remaining cash. If you buy this now, you might run out of lunch or transport money before the week ends! Think about waiting 24 hours before deciding.`,
        };
      }
      return {
        status: 'success',
        badge: '🎉 SAFE GUILT-FREE SPEND',
        color: 'emerald',
        title: 'Fits safely inside your fun budget!',
        advice: `You have plenty of buffer remaining (${currSymbol}${(currentCashInWallet - price).toFixed(2)} left). Enjoy yourself!`,
      };
    }
  }, [affordItemPrice, currentCashInWallet, affordCategoryType, currSymbol]);

  // ==========================================
  // 4. STUDENT 50/30/20 PLAN GENERATOR
  // ==========================================
  const [ruleIncomeInput, setRuleIncomeInput] = useState<number>(30);
  const ruleSplit = useMemo(() => {
    const inc = Math.max(0, ruleIncomeInput);
    return {
      needs: inc * 0.5,     // 50% Lunch, bus, stationery
      wants: inc * 0.3,     // 30% Snacks, fun, games
      savings: inc * 0.2,   // 20% Piggy bank
    };
  }, [ruleIncomeInput]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-sm">
              <Calculator className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Student Money Calculator
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calculate your pocket money, plan your school days, figure out savings timelines, and make smart spending choices!
          </p>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('pocket-money')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'pocket-money'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            🎒 Daily Pocket Money
          </button>
          <button
            onClick={() => setActiveTab('goal-time')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'goal-time'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            🐷 Savings Timeline
          </button>
          <button
            onClick={() => setActiveTab('can-i-afford')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'can-i-afford'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            🤔 Can I Afford It?
          </button>
          <button
            onClick={() => setActiveTab('split-rule')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'split-rule'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            📊 50/30/20 Rule
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: POCKET MONEY & DAILY SCHOOL SPENDING CALCULATOR   */}
      {/* ======================================================== */}
      {activeTab === 'pocket-money' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Card */}
          <Card className="lg:col-span-5 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Wallet className="h-5 w-5 text-emerald-600" />
                Your Allowance Settings
              </CardTitle>
              <CardDescription>
                How much pocket money do you receive, and how much would you like to save?
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pocket Money Amount */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Pocket Money Amount ({currSymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    {currSymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={pocketAmount}
                    onChange={(e) => setPocketAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 text-lg font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  How Often Do You Get This?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPocketPeriod('weekly')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                      pocketPeriod === 'weekly'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Every Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setPocketPeriod('monthly')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                      pocketPeriod === 'monthly'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Every Month
                  </button>
                </div>
              </div>

              {/* School Days */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    School Days Per Week: <span className="text-emerald-600 font-extrabold">{schoolDaysPerWeek} Days</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={schoolDaysPerWeek}
                  onChange={(e) => setSchoolDaysPerWeek(parseInt(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>1 day</span>
                  <span>5 days (Standard Mon-Fri)</span>
                  <span>7 days</span>
                </div>
              </div>

              {/* Savings Percentage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Piggy Bank Savings Cut: <span className="text-emerald-600 font-extrabold">{savingsPercent}%</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={savingsPercent}
                  onChange={(e) => setSavingsPercent(parseInt(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>0% (Spend all)</span>
                  <span>20% (Recommended)</span>
                  <span>50% (Super Saver)</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">Quick Pocket Money Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 20, 50, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => setPocketAmount(val)}
                      className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                    >
                      {currSymbol}{val}
                    </button>
                  ))}
                  {currCode === 'NGN' && [5000, 10000, 20000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setPocketAmount(val)}
                      className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                    >
                      ₦{val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Hero Result */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-4 top-4 text-emerald-200/20">
                <GraduationCap className="h-32 w-32" />
              </div>

              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Your Daily Safe Spending Limit
                </span>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight">
                    {currSymbol}{pocketCalculations.dailySchoolSpend.toFixed(2)}
                  </span>
                  <span className="text-emerald-100 font-medium text-sm">/ school day</span>
                </div>

                <p className="mt-2 text-xs sm:text-sm text-emerald-50 max-w-md leading-relaxed">
                  If you stick to <strong>{currSymbol}{pocketCalculations.dailySchoolSpend.toFixed(2)}</strong> per school day for lunch, snacks, and bus fare, you will never go broke before the weekend!
                </p>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/20">
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                    <span className="text-[11px] text-emerald-200 block font-medium">Piggy Bank ({savingsPercent}%)</span>
                    <span className="text-lg font-bold text-white">
                      {currSymbol}{pocketCalculations.saveAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                    <span className="text-[11px] text-emerald-200 block font-medium">Weekend / Free Spend</span>
                    <span className="text-lg font-bold text-white">
                      {currSymbol}{pocketCalculations.weekendFunSpend.toFixed(2)}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                    <span className="text-[11px] text-emerald-200 block font-medium">Total Spendable</span>
                    <span className="text-lg font-bold text-white">
                      {currSymbol}{pocketCalculations.spendable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Projection Box */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Look how fast your Piggy Bank grows! 🚀
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      By saving {savingsPercent}% ({currSymbol}{pocketCalculations.saveAmount.toFixed(2)}) each time:
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">In 1 Month</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {currSymbol}{pocketCalculations.monthlySavingsProjection.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Enough for a new game or outing!</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">In 1 School Term (3 Mos)</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {currSymbol}{pocketCalculations.termSavingsProjection.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Enough for sneakers or school trip!</span>
                  </div>
                </div>

                {/* Apply button */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Ready to use this as your real spending limit?
                  </span>
                  <Button
                    onClick={handleApplyToPlan}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                  >
                    <Layers className="h-4 w-4" />
                    Save as My Spending Plan
                  </Button>
                </div>

                {planSavedNotice && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {planSavedNotice}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SAVINGS GOAL TIMELINE CALCULATOR                   */}
      {/* ======================================================== */}
      {activeTab === 'goal-time' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <PiggyBank className="h-5 w-5 text-indigo-600" />
                What Are You Saving For?
              </CardTitle>
              <CardDescription>
                Find out exactly how many weeks it takes to buy what you want!
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Goal Name / Item
                </label>
                <input
                  type="text"
                  value={goalNameInput}
                  onChange={(e) => setGoalNameInput(e.target.value)}
                  placeholder="e.g. New Running Shoes, Headphones..."
                  className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Total Cost of the Item ({currSymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={goalTargetCost}
                  onChange={(e) => setGoalTargetCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Already Saved ({currSymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={goalCurrentSaved}
                    onChange={(e) => setGoalCurrentSaved(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Save Per Week ({currSymbol})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={goalSavePerWeek}
                    onChange={(e) => setGoalSavePerWeek(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg relative overflow-hidden">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                <Clock className="h-3.5 w-3.5 text-amber-300" />
                Target Reached In
              </span>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">
                  {goalCalculations.weeksNeeded} Weeks
                </span>
                <span className="text-indigo-100 font-medium text-sm">
                  ({goalCalculations.daysNeeded} days)
                </span>
              </div>

              <p className="mt-2 text-sm text-indigo-100 max-w-md">
                Keep saving {currSymbol}{goalSavePerWeek} each week and you will have enough cash to buy <strong>{goalNameInput}</strong> on:
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white font-black text-base border border-white/20">
                <Calendar className="h-5 w-5 text-amber-300" />
                {goalCalculations.targetDateFormatted}
              </div>

              {/* Accelerator tip */}
              {goalCalculations.savedWeeksIfBoosted > 0 && (
                <div className="mt-5 p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-indigo-50 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
                  <span>
                    <strong>Pro Student Tip:</strong> Save just {currSymbol}{(goalSavePerWeek * 0.5).toFixed(2)} extra per week and you will reach this goal <strong>{goalCalculations.savedWeeksIfBoosted} weeks earlier!</strong> ⚡
                  </span>
                </div>
              )}
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Add this directly to your Piggy Bank?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track your progress as you deposit money week by week.
                  </p>
                </div>

                <Button
                  onClick={handleAddGoalDirectly}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Create Piggy Bank Goal
                </Button>
              </CardContent>

              {goalCreatedNotice && (
                <div className="mx-5 mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {goalCreatedNotice}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: "CAN I AFFORD THIS?" DECISION CHECKER             */}
      {/* ======================================================== */}
      {activeTab === 'can-i-afford' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <ShoppingBag className="h-5 w-5 text-amber-500" />
                The "Can I Afford It?" Test
              </CardTitle>
              <CardDescription>
                Test before you buy! Check if this purchase will break your plan.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  What Do You Want to Buy?
                </label>
                <input
                  type="text"
                  value={affordItemName}
                  onChange={(e) => setAffordItemName(e.target.value)}
                  placeholder="e.g. Cinema ticket, Extra burger, School binder..."
                  className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Item Price ({currSymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={affordItemPrice}
                  onChange={(e) => setAffordItemPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Is this a Need or a Want?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAffordCategoryType('need')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-left ${
                      affordCategoryType === 'need'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    🎒 School Need
                    <span className="block text-[10px] font-normal text-slate-500">Lunch, Bus, Books</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAffordCategoryType('want')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-left ${
                      affordCategoryType === 'want'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    🍕 Fun Want
                    <span className="block text-[10px] font-normal text-slate-500">Snacks, Games, Treats</span>
                  </button>
                </div>
              </div>

              {/* Current wallet context */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Your Available Money</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {currSymbol}{currentCashInWallet.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Based on your recorded pocket money & expenses
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Verdict Box */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className={`rounded-2xl p-6 shadow-md border ${
                affordVerdict.status === 'success'
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : affordVerdict.status === 'warning'
                  ? 'bg-amber-500 text-white border-amber-400'
                  : affordVerdict.status === 'danger'
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'bg-slate-800 text-white border-slate-700'
              }`}
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md">
                {affordVerdict.badge || 'VERDICT'}
              </span>

              <h2 className="mt-3 text-2xl font-black">{affordVerdict.title}</h2>
              <p className="mt-2 text-sm text-white/90 leading-relaxed font-medium">
                {affordVerdict.advice}
              </p>

              <div className="mt-5 p-3 rounded-xl bg-white/15 backdrop-blur-md text-xs font-semibold flex items-center justify-between">
                <span>Remaining After Purchase:</span>
                <span className="text-base font-black">
                  {currSymbol}{Math.max(0, currentCashInWallet - affordItemPrice).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Smart Teen Financial Wisdom */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardContent className="p-5 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  The 24-Hour Rule for Secondary School Students
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Whenever you feel like impulse buying a snack, extra gaming skins, or clothes, wait exactly <strong>24 hours</strong>. If you still want it tomorrow and it fits your budget, buy it. 80% of the time, the urge will pass and your money stays safe in your pocket! 🧠
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: THE STUDENT 50/30/20 PLAN GENERATOR               */}
      {/* ======================================================== */}
      {activeTab === 'split-rule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Percent className="h-5 w-5 text-teal-600" />
                The 50/30/20 Student Rule
              </CardTitle>
              <CardDescription>
                The gold standard used by smart students all around the world!
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Your Total Pocket Money / Income ({currSymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ruleIncomeInput}
                  onChange={(e) => setRuleIncomeInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xl font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This rule automatically divides every dollar or naira you get into three simple, easy-to-follow jars so you can eat, have fun, and build wealth all at once!
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-7 space-y-4">
            {/* 3 Jars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Needs Jar */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                    50% NEEDS
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    School Essentials
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Lunch, bus pass, notebooks, pens.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-900">
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {currSymbol}{ruleSplit.needs.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Wants Jar */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white">
                    30% WANTS
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    Fun & Freedom
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Snacks, gaming, hangout, cinema.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {currSymbol}{ruleSplit.wants.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Savings Jar */}
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                    20% SAVINGS
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    Piggy Bank
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sneakers, phone, trips, future you!
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900">
                  <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                    {currSymbol}{ruleSplit.savings.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Apply this 50/30/20 Plan
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sets your total spending limit to {currSymbol}{(ruleSplit.needs + ruleSplit.wants).toFixed(2)} and reserves {currSymbol}{ruleSplit.savings.toFixed(2)} for your Piggy Bank!
                  </p>
                </div>

                <Button
                  onClick={() => {
                    const spendMinor = toMinorUnits(ruleSplit.needs + ruleSplit.wants, currCode);
                    saveBudget(spendMinor, '50/30/20 Student Plan');
                    alert(`Plan updated! Total spending limit set to ${formatCurrency(spendMinor, currCode)}.`);
                  }}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Apply 50/30/20 to My Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
