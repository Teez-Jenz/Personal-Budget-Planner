'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBudgetPlanner } from '@/lib/store';
import { Transaction, TransactionType } from '@/lib/types';
import { toMinorUnits, fromMinorUnits, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { formatDateIso } from '@/lib/budget-engine';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, editTransaction }: TransactionModalProps) {
  const { categories, addTransaction, updateTransaction, profile } = useBudgetPlanner();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(formatDateIso(new Date()));
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Filter categories by selected type
  const availableCategories = categories.filter((c) => {
    if (type === 'transfer') return true;
    return c.type === type;
  });

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmountStr(String(fromMinorUnits(editTransaction.amount_minor, editTransaction.currency)));
      setCategoryId(editTransaction.category_id);
      setDate(editTransaction.transaction_date);
      setPayee(editTransaction.merchant_or_payee || '');
      setNote(editTransaction.note || '');
    } else {
      setType('expense');
      setAmountStr('');
      setDate(formatDateIso(new Date()));
      setPayee('');
      setNote('');
      const defaultExpCat = categories.find((c) => c.type === 'expense');
      setCategoryId(defaultExpCat ? defaultExpCat.id : '');
    }
    setError('');
  }, [editTransaction, isOpen, categories]);

  // When type changes, ensure valid category is selected
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const firstCat = categories.find((c) => newType === 'transfer' || c.type === newType);
    if (firstCat) setCategoryId(firstCat.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    const minorAmount = toMinorUnits(cleanAmount, profile.default_currency);

    if (editTransaction) {
      updateTransaction(editTransaction.id, {
        type,
        amount_minor: minorAmount,
        category_id: categoryId,
        transaction_date: date,
        merchant_or_payee: payee.trim() || null,
        note: note.trim() || null,
      });
    } else {
      addTransaction({
        type,
        amount_minor: minorAmount,
        category_id: categoryId,
        currency: profile.default_currency,
        transaction_date: date,
        merchant_or_payee: payee.trim() || null,
        note: note.trim() || null,
        source: 'manual',
      });
    }

    onClose();
  };

  const currSymbol = SUPPORTED_CURRENCIES[profile.default_currency]?.symbol || '₦';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTransaction ? 'Edit Money Entry' : 'Record Pocket Money or Expense'}
      description="Log your pocket money allowance, cafeteria lunch, snacks, bus fare, or school supplies."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            What kind of entry is this?
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              🛒 Expense (Money Out)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              💵 Income (Allowance / Gift)
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label htmlFor="tx-amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Amount ({currSymbol})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
              {currSymbol}
            </span>
            <input
              id="tx-amount"
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                if (error) setError('');
              }}
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>

        {/* Category Dropdown */}
        <div>
          <label htmlFor="tx-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Category
          </label>
          <select
            id="tx-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} {cat.is_essential ? '★' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Payee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="tx-date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            id="tx-payee"
            label="Payee / Merchant (Optional)"
            placeholder="e.g. Grocery Store, Client"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
          />
        </div>

        {/* Note */}
        <Input
          id="tx-note"
          label="Note (Optional)"
          placeholder="Additional context..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editTransaction ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
