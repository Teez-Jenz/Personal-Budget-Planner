import { z } from 'zod';

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount_minor: z.number().int().positive('Amount must be greater than zero'),
  currency: z.string().min(3).max(3),
  category_id: z.string().min(1, 'Category is required'),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  note: z.string().max(500).optional().nullable(),
  merchant_or_payee: z.string().max(100).optional().nullable(),
  source: z.enum(['manual', 'recurring', 'csv', 'savings']).default('manual'),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex code'),
  is_essential: z.boolean().default(false),
});

export const budgetSchema = z.object({
  name: z.string().min(1).max(100),
  period_type: z.enum(['monthly', 'weekly', 'biweekly', 'custom']),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_limit_minor: z.number().int().nonnegative('Budget limit cannot be negative'),
  currency: z.string().min(3).max(3),
  rollover_enabled: z.boolean().default(false),
});

export const recurringBillSchema = z.object({
  name: z.string().min(1, 'Bill name is required').max(100),
  amount_minor: z.number().int().positive('Bill amount must be positive'),
  category_id: z.string().min(1),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reminder_days_before: z.number().int().min(1).max(30).default(3),
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  target_amount_minor: z.number().int().positive('Target must be positive'),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const debtSchema = z.object({
  name: z.string().min(1, 'Debt name is required').max(100),
  starting_balance_minor: z.number().int().positive('Balance must be positive'),
  minimum_payment_minor: z.number().int().nonnegative().default(0),
  interest_rate_percentage: z.number().min(0).max(100).default(0),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});
