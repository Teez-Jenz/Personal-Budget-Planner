'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, fromMinorUnits, toMinorUnits, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { calculateCategoryBudgets, getPeriodDateRange, calculateDaysRemaining } from '@/lib/budget-engine';
import {
  Layers,
  Plus,
  Info,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function BudgetsPage() {
  const {
    profile,
    categories,
    addCategory,
    deleteCategory,
    activeBudget,
    budgetCategories,
    saveBudget,
    saveBudgetCategoryLimit,
    transactions,
    selectedPeriod,
  } = useBudgetPlanner();

  // Modals
  const [isTotalBudgetModalOpen, setIsTotalBudgetModalOpen] = useState(false);
  const [isCategoryLimitModalOpen, setIsCategoryLimitModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);

  // Form states
  const [totalLimitInput, setTotalLimitInput] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [catLimitInput, setCatLimitInput] = useState('');

  // New Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [newCatIsEssential, setNewCatIsEssential] = useState(false);

  // Current period
  const dateRange = useMemo(() => getPeriodDateRange(selectedPeriod), [selectedPeriod]);
  const { daysRemaining } = useMemo(() => calculateDaysRemaining(dateRange.end), [dateRange.end]);

  // Calculations
  const periodTxs = useMemo(() => {
    return transactions.filter(
      (t) => t.transaction_date >= dateRange.start && t.transaction_date <= dateRange.end
    );
  }, [transactions, dateRange]);

  const categoryAnalysis = useMemo(() => {
    return calculateCategoryBudgets(categories, budgetCategories, periodTxs);
  }, [categories, budgetCategories, periodTxs]);

  const totalSpentMinor = useMemo(() => {
    return periodTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount_minor, 0);
  }, [periodTxs]);

  const totalLimitMinor = activeBudget?.total_limit_minor || 0;
  const totalRemainingMinor = totalLimitMinor - totalSpentMinor;
  const overallPercent = totalLimitMinor > 0 ? Math.round((totalSpentMinor / totalLimitMinor) * 100) : 0;

  const currSymbol = SUPPORTED_CURRENCIES[profile.default_currency]?.symbol || '₦';

  const handleSaveTotalBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(totalLimitInput.replace(/,/g, ''));
    if (!isNaN(val) && val >= 0) {
      saveBudget(toMinorUnits(val, profile.default_currency));
      setIsTotalBudgetModalOpen(false);
    }
  };

  const handleSaveCategoryLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(catLimitInput.replace(/,/g, ''));
    if (selectedCatId && !isNaN(val) && val >= 0) {
      saveBudgetCategoryLimit(selectedCatId, toMinorUnits(val, profile.default_currency));
      setIsCategoryLimitModalOpen(false);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      type: newCatType,
      icon: 'Tag',
      color: newCatColor,
      is_essential: newCatIsEssential,
      is_archived: false,
    });

    setNewCatName('');
    setIsNewCategoryModalOpen(false);
  };

  const openSetCatModal = (catId: string, currentLimitMinor: number) => {
    setSelectedCatId(catId);
    setCatLimitInput(currentLimitMinor > 0 ? String(fromMinorUnits(currentLimitMinor, profile.default_currency)) : '');
    setIsCategoryLimitModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            My Student Spending Plan 📋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Spend money based on plans! Set clear limits for lunch, snacks, bus, and fun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/calculator">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-300 gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>50/30/20 Plan Generator</span>
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => {
              setTotalLimitInput(
                totalLimitMinor > 0 ? String(fromMinorUnits(totalLimitMinor, profile.default_currency)) : ''
              );
              setIsTotalBudgetModalOpen(true);
            }}
            className="text-xs font-bold gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Set Spending Limit</span>
          </Button>
        </div>
      </div>

      {/* Student Friendly Educational Banner */}
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Student Smart Rule:</span> A spending plan is your personal roadmap! It tells your money where to go instead of wondering where it went. When a category bar turns yellow or red, hit the brakes on extra snacks so you don't run out of bus fare! 🚌
        </div>
      </div>

      {/* Overall Budget Overview Card */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Overall Period Budget
              </span>
              <Badge status={overallPercent >= 100 ? 'exceeded' : overallPercent >= 70 ? 'warning' : 'normal'}>
                {totalLimitMinor > 0 ? `${overallPercent}% Spent` : 'Uncapped'}
              </Badge>
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {totalLimitMinor > 0 ? formatCurrency(totalLimitMinor, profile.default_currency) : 'No Cap Set'}
              </span>
              {totalLimitMinor > 0 && (
                <span className="text-sm font-medium text-slate-500">
                  Remaining: {formatCurrency(totalRemainingMinor, profile.default_currency)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTotalLimitInput(
                  totalLimitMinor > 0 ? String(fromMinorUnits(totalLimitMinor, profile.default_currency)) : ''
                );
                setIsTotalBudgetModalOpen(true);
              }}
              className="text-xs"
            >
              Adjust Limit
            </Button>
          </div>
        </div>

        {totalLimitMinor > 0 && (
          <div className="pt-4 space-y-1.5">
            <Progress
              value={overallPercent}
              status={overallPercent >= 100 ? 'exceeded' : overallPercent >= 70 ? 'warning' : 'normal'}
              aria-label="Overall budget progress"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Actual Spent: {formatCurrency(totalSpentMinor, profile.default_currency)}</span>
              <span>{daysRemaining} days left in period</span>
            </div>
          </div>
        )}
      </Card>

      {/* Category Budgets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Category Allocations & Health Indicators
          </h2>
          <span className="text-xs text-slate-500">
            Threshold warnings at 70%, 90%, and 100%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories
            .filter((c) => c.type === 'expense')
            .map((cat) => {
              const analysis = categoryAnalysis.find((a) => a.categoryId === cat.id);
              const limitMinor =
                budgetCategories.find((bc) => bc.category_id === cat.id)?.limit_minor || 0;
              const spentMinor = analysis?.spentMinor || 0;
              const percent = limitMinor > 0 ? Math.round((spentMinor / limitMinor) * 100) : 0;
              const remainingMinor = limitMinor - spentMinor;

              let status: 'normal' | 'warning' | 'critical' | 'exceeded' = 'normal';
              if (percent >= 100) status = 'exceeded';
              else if (percent >= 90) status = 'critical';
              else if (percent >= 70) status = 'warning';

              return (
                <Card key={cat.id} className="p-4 space-y-3 hover:border-slate-300 dark:hover:border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {cat.name}
                        </h3>
                        {cat.is_essential && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded dark:bg-amber-950/40 font-medium">
                            Essential Expense
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openSetCatModal(cat.id, limitMinor)}
                      className="text-xs h-7 px-2 text-slate-500 hover:text-slate-800"
                    >
                      {limitMinor > 0 ? 'Edit Limit' : 'Set Limit'}
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Spent:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(spentMinor, profile.default_currency)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Limit:</span>
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        {limitMinor > 0 ? formatCurrency(limitMinor, profile.default_currency) : 'Uncapped'}
                      </span>
                    </div>

                    {limitMinor > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Remaining:</span>
                        <span
                          className={`font-semibold ${
                            remainingMinor < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {formatCurrency(remainingMinor, profile.default_currency)}
                        </span>
                      </div>
                    )}
                  </div>

                  {limitMinor > 0 ? (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <Badge status={status}>{percent}% used</Badge>
                        <span className="text-slate-400 text-[10px]">
                          {remainingMinor >= 0 ? `${daysRemaining} days left` : 'Limit exceeded'}
                        </span>
                      </div>
                      <Progress value={percent} status={status} aria-label={`${cat.name} limit progress`} />
                    </div>
                  ) : (
                    <div className="rounded-md bg-slate-50 p-2 text-center text-[11px] text-slate-400 dark:bg-slate-800/40">
                      No budget ceiling configured
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      </div>

      {/* Set Overall Budget Modal */}
      <Modal
        isOpen={isTotalBudgetModalOpen}
        onClose={() => setIsTotalBudgetModalOpen(false)}
        title="Set Overall Period Budget"
        description="Define your total spending ceiling for this tracking period."
      >
        <form onSubmit={handleSaveTotalBudget} className="space-y-4">
          <Input
            label={`Total Budget Amount (${currSymbol})`}
            type="number"
            step="any"
            min="0"
            required
            value={totalLimitInput}
            onChange={(e) => setTotalLimitInput(e.target.value)}
            placeholder="e.g. 450000"
            helperText="Amounts are stored with minor unit precision."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsTotalBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Budget</Button>
          </div>
        </form>
      </Modal>

      {/* Set Category Limit Modal */}
      <Modal
        isOpen={isCategoryLimitModalOpen}
        onClose={() => setIsCategoryLimitModalOpen(false)}
        title="Set Category Spending Limit"
        description="Allocate an allowance for this category during the active period."
      >
        <form onSubmit={handleSaveCategoryLimit} className="space-y-4">
          <Input
            label={`Category Limit Amount (${currSymbol})`}
            type="number"
            step="any"
            min="0"
            required
            value={catLimitInput}
            onChange={(e) => setCatLimitInput(e.target.value)}
            placeholder="e.g. 90000"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCategoryLimitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Allocation</Button>
          </div>
        </form>
      </Modal>

      {/* New Category Modal */}
      <Modal
        isOpen={isNewCategoryModalOpen}
        onClose={() => setIsNewCategoryModalOpen(false)}
        title="Create Custom Category"
        description="Add a personalized category to customize your tracking."
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Gym & Fitness, Software Subs"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="catType"
                  checked={newCatType === 'expense'}
                  onChange={() => setNewCatType('expense')}
                />
                Expense
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="catType"
                  checked={newCatType === 'income'}
                  onChange={() => setNewCatType('income')}
                />
                Income
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Badge Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="h-9 w-14 rounded cursor-pointer border border-slate-300 dark:border-slate-700"
              />
              <span className="text-xs text-slate-500">{newCatColor}</span>
            </div>
          </div>

          {newCatType === 'expense' && (
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newCatIsEssential}
                onChange={(e) => setNewCatIsEssential(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Mark as Essential (e.g. rent, food, health, utility)
            </label>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsNewCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Category</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
