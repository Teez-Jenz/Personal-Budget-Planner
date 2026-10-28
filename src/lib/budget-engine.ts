import {
  Transaction,
  Category,
  Budget,
  BudgetCategory,
  CategoryBudgetAnalysis,
  PeriodSummary,
  BudgetHealthStatus,
  CurrencyCode,
} from './types';
import { safeAdd, safeSubtract } from './currency';

/**
 * Determines health status based on budget usage percentage.
 * Under 70%: normal (calm)
 * 70% to 89.9%: warning (amber)
 * 90% to 99.9%: critical (orange)
 * 100%+: exceeded (soft red)
 */
export function getBudgetHealthStatus(percentUsed: number): BudgetHealthStatus {
  if (percentUsed >= 100) return 'exceeded';
  if (percentUsed >= 90) return 'critical';
  if (percentUsed >= 70) return 'warning';
  return 'normal';
}

/**
 * Computes date ranges based on period type.
 */
export function getPeriodDateRange(periodType: 'monthly' | 'weekly' | 'previous_month', referenceDate = new Date()) {
  const d = new Date(referenceDate);

  if (periodType === 'weekly') {
    // Current week: Monday to Sunday
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      start: formatDateIso(monday),
      end: formatDateIso(sunday),
    };
  }

  if (periodType === 'previous_month') {
    const firstDayPrev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const lastDayPrev = new Date(d.getFullYear(), d.getMonth(), 0);
    return {
      start: formatDateIso(firstDayPrev),
      end: formatDateIso(lastDayPrev),
    };
  }

  // Monthly (default): first to last day of current month
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    start: formatDateIso(firstDay),
    end: formatDateIso(lastDay),
  };
}

export function formatDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDaysRemaining(endDateStr: string): { daysRemaining: number; totalDays: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);

  const diffMs = end.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return { daysRemaining, totalDays: 30 };
}

/**
 * Filters transactions that strictly fall inside the [periodStart, periodEnd] window.
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  periodStart: string,
  periodEnd: string
): Transaction[] {
  return transactions.filter(
    (t) => t.transaction_date >= periodStart && t.transaction_date <= periodEnd
  );
}

/**
 * Calculates Period Financial Summary ensuring transfers are completely isolated
 * and only genuine income and expenses are summed.
 */
export function calculatePeriodSummary(
  transactions: Transaction[],
  budget: Budget | null,
  periodStart: string,
  periodEnd: string,
  currency: CurrencyCode
): PeriodSummary {
  const periodTransactions = filterTransactionsByPeriod(transactions, periodStart, periodEnd);

  let totalIncomeMinor = 0;
  let totalExpenseMinor = 0;

  for (const t of periodTransactions) {
    if (t.type === 'income') {
      totalIncomeMinor = safeAdd(totalIncomeMinor, t.amount_minor);
    } else if (t.type === 'expense') {
      totalExpenseMinor = safeAdd(totalExpenseMinor, t.amount_minor);
    }
    // Note: transfers between user accounts are NEVER added to income or expenses!
  }

  const netSavingsMinor = safeSubtract(totalIncomeMinor, totalExpenseMinor);
  const budgetLimitMinor = budget ? budget.total_limit_minor : 0;
  const budgetRemainingMinor = budget ? safeSubtract(budgetLimitMinor, totalExpenseMinor) : 0;

  const budgetPercentUsed =
    budgetLimitMinor > 0 ? Math.round((totalExpenseMinor / budgetLimitMinor) * 100) : 0;

  const { daysRemaining, totalDays } = calculateDaysRemaining(periodEnd);

  return {
    periodStart,
    periodEnd,
    currency,
    totalIncomeMinor,
    totalExpenseMinor,
    netSavingsMinor,
    budgetLimitMinor,
    budgetRemainingMinor,
    budgetPercentUsed,
    budgetStatus: getBudgetHealthStatus(budgetPercentUsed),
    daysRemainingInPeriod: daysRemaining,
    totalDaysInPeriod: totalDays,
  };
}

/**
 * Analyzes spending per category against configured budget limits.
 */
export function calculateCategoryBudgets(
  categories: Category[],
  budgetCategories: BudgetCategory[],
  periodTransactions: Transaction[]
): CategoryBudgetAnalysis[] {
  const limitsMap = new Map<string, number>();
  for (const bc of budgetCategories) {
    limitsMap.set(bc.category_id, bc.limit_minor);
  }

  // Sum expenses per category
  const spentMap = new Map<string, number>();
  for (const t of periodTransactions) {
    if (t.type === 'expense') {
      const current = spentMap.get(t.category_id) || 0;
      spentMap.set(t.category_id, safeAdd(current, t.amount_minor));
    }
  }

  // Map category analysis
  const results: CategoryBudgetAnalysis[] = [];

  for (const cat of categories) {
    // Only analyze expense categories or categories that have spending or a set limit
    if (cat.type !== 'expense') continue;

    const limitMinor = limitsMap.get(cat.id) || 0;
    const spentMinor = spentMap.get(cat.id) || 0;

    // If there is no spending and no budget set, we can still include it if essential, or skip
    if (limitMinor === 0 && spentMinor === 0) continue;

    const remainingMinor = safeSubtract(limitMinor, spentMinor);
    const percentUsed = limitMinor > 0 ? Math.round((spentMinor / limitMinor) * 100) : 0;

    results.push({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      categoryIcon: cat.icon,
      isEssential: cat.is_essential,
      limitMinor,
      spentMinor,
      remainingMinor,
      percentUsed,
      status: getBudgetHealthStatus(percentUsed),
    });
  }

  // Sort descending by percentage used, then by spent amount
  return results.sort((a, b) => b.percentUsed - a.percentUsed || b.spentMinor - a.spentMinor);
}

/**
 * Computes cash flow day-by-day for charts.
 */
export function generateDailyCashFlow(
  periodTransactions: Transaction[],
  periodStart: string,
  periodEnd: string
) {
  const dailyMap = new Map<string, { date: string; incomeMinor: number; expenseMinor: number }>();

  // Initialize days
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    const str = formatDateIso(dt);
    dailyMap.set(str, { date: str, incomeMinor: 0, expenseMinor: 0 });
  }

  for (const t of periodTransactions) {
    if (dailyMap.has(t.transaction_date)) {
      const entry = dailyMap.get(t.transaction_date)!;
      if (t.type === 'income') {
        entry.incomeMinor = safeAdd(entry.incomeMinor, t.amount_minor);
      } else if (t.type === 'expense') {
        entry.expenseMinor = safeAdd(entry.expenseMinor, t.amount_minor);
      }
    }
  }

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}
