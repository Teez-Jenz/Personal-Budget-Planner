'use client';

import React, { useState } from 'react';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, fromMinorUnits, toMinorUnits, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { formatDateIso } from '@/lib/budget-engine';
import { RecurringBill, BillFrequency, BillStatus } from '@/lib/types';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  BellRing,
  Info,
} from 'lucide-react';

export default function RecurringBillsPage() {
  const {
    recurringBills,
    addBill,
    updateBill,
    deleteBill,
    confirmBillPayment,
    categories,
    profile,
  } = useBudgetPlanner();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [confirmingBill, setConfirmingBill] = useState<RecurringBill | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(formatDateIso(new Date()));
  const [reminderDays, setReminderDays] = useState(3);
  const [error, setError] = useState('');

  const todayStr = formatDateIso(new Date());
  const today = new Date(todayStr);

  const openCreateModal = () => {
    setEditingBill(null);
    setName('');
    setAmountStr('');
    setFrequency('monthly');
    setNextDueDate(formatDateIso(new Date(Date.now() + 7 * 24 * 3600 * 1000)));
    setReminderDays(3);
    const expCat = categories.find((c) => c.type === 'expense');
    setCategoryId(expCat ? expCat.id : '');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (bill: RecurringBill) => {
    setEditingBill(bill);
    setName(bill.name);
    setAmountStr(String(fromMinorUnits(bill.amount_minor, bill.currency)));
    setCategoryId(bill.category_id);
    setFrequency(bill.frequency);
    setNextDueDate(bill.next_due_date);
    setReminderDays(bill.reminder_days_before);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Please enter a valid bill amount');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a bill name');
      return;
    }

    const minorAmount = toMinorUnits(cleanAmount, profile.default_currency);

    if (editingBill) {
      updateBill(editingBill.id, {
        name: name.trim(),
        amount_minor: minorAmount,
        category_id: categoryId,
        frequency,
        next_due_date: nextDueDate,
        reminder_days_before: reminderDays,
      });
    } else {
      addBill({
        name: name.trim(),
        amount_minor: minorAmount,
        currency: profile.default_currency,
        category_id: categoryId,
        frequency,
        next_due_date: nextDueDate,
        reminder_days_before: reminderDays,
        status: 'active',
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmPay = () => {
    if (confirmingBill) {
      confirmBillPayment(confirmingBill.id);
      setConfirmingBill(null);
    }
  };

  const getBillDueStatus = (bill: RecurringBill) => {
    const due = new Date(bill.next_due_date);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', label: `${Math.abs(diffDays)}d Overdue`, badgeVariant: 'critical' as const };
    }
    if (diffDays === 0) {
      return { status: 'due_today', label: 'Due Today', badgeVariant: 'warning' as const };
    }
    if (diffDays <= bill.reminder_days_before) {
      return { status: 'due_soon', label: `Due in ${diffDays}d`, badgeVariant: 'warning' as const };
    }
    return { status: 'upcoming', label: `Due in ${diffDays}d`, badgeVariant: 'secondary' as const };
  };

  const currSymbol = SUPPORTED_CURRENCIES[profile.default_currency]?.symbol || '₦';

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Recurring Bills & Subscriptions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Explicit payment confirmation prevents phantom entries and missed due dates.
          </p>
        </div>

        <Button onClick={openCreateModal} size="sm" className="gap-1.5 text-xs shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Add Recurring Bill</span>
        </Button>
      </div>

      {/* Reminder Architecture Disclosure */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <BellRing className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            In-App Reminder Guarantee
          </p>
          <p className="leading-relaxed">
            All bills show proactive in-app alert badges and suggested next steps with zero external paid APIs required. External SMS/Email triggers can be hooked via Supabase webhooks if desired.
          </p>
        </div>
      </div>

      {/* Bills List Card */}
      <Card className="overflow-hidden p-0">
        {recurringBills.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium">No recurring bills or subscriptions configured.</p>
            <p className="mt-1 text-xs text-slate-400">Add bills like rent, internet, electricity, or software retainers.</p>
            <Button size="sm" onClick={openCreateModal} className="mt-4 text-xs">
              Add First Bill
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Bill Name</th>
                  <th className="py-3 px-4 font-semibold">Frequency</th>
                  <th className="py-3 px-4 font-semibold">Next Due Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-center">Payment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recurringBills.map((bill) => {
                  const dueInfo = getBillDueStatus(bill);
                  const cat = categories.find((c) => c.id === bill.category_id);

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <div>
                          <span>{bill.name}</span>
                          <span className="block text-[11px] text-slate-400">{cat?.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize">
                        {bill.frequency}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {bill.next_due_date}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={dueInfo.badgeVariant}>{dueInfo.label}</Badge>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(bill.amount_minor, bill.currency)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setConfirmingBill(bill)}
                            className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Confirm Paid</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditModal(bill)}
                            className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            aria-label={`Edit ${bill.name}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteBill(bill.id)}
                            className="h-7 w-7 text-slate-400 hover:text-rose-600"
                            aria-label={`Delete ${bill.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Bill Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBill ? 'Edit Recurring Bill' : 'Add Recurring Bill'}
        description="Schedule a bill so it prompts for confirmation when due."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Bill Name"
            placeholder="e.g. Spectranet Internet, Ikeja Electric, Rent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount ({currSymbol})
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {categories
                .filter((c) => c.type === 'expense')
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BillFrequency)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly (14 days)</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <Input
              label="Next Due Date"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="In-App Reminder Days Before Due"
            type="number"
            min="1"
            max="30"
            value={reminderDays}
            onChange={(e) => setReminderDays(parseInt(e.target.value, 10) || 3)}
            helperText="Suggested Next Steps will alert you this many days ahead."
          />

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingBill ? 'Save Changes' : 'Create Bill'}</Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal — Never Silently Mark Paid */}
      <Modal
        isOpen={confirmingBill !== null}
        onClose={() => setConfirmingBill(null)}
        title="Confirm Bill Payment"
        description="Verify this payment before recording it to your ledger."
      >
        <div className="space-y-4">
          {confirmingBill && (
            <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200 text-xs text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-semibold text-sm">
                {confirmingBill.name}: {formatCurrency(confirmingBill.amount_minor, confirmingBill.currency)}
              </p>
              <p>Due Date: {confirmingBill.next_due_date} ({confirmingBill.frequency})</p>
              <p className="pt-1 text-[11px] text-emerald-800 dark:text-emerald-300">
                Confirming will:
                <br />• Record a genuine Expense transaction dated today.
                <br />• Advance the next due date by 1 {confirmingBill.frequency.replace('ly', '')}.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfirmingBill(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmPay}>
              Confirm Payment Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
