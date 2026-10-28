export type CurrencyCode = 'NGN' | 'USD' | 'EUR' | 'GBP' | 'GHS' | 'KES' | 'ZAR' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

export type BudgetPeriodType = 'monthly' | 'weekly' | 'biweekly' | 'custom';

export interface UserProfile {
  id: string;
  display_name: string | null;
  default_currency: CurrencyCode;
  timezone: string;
  budget_period: BudgetPeriodType;
  irregular_income_mode: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AccountType = 'checking' | 'savings' | 'cash' | 'mobile_money' | 'other';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  currency: CurrencyCode;
  opening_balance_minor: number;
  created_at?: string;
  updated_at?: string;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string | null; // null for system defaults
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_essential: boolean;
  is_archived: boolean;
  created_at?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionSource = 'manual' | 'recurring' | 'csv' | 'savings';

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string | null;
  category_id: string;
  type: TransactionType;
  amount_minor: number; // Stored in minor units (e.g. kobo/cents)
  currency: CurrencyCode;
  transaction_date: string; // YYYY-MM-DD
  note?: string | null;
  merchant_or_payee?: string | null;
  transfer_account_id?: string | null;
  source: TransactionSource;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  period_type: BudgetPeriodType;
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
  total_limit_minor: number;
  currency: CurrencyCode;
  rollover_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  category_id: string;
  limit_minor: number;
  created_at?: string;
}

export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type BillStatus = 'active' | 'paused' | 'cancelled';

export interface RecurringBill {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  amount_minor: number;
  currency: CurrencyCode;
  frequency: BillFrequency;
  next_due_date: string; // YYYY-MM-DD
  reminder_days_before: number;
  status: BillStatus;
  last_paid_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type GoalStatus = 'in_progress' | 'completed' | 'abandoned';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount_minor: number;
  current_amount_minor: number;
  currency: CurrencyCode;
  target_date?: string | null;
  status: GoalStatus;
  created_at?: string;
  updated_at?: string;
}

export type MovementType = 'deposit' | 'withdrawal';

export interface SavingsMovement {
  id: string;
  user_id: string;
  goal_id: string;
  amount_minor: number;
  movement_type: MovementType;
  movement_date: string; // YYYY-MM-DD
  note?: string | null;
  created_at?: string;
}

export type DebtStatus = 'active' | 'paid_off';

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  starting_balance_minor: number;
  current_balance_minor: number;
  minimum_payment_minor: number;
  interest_rate_percentage: number;
  due_date?: string | null;
  currency: CurrencyCode;
  status: DebtStatus;
  created_at?: string;
  updated_at?: string;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  amount_minor: number;
  payment_date: string;
  note?: string | null;
  created_at?: string;
}

export interface IrregularIncomePlan {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  conservative_estimate_minor: number;
  essential_buffer_minor: number;
  notes?: string | null;
  currency: CurrencyCode;
  created_at?: string;
  updated_at?: string;
}

export type BudgetHealthStatus = 'normal' | 'warning' | 'critical' | 'exceeded';

export interface CategoryBudgetAnalysis {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  isEssential: boolean;
  limitMinor: number;
  spentMinor: number;
  remainingMinor: number;
  percentUsed: number;
  status: BudgetHealthStatus;
}

export interface PeriodSummary {
  periodStart: string;
  periodEnd: string;
  currency: CurrencyCode;
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netSavingsMinor: number;
  budgetLimitMinor: number;
  budgetRemainingMinor: number;
  budgetPercentUsed: number;
  budgetStatus: BudgetHealthStatus;
  daysRemainingInPeriod: number;
  totalDaysInPeriod: number;
}

export interface ActionableInsight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  reason: string;
  actionLabel?: string;
  actionHref?: string;
}
