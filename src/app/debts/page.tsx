'use client';

import React, { useState } from 'react';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, fromMinorUnits, toMinorUnits, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { Debt, DebtStatus } from '@/lib/types';
import {
  CreditCard,
  Plus,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  Trash2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export default function DebtsPage() {
  const { debts, addDebt, recordDebtPayment, deleteDebt, profile } = useBudgetPlanner();

  const [isNewDebtModalOpen, setIsNewDebtModalOpen] = useState(false);
  const [paymentModalDebt, setPaymentModalDebt] = useState<Debt | null>(null);

  // New Debt Form
  const [debtName, setDebtName] = useState('');
  const [startBalanceStr, setStartBalanceStr] = useState('');
  const [minPaymentStr, setMinPaymentStr] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [dueDate, setDueDate] = useState('');

  // Payment Form
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const currSymbol = SUPPORTED_CURRENCIES[profile.default_currency]?.symbol || '₦';

  const totalOutstandingMinor = debts
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + d.current_balance_minor, 0);

  const totalMonthlyMinimumsMinor = debts
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + d.minimum_payment_minor, 0);

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBal = parseFloat(startBalanceStr.replace(/,/g, ''));
    if (isNaN(cleanBal) || cleanBal <= 0) return;

    const cleanMin = parseFloat(minPaymentStr.replace(/,/g, '')) || 0;
    const rate = parseFloat(interestRate) || 0;

    addDebt({
      name: debtName.trim(),
      starting_balance_minor: toMinorUnits(cleanBal, profile.default_currency),
      minimum_payment_minor: toMinorUnits(cleanMin, profile.default_currency),
      interest_rate_percentage: rate,
      due_date: dueDate || null,
      currency: profile.default_currency,
      status: 'active',
    });

    setDebtName('');
    setStartBalanceStr('');
    setMinPaymentStr('');
    setInterestRate('0');
    setDueDate('');
    setIsNewDebtModalOpen(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalDebt) return;

    const cleanPay = parseFloat(paymentAmountStr.replace(/,/g, ''));
    if (isNaN(cleanPay) || cleanPay <= 0) return;

    recordDebtPayment(
      paymentModalDebt.id,
      toMinorUnits(cleanPay, profile.default_currency),
      paymentNote.trim() || undefined
    );

    setPaymentModalDebt(null);
    setPaymentAmountStr('');
    setPaymentNote('');
  };

  // Safe estimate calculation helper
  const estimatePayoffMonths = (debt: Debt) => {
    if (debt.minimum_payment_minor <= 0) return 'Undetermined (Set minimum payment)';
    const months = Math.ceil(debt.current_balance_minor / debt.minimum_payment_minor);
    return `~${months} month${months > 1 ? 's' : ''} at current minimum rate`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Practical Debt Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Clear tracking of balances, due dates, and minimum payments without predatory loan promotions.
          </p>
        </div>

        <Button onClick={() => setIsNewDebtModalOpen(true)} size="sm" className="gap-1.5 text-xs shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Add Debt Obligation</span>
        </Button>
      </div>

      {/* Mandatory Non-Predatory & Advisory Disclaimer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Ethical Debt Tracking Policy
          </p>
          <p className="leading-relaxed">
            FinPlan never recommends taking new loans, offers refinancing ads, or guarantees debt elimination. Payoff projections are mathematical estimates based on your entered parameters and do not substitute for professional licensed financial advice.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-xs uppercase font-semibold text-slate-500">
              Total Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(totalOutstandingMinor, profile.default_currency)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Across {debts.filter((d) => d.status === 'active').length} active obligations</p>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-xs uppercase font-semibold text-slate-500">
              Total Minimum Monthly Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totalMonthlyMinimumsMinor, profile.default_currency)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Required minimum cash outflow per period</p>
          </CardContent>
        </Card>
      </div>

      {/* Debts List */}
      {debts.length === 0 ? (
        <Card className="py-12 text-center text-slate-400">
          <CreditCard className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600 mb-2" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">No Debts Tracked</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            You currently have zero debt records. If you have personal loans or equipment financing, add them to stay organized.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {debts.map((debt) => {
            const isPaidOff = debt.current_balance_minor === 0 || debt.status === 'paid_off';
            const repaidMinor = Math.max(0, debt.starting_balance_minor - debt.current_balance_minor);
            const repaidPercent = Math.min(
              100,
              Math.round((repaidMinor / debt.starting_balance_minor) * 100)
            );

            return (
              <Card key={debt.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                          {debt.name}
                        </h3>
                        <Badge variant={isPaidOff ? 'success' : 'default'}>
                          {isPaidOff ? 'Paid Off' : 'Active'}
                        </Badge>
                      </div>
                      {debt.due_date && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Next Due: {debt.due_date}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDebt(debt.id)}
                      className="h-7 w-7 text-slate-400 hover:text-rose-600"
                      aria-label={`Delete ${debt.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Remaining Balance</span>
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                          {formatCurrency(debt.current_balance_minor, debt.currency)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Min Payment</span>
                        <span className="text-sm font-semibold text-amber-600">
                          {formatCurrency(debt.minimum_payment_minor, debt.currency)}
                        </span>
                      </div>
                    </div>

                    <Progress value={repaidPercent} aria-label={`${debt.name} repayment progress`} />

                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span>{repaidPercent}% repaid</span>
                      <span>Starting: {formatCurrency(debt.starting_balance_minor, debt.currency)}</span>
                    </div>

                    {!isPaidOff && (
                      <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                        <p>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Estimated Horizon: </span>
                          {estimatePayoffMonths(debt)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Assumes regular minimum monthly payments without additional interest compounding or fees.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!isPaidOff && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setPaymentModalDebt(debt);
                        setPaymentAmountStr(String(fromMinorUnits(debt.minimum_payment_minor, debt.currency)));
                      }}
                      className="w-full text-xs gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Record Repayment</span>
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Debt Modal */}
      <Modal
        isOpen={isNewDebtModalOpen}
        onClose={() => setIsNewDebtModalOpen(false)}
        title="Add Debt Obligation"
        description="Record a loan or financing balance to track repayment progress."
      >
        <form onSubmit={handleCreateDebt} className="space-y-4">
          <Input
            label="Obligation Name"
            placeholder="e.g. Work Laptop Financing, Cooperative Loan"
            value={debtName}
            onChange={(e) => setDebtName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`Starting Balance (${currSymbol})`}
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="e.g. 250000"
              value={startBalanceStr}
              onChange={(e) => setStartBalanceStr(e.target.value)}
            />
            <Input
              label={`Minimum Payment (${currSymbol})`}
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 25000"
              value={minPaymentStr}
              onChange={(e) => setMinPaymentStr(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Interest Rate (%) (Optional)"
              type="number"
              step="0.01"
              min="0"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
            <Input
              label="Next Due Date (Optional)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsNewDebtModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Track Debt</Button>
          </div>
        </form>
      </Modal>

      {/* Record Repayment Modal */}
      <Modal
        isOpen={paymentModalDebt !== null}
        onClose={() => setPaymentModalDebt(null)}
        title={`Record Payment for ${paymentModalDebt?.name}`}
        description="Reduces the outstanding debt balance and creates a ledger expense record."
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input
            label={`Payment Amount (${currSymbol})`}
            type="number"
            step="any"
            min="0.01"
            required
            placeholder="0.00"
            value={paymentAmountStr}
            onChange={(e) => setPaymentAmountStr(e.target.value)}
          />

          <Input
            label="Payment Note (Optional)"
            placeholder="e.g. October installment via bank transfer"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setPaymentModalDebt(null)}>
              Cancel
            </Button>
            <Button type="submit">Submit Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
