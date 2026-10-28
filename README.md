# FinPlan — Personal Budget Planner

A polished, secure, and responsive Personal Budget Planner built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL with Row Level Security)**.

FinPlan helps users understand where their money goes, plan spending before money is spent, prepare for bills, manage debt repayments, build emergency savings, and make sound everyday financial decisions without floating-point errors or shame-based designs.

---

## Key Differentiators & Highlights

1. **Integer Minor-Unit Precision (Zero Float Inaccuracies)**
   - All financial amounts are stored and calculated as integer minor units (`kobo` for NGN, `cents` for USD/EUR/GBP).
   - Eliminates IEEE-754 floating-point drift (e.g., `0.1 + 0.2 !== 0.3` or `19.99 * 100 = 1998.9999999999998`).
   - Strict half-up rational rounding and integer arithmetic across balances, categories, and period budgets.

2. **Configurable Currency with NGN Default**
   - Nigerian Naira (`₦` NGN) is selected by default for the initial Nigerian audience.
   - Live switching supported for `USD`, `EUR`, `GBP`, `GHS`, `KES`, `ZAR`, `CAD`, and `AUD`.

3. **Irregular / Variable Income Mode**
   - Designed for freelancers, traders, and commission earners.
   - Planned/expected income is strictly isolated from received cash and is **never** counted as spendable funds until deposited.
   - Enforces a **Waterfall Priority Allocation**:
     1. Essential Living Expenses (Rent, Food, Health, Utilities)
     2. Scheduled Recurring Bills
     3. Minimum Debt Obligations
     4. Lean Emergency Buffer
     5. Discretionary Spending (funded only from verified surplus)

4. **Bills & Subscriptions with Explicit Confirmation**
   - Tracks upcoming, due, overdue, and paid states with configurable reminder windows (default 3 days).
   - Prompts the user to explicitly confirm payment; never silently marks bills paid.
   - In-app reminders work out of the box with zero paid external APIs.

5. **Double-Counting Prevention (Ledger Integrity)**
   - **Transfers** between accounts are strictly isolated and never counted as income or expenses.
   - **Savings Contributions** move money from spendable cash into an earmarked reserve without inflating operational expenses.
   - **Debt Repayments** simultaneously reduce loan principal and record an authentic expense ledger entry.

6. **Transparent, Explainable Rule-Driven Insights**
   - Every "Suggested Next Step" shows the exact mathematical trigger and data cause (e.g., *"Food & Groceries is at 84% of its ₦90,000 limit with 12 days remaining"*).

7. **Dual-Mode Persistence Architecture**
   - **Full Supabase Cloud Mode**: Connects to PostgreSQL with strict Row Level Security (`auth.uid() = user_id`).
   - **Instant Local / Demo Mode**: Works immediately out of the box with 1-click sample data seeding without requiring upfront database provisioning.

---

## Architecture Overview

```
src/
├── app/
│   ├── layout.tsx              # Root HTML shell, fonts, SEO metadata
│   ├── page.tsx                # Dashboard: KPIs, Cash Flow, Spending Charts, Next Steps
│   ├── transactions/page.tsx   # Transaction history ledger, filtering, sorting, CSV export
│   ├── budgets/page.tsx        # Overall and category budget limits, threshold indicators
│   ├── irregular-income/page.tsx # Variable income planning & waterfall priority
│   ├── bills/page.tsx          # Recurring bills, due dates, confirmation flow
│   ├── savings/page.tsx        # Multi-goal tracker, deposit/withdrawal ledger
│   ├── debts/page.tsx          # Non-predatory debt balance tracker & repayment ledger
│   ├── reports/page.tsx        # Period comparisons, needs vs. wants, accessible tables
│   └── settings/page.tsx       # Profile, currency switcher, RLS verification, data deletion
├── components/
│   ├── ui/                     # Accessible UI primitives (Button, Card, Badge, Progress, Modal, Input)
│   ├── navigation/             # Responsive Desktop Sidebar, Header, and Mobile Bottom Nav
│   ├── dashboard/              # CashFlowChart, CategoryBreakdownChart, SuggestedNextSteps
│   └── transactions/           # TransactionModal (create/edit with minor unit safety)
├── lib/
│   ├── currency.ts             # Minor unit conversion math, rational rounding, formatting
│   ├── budget-engine.ts        # Period math, category spent, health thresholds (70/90/100%)
│   ├── insights-engine.ts      # Transparent rule-based actionable insights
│   ├── validations.ts          # Zod validation schemas for all financial entities
│   ├── constants.ts            # System seed categories (accessible colors, essential flags)
│   ├── types.ts                # TypeScript domain models
│   ├── store.tsx               # Unified State Provider, localStorage sync, demo seeder, CSV
│   └── supabase/               # Browser & server Supabase client factories
supabase/
├── schema.sql                  # Complete PostgreSQL schema, RLS policies, seed data
└── migrations/                 # Versioned migration: 20261013000000_initial_schema.sql
```

---

## Getting Started

### Prerequisites
- Node.js v20+ or v24+
- npm v10+ or v11+

### Installation
1. Clone the repository and enter the directory:
   ```bash
   git clone <repo-url>
   cd "Personal Budget Planner"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables (Optional for Supabase, runs in Local Demo mode if omitted):
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

FinPlan includes automated test suites with Vitest validating:
- Minor unit integer conversions and rational rounding.
- Non-double-counting of transfers and ledger isolation.
- Period budget remaining and threshold alerts (70%, 90%, 100%).
- Zod validation rules across all entities.

Run the test suite:
```bash
npm test
```

---

## Supabase PostgreSQL & RLS Setup

1. Create a free project on [Supabase](https://supabase.com).
2. Navigate to **SQL Editor** in the Supabase dashboard.
3. Open `supabase/schema.sql` from this repository and run the entire script.
4. The migration will create:
   - `profiles`, `accounts`, `categories`, `transactions`
   - `budgets`, `budget_categories`
   - `recurring_bills`
   - `savings_goals`, `savings_movements`
   - `debts`, `debt_payments`
   - `irregular_income_plans`
   - Row Level Security (RLS) policies on every user table enforcing `auth.uid() = user_id`.
   - Seed default categories with accessible colors and essential flags.
5. In Supabase **Project Settings > API**, copy:
   - `Project URL` -> Set as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
   - `anon public key` -> Set as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

---

## Production Build

To verify and build for production:
```bash
npm run build
npm run start
```

---

## Implementation Scope & Status

### Implemented Features
- [x] **Full Minor-Unit Math**: Integer representation with safe half-up rounding.
- [x] **Currency Customization**: Configurable currencies with NGN (`₦`) default.
- [x] **Dashboard Overview**: KPIs, Available cash, Income, Expenses, Budget remaining, Category bars, and Charts.
- [x] **Interactive Charts with Table Alternatives**: Cash Flow bar chart and Category donut chart with accessible table toggle.
- [x] **Transparent Insights**: Rule-based next steps with explicit reasons.
- [x] **Transaction Ledger**: Add, edit, delete, search, category filter, sort, pagination, and CSV export.
- [x] **Category & Budget Management**: System seeds, custom category builder, period budgets, and 70%/90%/100% threshold indicators.
- [x] **Irregular Income Mode**: Conservative baseline estimation, planned vs. received comparison, and waterfall priority allocation.
- [x] **Recurring Bills**: Due date status, reminder windows, and non-silent user confirmation flow.
- [x] **Savings Goals**: Multi-goal tracker, deposit/withdrawal ledger, and suggested monthly contribution calculator.
- [x] **Ethical Debt Tracker**: Balance, due dates, minimum payments, repayment ledger, and payoff horizon estimates with non-predatory disclaimer.
- [x] **Reports & Analytics**: Period comparison vs. previous month, needs vs. wants breakdown, and CSV export.
- [x] **Security & RLS**: Complete PostgreSQL migration with table-level RLS policies, zero client secrets, and data wipe workflow.
- [x] **Honest Empty States & Demo Seeder**: Guided first actions for new users, plus 1-click realistic Nigerian sample data toggle.

### Known Limitations & Future Roadmap
- **Bank Account Aggregation**: Not implemented in the initial release to eliminate third-party API subscription costs and avoid storing sensitive banking credentials. All records are manually logged or imported via CSV.
- **Push / SMS Reminders**: In-app notifications are fully implemented. SMS/Push delivery requires configuring an external provider (such as Termii or Africa's Talking) via Supabase database webhooks.
