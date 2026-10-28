import {
  ActionableInsight,
  CategoryBudgetAnalysis,
  RecurringBill,
  IrregularIncomePlan,
  Debt,
  CurrencyCode,
  PeriodSummary,
} from './types';
import { formatCurrency, safeSubtract } from './currency';

export interface InsightInputData {
  summary: PeriodSummary;
  categoryBudgets: CategoryBudgetAnalysis[];
  upcomingBills: RecurringBill[];
  irregularPlan: IrregularIncomePlan | null;
  debts: Debt[];
  currency: CurrencyCode;
  totalTransactionCount: number;
}

/**
 * Generates transparent, non-judgmental actionable insights and next steps
 * explaining the exact data and calculation that triggered them.
 */
export function generateActionableInsights(data: InsightInputData): ActionableInsight[] {
  const insights: ActionableInsight[] = [];
  const { summary, categoryBudgets, upcomingBills, irregularPlan, debts, currency, totalTransactionCount } = data;

  // 1. First-time onboarding / empty state guidance
  if (totalTransactionCount === 0) {
    insights.push({
      id: 'empty-state-welcome',
      type: 'info',
      title: 'Welcome to Your Budget Planner',
      message: 'Start by recording your first transaction or setting up a monthly spending plan.',
      reason: 'No transactions have been recorded yet for your account.',
      actionLabel: 'Record First Transaction',
      actionHref: '/transactions',
    });
    return insights;
  }

  // 2. Budget Over-Limit or Nearing-Limit Detection
  for (const cat of categoryBudgets) {
    if (cat.percentUsed >= 100) {
      insights.push({
        id: `cat-exceeded-${cat.categoryId}`,
        type: 'alert',
        title: `${cat.categoryName} Budget Exceeded`,
        message: `Spending reached ${cat.percentUsed}% (${formatCurrency(cat.spentMinor, currency)} of ${formatCurrency(cat.limitMinor, currency)} limit).`,
        reason: `Recorded expenses in ${cat.categoryName} exceed the allocated ceiling by ${formatCurrency(Math.abs(cat.remainingMinor), currency)}.`,
        actionLabel: 'Review Transactions',
        actionHref: `/transactions?category=${cat.categoryId}`,
      });
    } else if (cat.percentUsed >= 75 && summary.daysRemainingInPeriod > 3) {
      insights.push({
        id: `cat-warning-${cat.categoryId}`,
        type: 'warning',
        title: `${cat.categoryName} Approaching Limit`,
        message: `${cat.categoryName} is at ${cat.percentUsed}% of its limit with ${summary.daysRemainingInPeriod} days remaining in this period.`,
        reason: `Current spend is ${formatCurrency(cat.spentMinor, currency)} out of ${formatCurrency(cat.limitMinor, currency)}. ${formatCurrency(cat.remainingMinor, currency)} remains.`,
        actionLabel: 'View Category',
        actionHref: `/transactions?category=${cat.categoryId}`,
      });
    }
  }

  // 3. Upcoming Bills (Within 5 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const bill of upcomingBills) {
    if (bill.status !== 'active') continue;
    const dueDate = new Date(bill.next_due_date);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      insights.push({
        id: `bill-due-now-${bill.id}`,
        type: 'alert',
        title: `Bill Due: ${bill.name}`,
        message: `${bill.name} (${formatCurrency(bill.amount_minor, currency)}) is due today.`,
        reason: `Due date ${bill.next_due_date} matches or is before today and has not been confirmed paid.`,
        actionLabel: 'Confirm Payment',
        actionHref: '/bills',
      });
    } else if (diffDays <= bill.reminder_days_before) {
      insights.push({
        id: `bill-upcoming-${bill.id}`,
        type: 'info',
        title: `Upcoming Bill: ${bill.name}`,
        message: `${bill.name} (${formatCurrency(bill.amount_minor, currency)}) is due in ${diffDays} day${diffDays === 1 ? '' : 's'}.`,
        reason: `Next scheduled due date is ${bill.next_due_date}, within your ${bill.reminder_days_before}-day alert window.`,
        actionLabel: 'View Bills',
        actionHref: '/bills',
      });
    }
  }

  // 4. Irregular Income Tracking
  if (irregularPlan) {
    const conservativeFloor = irregularPlan.conservative_estimate_minor;
    const received = summary.totalIncomeMinor;
    if (received < conservativeFloor) {
      const gap = safeSubtract(conservativeFloor, received);
      insights.push({
        id: 'irregular-income-gap',
        type: 'info',
        title: 'Irregular Income Pacing',
        message: `Received ${formatCurrency(received, currency)} of your conservative target (${formatCurrency(conservativeFloor, currency)}).`,
        reason: `Pacing is ${formatCurrency(gap, currency)} below conservative forecast. Prioritize essential expenses first.`,
        actionLabel: 'View Income Plan',
        actionHref: '/irregular-income',
      });
    }
  }

  // 5. Debt Minimum Payments
  for (const debt of debts) {
    if (debt.status === 'active' && debt.minimum_payment_minor > 0 && debt.due_date) {
      const dueDate = new Date(debt.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 7) {
        insights.push({
          id: `debt-min-due-${debt.id}`,
          type: 'warning',
          title: `Minimum Payment Due: ${debt.name}`,
          message: `Minimum repayment of ${formatCurrency(debt.minimum_payment_minor, currency)} is due in ${diffDays} day${diffDays === 1 ? '' : 's'}.`,
          reason: `Debt due date ${debt.due_date} is within 7 days. Outstanding balance is ${formatCurrency(debt.current_balance_minor, currency)}.`,
          actionLabel: 'Record Debt Payment',
          actionHref: '/debts',
        });
      }
    }
  }

  // 6. Healthy Progress Feedback
  if (summary.totalExpenseMinor > 0 && summary.budgetPercentUsed <= 70 && summary.budgetLimitMinor > 0) {
    insights.push({
      id: 'healthy-spending-pacing',
      type: 'success',
      title: 'Spending Within Target',
      message: `You have used ${summary.budgetPercentUsed}% of your overall period budget with ${summary.daysRemainingInPeriod} days left.`,
      reason: `Total spent (${formatCurrency(summary.totalExpenseMinor, currency)}) is comfortably below the ${formatCurrency(summary.budgetLimitMinor, currency)} limit.`,
    });
  }

  return insights;
}
