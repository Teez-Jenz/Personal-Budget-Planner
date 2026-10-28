import { describe, it, expect } from 'vitest';
import { toMinorUnits, fromMinorUnits, formatCurrency, safeAdd, safeSubtract } from '../currency';
import {
  calculatePeriodSummary,
  calculateCategoryBudgets,
  getBudgetHealthStatus,
  filterTransactionsByPeriod,
} from '../budget-engine';
import { generateActionableInsights } from '../insights-engine';
import { Transaction, Category, Budget, BudgetCategory } from '../types';

describe('Currency & Minor Unit Precision Math', () => {
  it('converts decimal string and number amounts to integer minor units without float drift', () => {
    // ₦1,500.50 -> 150050 kobo
    expect(toMinorUnits('1500.50', 'NGN')).toBe(150050);
    expect(toMinorUnits(1500.5, 'NGN')).toBe(150050);
    expect(toMinorUnits('0.99', 'USD')).toBe(99);
    expect(toMinorUnits(19.99, 'USD')).toBe(1999);
    expect(toMinorUnits('250,000.00', 'NGN')).toBe(25000000);
  });

  it('converts minor units back to decimal number accurately', () => {
    expect(fromMinorUnits(150050, 'NGN')).toBe(1500.5);
    expect(fromMinorUnits(99, 'USD')).toBe(0.99);
    expect(fromMinorUnits(1999, 'USD')).toBe(19.99);
  });

  it('formats currency with symbol and thousands separators', () => {
    expect(formatCurrency(150050, 'NGN')).toBe('₦1,500.50');
    expect(formatCurrency(5000000, 'NGN')).toBe('₦50,000.00');
    expect(formatCurrency(2500, 'USD')).toBe('$25.00');
    expect(formatCurrency(-10000, 'NGN')).toBe('-₦100.00');
  });

  it('performs safe integer additions and subtractions', () => {
    expect(safeAdd(10000, 5000)).toBe(15000);
    expect(safeSubtract(10000, 3500)).toBe(6500);
  });
});

describe('Budget Calculation Engine & Ledger Isolation', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      user_id: 'user-1',
      category_id: 'cat-housing',
      type: 'expense',
      amount_minor: 8000000, // ₦80,000.00
      currency: 'NGN',
      transaction_date: '2026-10-05',
      source: 'manual',
    },
    {
      id: 'tx-2',
      user_id: 'user-1',
      category_id: 'cat-food',
      type: 'expense',
      amount_minor: 4000000, // ₦40,000.00
      currency: 'NGN',
      transaction_date: '2026-10-10',
      source: 'manual',
    },
    {
      id: 'tx-3',
      user_id: 'user-1',
      category_id: 'cat-salary',
      type: 'income',
      amount_minor: 25000000, // ₦250,000.00
      currency: 'NGN',
      transaction_date: '2026-10-01',
      source: 'manual',
    },
    {
      // CRITICAL: Transfer between accounts MUST NOT affect income or expenses
      id: 'tx-4',
      user_id: 'user-1',
      category_id: 'cat-other',
      type: 'transfer',
      amount_minor: 5000000, // ₦50,000.00 transfer
      currency: 'NGN',
      transaction_date: '2026-10-12',
      source: 'manual',
    },
  ];

  const sampleBudget: Budget = {
    id: 'b-1',
    user_id: 'user-1',
    name: 'October 2026 Budget',
    period_type: 'monthly',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    total_limit_minor: 15000000, // ₦150,000.00
    currency: 'NGN',
    rollover_enabled: false,
  };

  it('accurately calculates period totals and strictly isolates transfers', () => {
    const summary = calculatePeriodSummary(
      sampleTransactions,
      sampleBudget,
      '2026-10-01',
      '2026-10-31',
      'NGN'
    );

    // Total income = ₦250,000.00
    expect(summary.totalIncomeMinor).toBe(25000000);

    // Total expense = ₦80,000 + ₦40,000 = ₦120,000.00 (Transfer tx-4 is ignored!)
    expect(summary.totalExpenseMinor).toBe(12000000);

    // Net cash flow = 250,000 - 120,000 = ₦130,000.00
    expect(summary.netSavingsMinor).toBe(13000000);

    // Budget remaining = 150,000 - 120,000 = ₦30,000.00
    expect(summary.budgetRemainingMinor).toBe(3000000);

    // Budget percent used = 120,000 / 150,000 = 80%
    expect(summary.budgetPercentUsed).toBe(80);
    expect(summary.budgetStatus).toBe('warning');
  });

  it('evaluates threshold classifications correctly', () => {
    expect(getBudgetHealthStatus(50)).toBe('normal');
    expect(getBudgetHealthStatus(69)).toBe('normal');
    expect(getBudgetHealthStatus(70)).toBe('warning');
    expect(getBudgetHealthStatus(89)).toBe('warning');
    expect(getBudgetHealthStatus(90)).toBe('critical');
    expect(getBudgetHealthStatus(99)).toBe('critical');
    expect(getBudgetHealthStatus(100)).toBe('exceeded');
    expect(getBudgetHealthStatus(115)).toBe('exceeded');
  });

  it('computes category breakdowns and respects limits', () => {
    const categories: Category[] = [
      {
        id: 'cat-housing',
        user_id: null,
        name: 'Housing',
        type: 'expense',
        icon: 'Home',
        color: '#3b82f6',
        is_essential: true,
        is_archived: false,
      },
      {
        id: 'cat-food',
        user_id: null,
        name: 'Food',
        type: 'expense',
        icon: 'Utensils',
        color: '#10b981',
        is_essential: true,
        is_archived: false,
      },
    ];

    const budgetCategories: BudgetCategory[] = [
      { id: 'bc-1', budget_id: 'b-1', category_id: 'cat-housing', limit_minor: 10000000 }, // ₦100k
      { id: 'bc-2', budget_id: 'b-1', category_id: 'cat-food', limit_minor: 4000000 },     // ₦40k
    ];

    const analysis = calculateCategoryBudgets(categories, budgetCategories, sampleTransactions);

    // cat-food: 40k spent of 40k limit -> 100% (exceeded/at limit)
    const food = analysis.find((a) => a.categoryId === 'cat-food')!;
    expect(food.spentMinor).toBe(4000000);
    expect(food.percentUsed).toBe(100);
    expect(food.status).toBe('exceeded');

    // cat-housing: 80k spent of 100k limit -> 80% (warning)
    const housing = analysis.find((a) => a.categoryId === 'cat-housing')!;
    expect(housing.spentMinor).toBe(8000000);
    expect(housing.remainingMinor).toBe(2000000);
    expect(housing.percentUsed).toBe(80);
    expect(housing.status).toBe('warning');
  });
});

describe('Actionable Insights Engine', () => {
  it('provides honest empty state suggestion when 0 transactions exist', () => {
    const insights = generateActionableInsights({
      summary: {
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        currency: 'NGN',
        totalIncomeMinor: 0,
        totalExpenseMinor: 0,
        netSavingsMinor: 0,
        budgetLimitMinor: 0,
        budgetRemainingMinor: 0,
        budgetPercentUsed: 0,
        budgetStatus: 'normal',
        daysRemainingInPeriod: 20,
        totalDaysInPeriod: 30,
      },
      categoryBudgets: [],
      upcomingBills: [],
      irregularPlan: null,
      debts: [],
      currency: 'NGN',
      totalTransactionCount: 0,
    });

    expect(insights.length).toBe(1);
    expect(insights[0].id).toBe('empty-state-welcome');
    expect(insights[0].actionLabel).toBe('Record First Transaction');
  });
});
