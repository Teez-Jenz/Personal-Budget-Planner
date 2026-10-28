'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, fromMinorUnits, toMinorUnits, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { formatDateIso } from '@/lib/budget-engine';
import { SavingsGoal, GoalStatus } from '@/lib/types';
import {
  Target,
  Plus,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  Info,
  Trash2,
} from 'lucide-react';

export default function SavingsPage() {
  const {
    savingsGoals,
    savingsMovements,
    addSavingsGoal,
    recordSavingsMovement,
    deleteSavingsGoal,
    profile,
  } = useBudgetPlanner();

  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [movementModalGoal, setMovementModalGoal] = useState<SavingsGoal | null>(null);

  // New Goal Form
  const [goalName, setGoalName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Movement Form
  const [movementAmountStr, setMovementAmountStr] = useState('');
  const [movementType, setMovementType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [movementNote, setMovementNote] = useState('');

  const currSymbol = SUPPORTED_CURRENCIES[profile.default_currency]?.symbol || '₦';

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(targetAmountStr.replace(/,/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    addSavingsGoal({
      name: goalName.trim(),
      target_amount_minor: toMinorUnits(cleanAmount, profile.default_currency),
      currency: profile.default_currency,
      target_date: targetDate || null,
      status: 'in_progress',
    });

    setGoalName('');
    setTargetAmountStr('');
    setTargetDate('');
    setIsNewGoalModalOpen(false);
  };

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModalGoal) return;
    const cleanAmount = parseFloat(movementAmountStr.replace(/,/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    recordSavingsMovement(
      movementModalGoal.id,
      toMinorUnits(cleanAmount, profile.default_currency),
      movementType,
      movementNote.trim() || undefined
    );

    setMovementModalGoal(null);
    setMovementAmountStr('');
    setMovementNote('');
  };

  // Calculate suggested periodic contribution for a goal
  const calculateSuggestedMonthly = (goal: SavingsGoal) => {
    if (!goal.target_date) return null;
    const today = new Date();
    const end = new Date(goal.target_date);
    const diffMonths = Math.max(
      1,
      (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth())
    );
    const remainingMinor = Math.max(0, goal.target_amount_minor - goal.current_amount_minor);
    const monthlyMinor = Math.round(remainingMinor / diffMonths);
    return {
      monthlyMinor,
      monthsLeft: diffMonths,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            My Piggy Bank & Savings Goals 🐷
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Save up for things you love: new shoes, gaming gear, school trips, and gadgets!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/calculator">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-300">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Savings Timeline Calculator</span>
            </Button>
          </Link>
          <Button onClick={() => setIsNewGoalModalOpen(true)} size="sm" className="gap-1.5 text-xs font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4" />
            <span>New Savings Goal</span>
          </Button>
        </div>
      </div>

      {/* Student Piggy Bank Tip */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Student Secret:</span> Whenever you get pocket money or cash gifts from relatives, deposit a portion straight into your Piggy Bank before spending. Reaching 100% on a goal you worked for is the best feeling in the world! 🏆
        </div>
      </div>

      {/* Goals Grid */}
      {savingsGoals.length === 0 ? (
        <Card className="py-12 text-center text-slate-400 rounded-2xl border-dashed border-2">
          <PiggyBank className="mx-auto h-12 w-12 text-amber-400 mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">No Piggy Bank Goals Yet</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            What do you really want to buy? A cool pair of sneakers, a phone, gaming headphones, or saving for an end-of-term trip?
          </p>
          <Button size="sm" onClick={() => setIsNewGoalModalOpen(true)} className="mt-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">
            Set Your First Piggy Bank Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savingsGoals.map((goal) => {
            const percent = Math.min(
              100,
              Math.round((goal.current_amount_minor / goal.target_amount_minor) * 100)
            );
            const remainingMinor = Math.max(0, goal.target_amount_minor - goal.current_amount_minor);
            const suggestion = calculateSuggestedMonthly(goal);

            return (
              <Card key={goal.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                        {goal.name}
                      </h3>
                      {goal.target_date && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Target: {goal.target_date}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSavingsGoal(goal.id)}
                      className="h-7 w-7 text-slate-400 hover:text-rose-600"
                      aria-label={`Delete ${goal.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(goal.current_amount_minor, goal.currency)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        of {formatCurrency(goal.target_amount_minor, goal.currency)}
                      </span>
                    </div>

                    <Progress value={percent} aria-label={`${goal.name} percentage`} />

                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span>{percent}% saved</span>
                      <span>Remaining: {formatCurrency(remainingMinor, goal.currency)}</span>
                    </div>
                  </div>

                  {suggestion && remainingMinor > 0 && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Suggested Plan: </span>
                      Save {formatCurrency(suggestion.monthlyMinor, goal.currency)}/month for {suggestion.monthsLeft} month{suggestion.monthsLeft > 1 ? 's' : ''} to reach target.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setMovementModalGoal(goal);
                      setMovementType('deposit');
                      setMovementAmountStr('');
                    }}
                    className="flex-1 text-xs gap-1"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>Contribute</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMovementModalGoal(goal);
                      setMovementType('withdrawal');
                      setMovementAmountStr('');
                    }}
                    className="flex-1 text-xs gap-1"
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    <span>Withdraw</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal
        isOpen={isNewGoalModalOpen}
        onClose={() => setIsNewGoalModalOpen(false)}
        title="Create Savings Goal"
        description="Establish an explicit reserve milestone."
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. 3-Month Emergency Fund, Rent Advance"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            required
          />

          <Input
            label={`Target Amount (${currSymbol})`}
            type="number"
            step="any"
            min="0.01"
            required
            placeholder="e.g. 600000"
            value={targetAmountStr}
            onChange={(e) => setTargetAmountStr(e.target.value)}
          />

          <Input
            label="Target Date (Optional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            helperText="Allows calculating your suggested monthly contribution."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsNewGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Goal</Button>
          </div>
        </form>
      </Modal>

      {/* Movement Modal (Deposit or Withdrawal) */}
      <Modal
        isOpen={movementModalGoal !== null}
        onClose={() => setMovementModalGoal(null)}
        title={`${movementType === 'deposit' ? 'Contribute to' : 'Withdraw from'} ${movementModalGoal?.name}`}
        description="Records an explicit ledger movement without double-counting expenses."
      >
        <form onSubmit={handleRecordMovement} className="space-y-4">
          <Input
            label={`Amount (${currSymbol})`}
            type="number"
            step="any"
            min="0.01"
            required
            placeholder="0.00"
            value={movementAmountStr}
            onChange={(e) => setMovementAmountStr(e.target.value)}
          />

          <Input
            label="Note (Optional)"
            placeholder="e.g. Monthly transfer, bonus allocation"
            value={movementNote}
            onChange={(e) => setMovementNote(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setMovementModalGoal(null)}>
              Cancel
            </Button>
            <Button type="submit">
              {movementType === 'deposit' ? 'Record Deposit' : 'Record Withdrawal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
