-- ==============================================================================
-- POCKETWISE: STUDENT BUDGET PLANNER — COMPLETE DATABASE SCHEMA & RLS POLICIES
-- Tailored for Secondary School Students (Allowance, Cafeteria, Transport, Piggy Bank)
-- PostgreSQL / Supabase Compatible (Fully Idempotent & Re-run Safe)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    budget_period VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'weekly', 'biweekly'
    irregular_income_mode BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. ACCOUNTS TABLE (Optional multi-account / cash-in-hand tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type VARCHAR(50) NOT NULL DEFAULT 'checking', -- 'checking', 'savings', 'cash', 'mobile_money', 'other'
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    opening_balance_minor BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own accounts" ON public.accounts;
CREATE POLICY "Users can manage their own accounts"
    ON public.accounts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES TABLE (System defaults + user custom categories)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means system default category
    name TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#6366f1',
    is_essential BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Users can see system defaults (user_id IS NULL) AND their own custom categories
DROP POLICY IF EXISTS "Users can read system categories and their own" ON public.categories;
CREATE POLICY "Users can read system categories and their own"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own custom categories" ON public.categories;
CREATE POLICY "Users can insert their own custom categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own custom categories" ON public.categories;
CREATE POLICY "Users can update their own custom categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id AND user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own custom categories" ON public.categories;
CREATE POLICY "Users can delete their own custom categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- ------------------------------------------------------------------------------
-- 4. TRANSACTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    merchant_or_payee TEXT,
    transfer_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'manual', -- 'manual', 'recurring', 'csv', 'savings'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions"
    ON public.transactions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category_id);

-- ------------------------------------------------------------------------------
-- 5. BUDGETS & BUDGET CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    period_type VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'weekly', 'custom'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_limit_minor BIGINT NOT NULL CHECK (total_limit_minor >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    rollover_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
CREATE POLICY "Users can manage their own budgets"
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON public.budgets(user_id, period_start, period_end);

CREATE TABLE IF NOT EXISTS public.budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_minor BIGINT NOT NULL CHECK (limit_minor >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(budget_id, category_id)
);

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage budget categories for their budgets" ON public.budget_categories;
CREATE POLICY "Users can manage budget categories for their budgets"
    ON public.budget_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets b
            WHERE b.id = budget_categories.budget_id AND b.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.budgets b
            WHERE b.id = budget_categories.budget_id AND b.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 6. RECURRING BILLS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    frequency VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'weekly', 'biweekly', 'monthly', 'yearly'
    next_due_date DATE NOT NULL,
    reminder_days_before INT NOT NULL DEFAULT 3,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'cancelled'
    last_paid_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.recurring_bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own recurring bills" ON public.recurring_bills;
CREATE POLICY "Users can manage their own recurring bills"
    ON public.recurring_bills FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bills_user_due ON public.recurring_bills(user_id, next_due_date);

-- ------------------------------------------------------------------------------
-- 7. SAVINGS GOALS & MOVEMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount_minor BIGINT NOT NULL CHECK (target_amount_minor > 0),
    current_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (current_amount_minor >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    target_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their savings goals" ON public.savings_goals;
CREATE POLICY "Users can manage their savings goals"
    ON public.savings_goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.savings_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('deposit', 'withdrawal')),
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.savings_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their savings movements" ON public.savings_movements;
CREATE POLICY "Users can manage their savings movements"
    ON public.savings_movements FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_savings_movements_goal ON public.savings_movements(goal_id);

-- ------------------------------------------------------------------------------
-- 8. DEBTS & DEBT PAYMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    starting_balance_minor BIGINT NOT NULL CHECK (starting_balance_minor > 0),
    current_balance_minor BIGINT NOT NULL CHECK (current_balance_minor >= 0),
    minimum_payment_minor BIGINT NOT NULL DEFAULT 0,
    interest_rate_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    due_date DATE,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paid_off'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their debts" ON public.debts;
CREATE POLICY "Users can manage their debts"
    ON public.debts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their debt payments" ON public.debt_payments;
CREATE POLICY "Users can manage their debt payments"
    ON public.debt_payments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON public.debt_payments(debt_id);

-- ------------------------------------------------------------------------------
-- 9. IRREGULAR INCOME PLANS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.irregular_income_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    conservative_estimate_minor BIGINT NOT NULL CHECK (conservative_estimate_minor >= 0),
    essential_buffer_minor BIGINT NOT NULL DEFAULT 0,
    notes TEXT,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.irregular_income_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their irregular income plans" ON public.irregular_income_plans;
CREATE POLICY "Users can manage their irregular income plans"
    ON public.irregular_income_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. SYSTEM SEED CATEGORIES (Secondary School Student Categories)
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, user_id, name, type, icon, color, is_essential) VALUES
    -- Student Expenses
    ('00000000-0000-0000-0000-000000000001', NULL, 'Lunch & Cafeteria', 'expense', 'Utensils', '#10b981', true),
    ('00000000-0000-0000-0000-000000000002', NULL, 'Snacks & Drinks', 'expense', 'Utensils', '#f59e0b', false),
    ('00000000-0000-0000-0000-000000000003', NULL, 'Bus & School Transport', 'expense', 'Car', '#3b82f6', true),
    ('00000000-0000-0000-0000-000000000004', NULL, 'Stationery & Books', 'expense', 'GraduationCap', '#8b5cf6', true),
    ('00000000-0000-0000-0000-000000000005', NULL, 'Gaming & Fun', 'expense', 'Film', '#ec4899', false),
    ('00000000-0000-0000-0000-000000000006', NULL, 'Mobile Airtime & Data', 'expense', 'Zap', '#06b6d4', true),
    ('00000000-0000-0000-0000-000000000007', NULL, 'Clothes & Outings', 'expense', 'ShoppingBag', '#f97316', false),
    ('00000000-0000-0000-0000-000000000008', NULL, 'Piggy Bank / Savings', 'expense', 'PiggyBank', '#059669', false),
    ('00000000-0000-0000-0000-000000000009', NULL, 'Other Student Expenses', 'expense', 'MoreHorizontal', '#94a3b8', false),
    -- Student Incomes
    ('00000000-0000-0000-0000-000000000010', NULL, 'Pocket Money / Allowance', 'income', 'Wallet', '#10b981', false),
    ('00000000-0000-0000-0000-000000000011', NULL, 'Daily Lunch Money', 'income', 'Coins', '#3b82f6', false),
    ('00000000-0000-0000-0000-000000000012', NULL, 'Birthday & Family Gifts', 'income', 'Gift', '#ec4899', false),
    ('00000000-0000-0000-0000-000000000013', NULL, 'Chores & Side Gigs', 'income', 'Sparkles', '#f59e0b', false),
    ('00000000-0000-0000-0000-000000000014', NULL, 'Academic / Sport Awards', 'income', 'Trophy', '#8b5cf6', false),
    ('00000000-0000-0000-0000-000000000015', NULL, 'Other Student Income', 'income', 'DollarSign', '#64748b', false)
ON CONFLICT (id) DO NOTHING;
