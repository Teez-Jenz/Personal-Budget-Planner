'use client';

import React, { useState, useMemo } from 'react';
import { useBudgetPlanner } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TransactionModal } from '@/components/transactions/transaction-modal';
import { Transaction, TransactionType } from '@/lib/types';
import { formatCurrency } from '@/lib/currency';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';

export default function TransactionsPage() {
  const { transactions, categories, profile, deleteTransaction, exportCsv } = useBudgetPlanner();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Filters and Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Category map for fast lookup
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Filtered and Sorted list
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      // Category filter
      if (categoryFilter !== 'all' && tx.category_id !== categoryFilter) return false;
      // Search query (payee, note, category name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = categoryMap.get(tx.category_id)?.name?.toLowerCase() || '';
        const payee = (tx.merchant_or_payee || '').toLowerCase();
        const note = (tx.note || '').toLowerCase();
        if (!catName.includes(q) && !payee.includes(q) && !note.includes(q)) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'date-desc') return b.transaction_date.localeCompare(a.transaction_date);
      if (sortOrder === 'date-asc') return a.transaction_date.localeCompare(b.transaction_date);
      if (sortOrder === 'amount-desc') return b.amount_minor - a.amount_minor;
      if (sortOrder === 'amount-asc') return a.amount_minor - b.amount_minor;
      return 0;
    });

    return result;
  }, [transactions, typeFilter, categoryFilter, searchQuery, sortOrder, categoryMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const confirmDelete = () => {
    if (deletingTx) {
      deleteTransaction(deletingTx.id);
      setDeletingTx(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Incomes & Expenses Activity 💵
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track all your pocket money, gifts, tuck shop snacks, school bus fares, and school supplies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 text-xs">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5 text-xs shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Record Transaction</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search payee, note..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              aria-label="Filter by type"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Transfers Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by category"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              aria-label="Sort transactions"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden p-0">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium">No transactions match your search or filter criteria.</p>
            <p className="mt-1 text-xs text-slate-400">Try resetting filters or record a new transaction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Payee / Merchant</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTransactions.map((tx) => {
                  const cat = categoryMap.get(tx.category_id);
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {tx.transaction_date}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isExpense
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              : isIncome
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                          }`}
                        >
                          {isExpense && <ArrowDownRight className="h-3 w-3" />}
                          {isIncome && <ArrowUpRight className="h-3 w-3" />}
                          {tx.type === 'transfer' && <ArrowRightLeft className="h-3 w-3" />}
                          {tx.type}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || '#94a3b8' }}
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {cat?.name || 'Uncategorized'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div className="truncate max-w-[200px]">
                          {tx.merchant_or_payee || '—'}
                          {tx.note && <span className="block text-[11px] text-slate-400 truncate">{tx.note}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }
                        >
                          {isExpense ? '-' : isIncome ? '+' : ''}
                          {formatCurrency(tx.amount_minor, tx.currency)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTx(tx)}
                            className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            aria-label={`Edit transaction from ${tx.transaction_date}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingTx(tx)}
                            className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                            aria-label={`Delete transaction from ${tx.transaction_date}`}
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} entries
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 text-xs"
              >
                Previous
              </Button>
              <span className="px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <TransactionModal
        isOpen={isCreateOpen || editingTx !== null}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTx(null);
        }}
        editTransaction={editingTx}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingTx !== null}
        onClose={() => setDeletingTx(null)}
        title="Confirm Deletion"
        description="Are you sure you want to delete this transaction record? This action will update all related period budgets and totals."
      >
        <div className="space-y-4">
          {deletingTx && (
            <div className="rounded-lg bg-rose-50/50 p-3 text-xs text-rose-900 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200">
              <p className="font-semibold">
                {deletingTx.type.toUpperCase()}: {formatCurrency(deletingTx.amount_minor, deletingTx.currency)}
              </p>
              <p className="mt-1">
                Date: {deletingTx.transaction_date} • {deletingTx.merchant_or_payee || 'No payee specified'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeletingTx(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Transaction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
