# Phase 10 — Accounts & Finance

> Depends on PHASE_8 (`Transaction` + `Payment`). Builds the full, intentionally simple finance module on top of the earning records created by the payment gate.

## 1. Objective

Give Finance a single place to see money in and out: an accounts dashboard (Total Earning / Expense / Net Profit / Outstanding), earnings and expenses management, a transactions ledger, and outstanding tracking driven by quotations vs payments. Accounts stay deliberately simple — just EARNING and EXPENSE.

## 2. Scope of Work (In Scope)

- Accounts dashboard: KPI cards + Earnings-vs-Expenses + Revenue-by-Month, tabbed Overview/Earnings/Expenses/Outstanding/Transactions — WF-41.
- Add Financial Transaction (Earning or Expense) with business/pipeline/quotation links for earnings — WF-42.
- Transactions list with type/date/business filters — WF-43.
- Outstanding computation: per accepted quotation, `required − received`; aggregate for the dashboard KPI.
- Extend `Transaction` usage to EXPENSE; add expense categories.
- Reuse charts (see PHASE_11 charting note) for the two dashboard charts.

## 3. Requirements

### Functional
1. Dashboard KPIs: Total Earning (Σ EARNING), Total Expense (Σ EXPENSE), Net Profit (earning − expense), Outstanding (Σ remaining on accepted quotations) — WF-41.
2. Add Transaction: type radio Earning/Expense; amount*, date*, category, description, reference; earnings also link Business/Pipeline/Quotation — WF-42.
3. Earnings created by the payment gate (PHASE_8) appear here automatically (same `Transaction` table) — no double entry.
4. Partial payments leave outstanding; multiple payments show as separate transactions — CONTEXT Accounts rules.
5. Transactions ledger is filterable by type/date/business and shows signed amounts — WF-43.
6. Recent transactions feed the dashboard and (later) the app dashboard/analytics.

### Non-Functional
- All amounts integer paise; profit/outstanding computed integer-safe; formatted with the Settings currency (default INR).
- Finance actions gated by `accounts:write` / `payment:write`; reads by `accounts:read`.
- Outstanding is derived (query/aggregate), not a stored, drift-prone field.

## 4. End-to-End User Flow

```text
Accounts (WF-41) ── tabs: Overview · Earnings · Expenses · Outstanding · Transactions
   ├─ [+ Add Transaction] (WF-42): Earning (link biz/pipeline/quotation) or Expense (category)
   ├─ Outstanding tab: accepted quotations with remaining balances → jump to Record Payment (PHASE_8)
   └─ Transactions (WF-43): filter/search ledger
Earnings auto-arrive from PHASE_8 payment gate.
```

## 5. Wireframes

**WF-41 — Accounts Dashboard**
```text
Accounts                                             [ + Add Transaction ]
┌ TOTAL EARNING ₹12,00,000 ┐ ┌ TOTAL EXPENSE ₹4,50,000 ┐ ┌ NET ₹7,50,000 ┐ ┌ OUTSTANDING ₹2,10,000 ┐
┌ EARNINGS vs EXPENSES (bar) ┐   ┌ REVENUE BY MONTH (bar) ┐
[Overview][Earnings][Expenses][Outstanding][Transactions]
RECENT TRANSACTIONS
 20 Aug  Income  Initial Payment  ABC Corp   ₹50,000
 18 Aug  Expense Software         Internal   ₹2,000
```

**WF-42 — Add Earning / Expense**
```text
Add Financial Transaction
Type *  (●) Earning   ( ) Expense
Amount * [₹______]  Date * [20 Aug]  Category [Initial Payment ▾]  Description [____]
Business [ABC ▾]  Pipeline [PL-123 ▾]  Quotation [V3 ▾]   (earning links)
Reference [______]                              [ Cancel ] [ Save Transaction ]
```

**WF-43 — Transactions List**
```text
Transactions
[ Search…] [Earning ▾][Expense ▾][Date ▾][Business ▾]
┌ DATE ┬ TYPE ┬ DESCRIPTION ┬ BUSINESS ┬ AMOUNT ┬ ACTION ┐
│20 Aug│EARN  │Initial Pay  │ABC Corp  │+₹50,000│ View › │
│18 Aug│EXP   │Software     │Internal  │−₹2,000 │ View › │
```

## 6. Technical Design / Architecture

### Model additions
```prisma
enum ExpenseCategory { SOFTWARE MARKETING OPERATIONS SALARY OTHER }
// Transaction (PHASE_8) is reused. Optionally add:
model Transaction {
  // …existing fields…
  expenseCategory ExpenseCategory?     // only for type = EXPENSE
}
```

### Finance services / aggregation
```ts
// src/features/accounts/server/accounts.queries.ts
export async function financeSummary() {
  const [earn, exp] = await Promise.all([
    db.transaction.aggregate({ _sum: { amount: true }, where: { type: "EARNING" } }),
    db.transaction.aggregate({ _sum: { amount: true }, where: { type: "EXPENSE" } }),
  ]);
  const outstanding = await computeOutstanding();      // Σ(quotation.initialPayment − Σpayments) for accepted, unpaid
  const earning = earn._sum.amount ?? 0, expense = exp._sum.amount ?? 0;
  return { earning, expense, net: earning - expense, outstanding };
}
export async function computeOutstanding() { /* join accepted quotations ↔ payments */ }
export async function revenueByMonth(range) { /* groupBy month over EARNING */ }
```

### Feature folder
```text
src/features/accounts/
├─ components/ kpi-cards  earnings-vs-expenses-chart  revenue-by-month-chart  transaction-form  transactions-table  outstanding-table
├─ server/     accounts.actions.ts (addTransaction)  accounts.queries.ts (summary, revenueByMonth, outstanding, ledger)
├─ hooks/       use-finance-summary.ts  use-transactions.ts
└─ schemas/     transaction.schema.ts
```

## 7. Definition of Done

- Dashboard KPIs compute correctly from real transactions + outstanding; charts render.
- Add Transaction supports both types; earnings link business/pipeline/quotation; expenses take a category.
- Earnings from the PHASE_8 payment gate appear without re-entry (single source table).
- Outstanding is derived from accepted quotations vs recorded payments and reconciles with Payment Pending (PHASE_8).
- Transactions ledger filters by type/date/business and shows signed, currency-formatted amounts.
- Finance reads/writes are permission-gated and audited.

## 8. What NOT To Do

- Do **not** add invoicing, tax engines, multi-currency, or accounting beyond EARNING/EXPENSE (CONTEXT: keep simple).
- Do **not** duplicate payment-gate earnings with manual entries — reuse the same `Transaction`.
- Do **not** store Outstanding as a mutable column — always derive it.
- Do **not** use floats; keep paise + integer math.
- Do **not** build financial analytics charts trend pages here beyond the two dashboard charts — deeper analysis is PHASE_11.

## 9. Dependencies / Enables

- **Depends on:** PHASE_8 (Transaction/Payment/quotation links).
- **Enables:** PHASE_11 financial analytics + app dashboard revenue KPIs.
