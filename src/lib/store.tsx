'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  UserProfile,
  Transaction,
  Category,
  Budget,
  BudgetCategory,
  RecurringBill,
  SavingsGoal,
  SavingsMovement,
  Debt,
  DebtPayment,
  IrregularIncomePlan,
  CurrencyCode,
} from './types';
import { SYSTEM_CATEGORIES } from './constants';
import { DEFAULT_CURRENCY, safeAdd, safeSubtract } from './currency';
import { getPeriodDateRange, formatDateIso } from './budget-engine';

interface BudgetPlannerContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'user_id'>) => void;
  deleteCategory: (id: string) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  activeBudget: Budget | null;
  budgetCategories: BudgetCategory[];
  saveBudget: (limitMinor: number, name?: string) => void;
  saveBudgetCategoryLimit: (categoryId: string, limitMinor: number) => void;
  recurringBills: RecurringBill[];
  addBill: (bill: Omit<RecurringBill, 'id' | 'user_id' | 'created_at'>) => void;
  updateBill: (id: string, updates: Partial<RecurringBill>) => void;
  deleteBill: (id: string) => void;
  confirmBillPayment: (billId: string) => void;
  savingsGoals: SavingsGoal[];
  savingsMovements: SavingsMovement[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'current_amount_minor' | 'created_at'>) => void;
  recordSavingsMovement: (goalId: string, amountMinor: number, type: 'deposit' | 'withdrawal', note?: string) => void;
  deleteSavingsGoal: (id: string) => void;
  debts: Debt[];
  debtPayments: DebtPayment[];
  addDebt: (debt: Omit<Debt, 'id' | 'user_id' | 'current_balance_minor' | 'created_at'>) => void;
  recordDebtPayment: (debtId: string, amountMinor: number, note?: string) => void;
  deleteDebt: (id: string) => void;
  irregularPlan: IrregularIncomePlan | null;
  saveIrregularPlan: (conservativeMinor: number, essentialBufferMinor: number, notes?: string) => void;
  selectedPeriod: 'monthly' | 'weekly' | 'previous_month';
  setSelectedPeriod: (period: 'monthly' | 'weekly' | 'previous_month') => void;
  isLoaded: boolean;
  seedSampleData: () => void;
  clearAllData: () => void;
  exportCsv: () => void;
}

const BudgetPlannerContext = createContext<BudgetPlannerContextType | undefined>(undefined);

const STORAGE_KEY = 'personal_budget_planner_data_v1';

export const BudgetPlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'weekly' | 'previous_month'>('monthly');

  const [profile, setProfile] = useState<UserProfile>({
    id: 'user_local_default',
    display_name: 'Alex (Student)',
    default_currency: DEFAULT_CURRENCY,
    timezone: 'Africa/Lagos',
    budget_period: 'weekly',
    irregular_income_mode: false,
  });

  const [categories, setCategories] = useState<Category[]>(SYSTEM_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsMovements, setSavingsMovements] = useState<SavingsMovement[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [irregularPlan, setIrregularPlan] = useState<IrregularIncomePlan | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.activeBudget) setActiveBudget(parsed.activeBudget);
        if (parsed.budgetCategories) setBudgetCategories(parsed.budgetCategories);
        if (parsed.recurringBills) setRecurringBills(parsed.recurringBills);
        if (parsed.savingsGoals) setSavingsGoals(parsed.savingsGoals);
        if (parsed.savingsMovements) setSavingsMovements(parsed.savingsMovements);
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.debtPayments) setDebtPayments(parsed.debtPayments);
        if (parsed.irregularPlan) setIrregularPlan(parsed.irregularPlan);
      } else {
        // First run: setup initial default budget for current month
        const range = getPeriodDateRange('monthly');
        setActiveBudget({
          id: 'initial_budget',
          user_id: 'user_local_default',
          name: 'Monthly Spending Plan',
          period_type: 'monthly',
          period_start: range.start,
          period_end: range.end,
          total_limit_minor: 35000000, // ₦350,000.00
          currency: DEFAULT_CURRENCY,
          rollover_enabled: false,
        });
      }
    } catch (e) {
      console.error('Error loading stored budget data', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const payload = {
        profile,
        categories,
        transactions,
        activeBudget,
        budgetCategories,
        recurringBills,
        savingsGoals,
        savingsMovements,
        debts,
        debtPayments,
        irregularPlan,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error persisting budget data', e);
    }
  }, [
    isLoaded,
    profile,
    categories,
    transactions,
    activeBudget,
    budgetCategories,
    recurringBills,
    savingsGoals,
    savingsMovements,
    debts,
    debtPayments,
    irregularPlan,
  ]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const addCategory = (cat: Omit<Category, 'id' | 'user_id'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat_${Date.now()}`,
      user_id: profile.id,
      is_archived: false,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
    // Only custom categories can be deleted
    setCategories((prev) => prev.filter((c) => c.id !== id || c.user_id === null));
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: profile.id,
      created_at: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const saveBudget = (limitMinor: number, name = 'Monthly Spending Plan') => {
    const range = getPeriodDateRange(selectedPeriod);
    const updated: Budget = {
      id: activeBudget?.id || `budget_${Date.now()}`,
      user_id: profile.id,
      name,
      period_type: profile.budget_period,
      period_start: range.start,
      period_end: range.end,
      total_limit_minor: limitMinor,
      currency: profile.default_currency,
      rollover_enabled: activeBudget?.rollover_enabled ?? false,
    };
    setActiveBudget(updated);
  };

  const saveBudgetCategoryLimit = (categoryId: string, limitMinor: number) => {
    setBudgetCategories((prev) => {
      const existingIdx = prev.findIndex((bc) => bc.category_id === categoryId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], limit_minor: limitMinor };
        return copy;
      }
      return [
        ...prev,
        {
          id: `bc_${Date.now()}_${categoryId}`,
          budget_id: activeBudget?.id || 'default_budget',
          category_id: categoryId,
          limit_minor: limitMinor,
        },
      ];
    });
  };

  const addBill = (bill: Omit<RecurringBill, 'id' | 'user_id' | 'created_at'>) => {
    const newBill: RecurringBill = {
      ...bill,
      id: `bill_${Date.now()}`,
      user_id: profile.id,
      created_at: new Date().toISOString(),
    };
    setRecurringBills((prev) => [...prev, newBill]);
  };

  const updateBill = (id: string, updates: Partial<RecurringBill>) => {
    setRecurringBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b))
    );
  };

  const deleteBill = (id: string) => {
    setRecurringBills((prev) => prev.filter((b) => b.id !== id));
  };

  const confirmBillPayment = (billId: string) => {
    const bill = recurringBills.find((b) => b.id === billId);
    if (!bill) return;

    const todayStr = formatDateIso(new Date());

    // 1. Explicitly create expense transaction
    addTransaction({
      category_id: bill.category_id,
      type: 'expense',
      amount_minor: bill.amount_minor,
      currency: bill.currency,
      transaction_date: todayStr,
      note: `Recurring Bill Paid: ${bill.name}`,
      merchant_or_payee: bill.name,
      source: 'recurring',
    });

    // 2. Advance due date based on frequency
    const nextDue = new Date(bill.next_due_date);
    if (bill.frequency === 'weekly') {
      nextDue.setDate(nextDue.getDate() + 7);
    } else if (bill.frequency === 'biweekly') {
      nextDue.setDate(nextDue.getDate() + 14);
    } else if (bill.frequency === 'monthly') {
      nextDue.setMonth(nextDue.getMonth() + 1);
    } else if (bill.frequency === 'yearly') {
      nextDue.setFullYear(nextDue.getFullYear() + 1);
    }

    updateBill(billId, {
      next_due_date: formatDateIso(nextDue),
      last_paid_date: todayStr,
    });
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'current_amount_minor' | 'created_at'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal_${Date.now()}`,
      user_id: profile.id,
      current_amount_minor: 0,
      created_at: new Date().toISOString(),
    };
    setSavingsGoals((prev) => [...prev, newGoal]);
  };

  const recordSavingsMovement = (
    goalId: string,
    amountMinor: number,
    movementType: 'deposit' | 'withdrawal',
    note?: string
  ) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const movement: SavingsMovement = {
      id: `smov_${Date.now()}`,
      user_id: profile.id,
      goal_id: goalId,
      amount_minor: amountMinor,
      movement_type: movementType,
      movement_date: formatDateIso(new Date()),
      note: note || `${movementType === 'deposit' ? 'Contributed to' : 'Withdrawn from'} ${goal.name}`,
    };

    setSavingsMovements((prev) => [...prev, movement]);

    // Update goal current amount
    const newAmount =
      movementType === 'deposit'
        ? safeAdd(goal.current_amount_minor, amountMinor)
        : Math.max(0, safeSubtract(goal.current_amount_minor, amountMinor));

    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, current_amount_minor: newAmount } : g))
    );
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
    setSavingsMovements((prev) => prev.filter((m) => m.goal_id !== id));
  };

  const addDebt = (debt: Omit<Debt, 'id' | 'user_id' | 'current_balance_minor' | 'created_at'>) => {
    const newDebt: Debt = {
      ...debt,
      id: `debt_${Date.now()}`,
      user_id: profile.id,
      current_balance_minor: debt.starting_balance_minor,
      created_at: new Date().toISOString(),
    };
    setDebts((prev) => [...prev, newDebt]);
  };

  const recordDebtPayment = (debtId: string, amountMinor: number, note?: string) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const payment: DebtPayment = {
      id: `dpay_${Date.now()}`,
      user_id: profile.id,
      debt_id: debtId,
      amount_minor: amountMinor,
      payment_date: formatDateIso(new Date()),
      note: note || `Payment toward ${debt.name}`,
    };

    setDebtPayments((prev) => [...prev, payment]);

    const newBalance = Math.max(0, safeSubtract(debt.current_balance_minor, amountMinor));
    setDebts((prev) =>
      prev.map((d) =>
        d.id === debtId
          ? {
              ...d,
              current_balance_minor: newBalance,
              status: newBalance === 0 ? 'paid_off' : 'active',
            }
          : d
      )
    );

    // Also record transaction for debt repayment
    const debtCat = categories.find((c) => c.name.toLowerCase().includes('debt')) || categories[9];
    addTransaction({
      category_id: debtCat.id,
      type: 'expense',
      amount_minor: amountMinor,
      currency: debt.currency,
      transaction_date: formatDateIso(new Date()),
      note: `Debt Repayment: ${debt.name}`,
      merchant_or_payee: debt.name,
      source: 'manual',
    });
  };

  const deleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    setDebtPayments((prev) => prev.filter((p) => p.debt_id !== id));
  };

  const saveIrregularPlan = (conservativeMinor: number, essentialBufferMinor: number, notes?: string) => {
    const range = getPeriodDateRange(selectedPeriod);
    setIrregularPlan({
      id: `irr_${Date.now()}`,
      user_id: profile.id,
      period_start: range.start,
      period_end: range.end,
      conservative_estimate_minor: conservativeMinor,
      essential_buffer_minor: essentialBufferMinor,
      notes: notes || null,
      currency: profile.default_currency,
      created_at: new Date().toISOString(),
    });
  };

  const seedSampleData = () => {
    const range = getPeriodDateRange('monthly');
    const today = new Date();
    const curMonth = today.toISOString().slice(0, 7);

    // Realistic secondary school student budget plan
    const sampleBudget: Budget = {
      id: 'demo_budget_student',
      user_id: profile.id,
      name: 'Student Monthly Spending Plan',
      period_type: 'monthly',
      period_start: range.start,
      period_end: range.end,
      total_limit_minor: 2200000, // ₦22,000.00
      currency: profile.default_currency,
      rollover_enabled: false,
    };

    const sampleBudgetCategories: BudgetCategory[] = [
      { id: 'sbc_1', budget_id: 'demo_budget_student', category_id: SYSTEM_CATEGORIES[0].id, limit_minor: 600000 },  // Lunch ₦6k
      { id: 'sbc_2', budget_id: 'demo_budget_student', category_id: SYSTEM_CATEGORIES[1].id, limit_minor: 300000 },  // Snacks ₦3k
      { id: 'sbc_3', budget_id: 'demo_budget_student', category_id: SYSTEM_CATEGORIES[2].id, limit_minor: 450000 },  // Bus ₦4.5k
      { id: 'sbc_4', budget_id: 'demo_budget_student', category_id: SYSTEM_CATEGORIES[3].id, limit_minor: 250000 },  // Stationery ₦2.5k
      { id: 'sbc_5', budget_id: 'demo_budget_student', category_id: SYSTEM_CATEGORIES[4].id, limit_minor: 350000 },  // Gaming & Fun ₦3.5k
      { id: 'sbc_6', budget_id: 'demo_budget_student', category_id: SYSTEM_CATEGORIES[5].id, limit_minor: 250000 },  // Data ₦2.5k
    ];

    const sampleTxs: Transaction[] = [
      // Incomes
      {
        id: 'tx_s1',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[9].id, // Pocket Money / Allowance
        type: 'income',
        amount_minor: 1500000, // ₦15,000.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-01`,
        note: 'Monthly Pocket Money from Mum & Dad',
        source: 'manual',
      },
      {
        id: 'tx_s2',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[10].id, // Daily Lunch Money
        type: 'income',
        amount_minor: 500000, // ₦5,000.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-05`,
        note: 'Weekly Lunch Allowance Top-up',
        source: 'manual',
      },
      {
        id: 'tx_s3',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[11].id, // Birthday & Family Gifts
        type: 'income',
        amount_minor: 800000, // ₦8,000.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-10`,
        note: 'Birthday Cash Gift from Uncle David',
        source: 'manual',
      },
      {
        id: 'tx_s4',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[12].id, // Chores & Side Gigs
        type: 'income',
        amount_minor: 400000, // ₦4,000.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-14`,
        note: 'Helping neighbour wash cars & garden chores',
        source: 'manual',
      },
      // Expenses
      {
        id: 'tx_s5',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[0].id, // Lunch & Cafeteria
        type: 'expense',
        amount_minor: 140000, // ₦1,400.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-02`,
        note: 'School cafeteria hot lunch & water',
        merchant_or_payee: 'School Cafeteria',
        source: 'manual',
      },
      {
        id: 'tx_s6',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[1].id, // Snacks & Drinks
        type: 'expense',
        amount_minor: 60000, // ₦600.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-04`,
        note: 'After-school meat pie & fruit drink',
        merchant_or_payee: 'Tuck Shop',
        source: 'manual',
      },
      {
        id: 'tx_s7',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[2].id, // Bus & School Transport
        type: 'expense',
        amount_minor: 200000, // ₦2,000.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-06`,
        note: 'Weekly school bus pass',
        merchant_or_payee: 'Transit Authority',
        source: 'manual',
      },
      {
        id: 'tx_s8',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[3].id, // Stationery & Books
        type: 'expense',
        amount_minor: 120000, // ₦1,200.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-08`,
        note: 'Math notebook, pens & highlighter pack',
        merchant_or_payee: 'Campus Bookshop',
        source: 'manual',
      },
      {
        id: 'tx_s9',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[4].id, // Gaming & Fun
        type: 'expense',
        amount_minor: 220000, // ₦2,200.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-11`,
        note: 'Cinema ticket & gaming arcade with friends',
        merchant_or_payee: 'Silverbird Cinemas',
        source: 'manual',
      },
      {
        id: 'tx_s10',
        user_id: profile.id,
        category_id: SYSTEM_CATEGORIES[5].id, // Mobile Data
        type: 'expense',
        amount_minor: 100000, // ₦1,000.00
        currency: profile.default_currency,
        transaction_date: `${curMonth}-12`,
        note: 'Mobile data bundle for online research & homework',
        merchant_or_payee: 'MTN / Airtel',
        source: 'manual',
      },
    ];

    const sampleGoals: SavingsGoal[] = [
      {
        id: 'sg_1',
        user_id: profile.id,
        name: 'New School Sneakers 👟',
        target_amount_minor: 2500000, // ₦25,000.00
        current_amount_minor: 1750000, // ₦17,500.00 (70%)
        currency: profile.default_currency,
        target_date: `${today.getFullYear()}-12-20`,
        status: 'in_progress',
      },
      {
        id: 'sg_2',
        user_id: profile.id,
        name: 'School Science Excursion 🚌',
        target_amount_minor: 1500000, // ₦15,000.00
        current_amount_minor: 1000000, // ₦10,000.00 (67%)
        currency: profile.default_currency,
        target_date: `${today.getFullYear()}-11-30`,
        status: 'in_progress',
      },
      {
        id: 'sg_3',
        user_id: profile.id,
        name: 'Gaming Headset 🎧',
        target_amount_minor: 1200000, // ₦12,000.00
        current_amount_minor: 500000, // ₦5,000.00 (42%)
        currency: profile.default_currency,
        target_date: `${today.getFullYear()}-12-31`,
        status: 'in_progress',
      },
    ];

    setActiveBudget(sampleBudget);
    setBudgetCategories(sampleBudgetCategories);
    setTransactions(sampleTxs);
    setRecurringBills([]);
    setSavingsGoals(sampleGoals);
    setDebts([]);
    setIrregularPlan(null);
    setProfile((prev) => ({ ...prev, irregular_income_mode: false }));
  };

  const clearAllData = () => {
    setTransactions([]);
    setBudgetCategories([]);
    setRecurringBills([]);
    setSavingsGoals([]);
    setSavingsMovements([]);
    setDebts([]);
    setDebtPayments([]);
    setIrregularPlan(null);
    const range = getPeriodDateRange('monthly');
    setActiveBudget({
      id: 'blank_budget',
      user_id: profile.id,
      name: 'Monthly Spending Plan',
      period_type: 'monthly',
      period_start: range.start,
      period_end: range.end,
      total_limit_minor: 0,
      currency: profile.default_currency,
      rollover_enabled: false,
    });
  };

  const exportCsv = () => {
    if (transactions.length === 0) {
      alert('No transactions recorded to export.');
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Amount (Minor)', 'Amount (Major)', 'Currency', 'Payee / Merchant', 'Source', 'Note'];
    const rows = transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.category_id)?.name || 'Uncategorized';
      const major = (t.amount_minor / 100).toFixed(2);
      return [
        t.transaction_date,
        t.type,
        `"${cat.replace(/"/g, '""')}"`,
        t.amount_minor,
        major,
        t.currency,
        `"${(t.merchant_or_payee || '').replace(/"/g, '""')}"`,
        t.source,
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `personal_budget_transactions_${formatDateIso(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <BudgetPlannerContext.Provider
      value={{
        profile,
        updateProfile,
        categories,
        addCategory,
        deleteCategory,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        activeBudget,
        budgetCategories,
        saveBudget,
        saveBudgetCategoryLimit,
        recurringBills,
        addBill,
        updateBill,
        deleteBill,
        confirmBillPayment,
        savingsGoals,
        savingsMovements,
        addSavingsGoal,
        recordSavingsMovement,
        deleteSavingsGoal,
        debts,
        debtPayments,
        addDebt,
        recordDebtPayment,
        deleteDebt,
        irregularPlan,
        saveIrregularPlan,
        selectedPeriod,
        setSelectedPeriod,
        isLoaded,
        seedSampleData,
        clearAllData,
        exportCsv,
      }}
    >
      {children}
    </BudgetPlannerContext.Provider>
  );
};

export const useBudgetPlanner = () => {
  const context = useContext(BudgetPlannerContext);
  if (!context) {
    throw new Error('useBudgetPlanner must be used within a BudgetPlannerProvider');
  }
  return context;
};
