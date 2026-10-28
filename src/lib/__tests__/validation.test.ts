import { describe, it, expect } from 'vitest';
import {
  transactionSchema,
  categorySchema,
  budgetSchema,
  recurringBillSchema,
  savingsGoalSchema,
  debtSchema,
} from '../validations';

describe('Zod Validation Schemas', () => {
  it('validates correct transaction data with integer minor units', () => {
    const valid = {
      type: 'expense',
      amount_minor: 150000,
      currency: 'NGN',
      category_id: 'cat-123',
      transaction_date: '2026-10-13',
      note: 'Grocery store restock',
      merchant_or_payee: 'Supermarket',
      source: 'manual',
    };
    const result = transactionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects transactions with zero, negative, or fractional minor units', () => {
    const zeroAmount = {
      type: 'expense',
      amount_minor: 0,
      currency: 'NGN',
      category_id: 'cat-123',
      transaction_date: '2026-10-13',
    };
    expect(transactionSchema.safeParse(zeroAmount).success).toBe(false);

    const floatMinor = {
      type: 'expense',
      amount_minor: 150.5,
      currency: 'NGN',
      category_id: 'cat-123',
      transaction_date: '2026-10-13',
    };
    expect(transactionSchema.safeParse(floatMinor).success).toBe(false);
  });

  it('validates category schema and hex color code', () => {
    const validCat = {
      name: 'Utilities',
      type: 'expense',
      color: '#10b981',
      is_essential: true,
    };
    expect(categorySchema.safeParse(validCat).success).toBe(true);

    const invalidHex = {
      name: 'Utilities',
      type: 'expense',
      color: 'green',
    };
    expect(categorySchema.safeParse(invalidHex).success).toBe(false);
  });

  it('validates budget limits and dates', () => {
    const validBudget = {
      name: 'Monthly Plan',
      period_type: 'monthly',
      period_start: '2026-10-01',
      period_end: '2026-10-31',
      total_limit_minor: 45000000,
      currency: 'NGN',
      rollover_enabled: false,
    };
    expect(budgetSchema.safeParse(validBudget).success).toBe(true);
  });
});
