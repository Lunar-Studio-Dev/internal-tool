# Phase 11 — Dashboard & Analytics

> Depends on PHASE_4–PHASE_10 (all domain data exists). Read-only aggregation layer + charts. No new core domain models.

## 1. Objective

Deliver the home Dashboard (operational overview) and the Analytics section (pipeline conversion, financial, and team insights). Everything here reads and aggregates data produced by earlier phases and renders it with the charting library.

## 2. Scope of Work (In Scope)

- Dashboard (WF-06): KPI cards (Businesses, Active Pipelines, Projects, Pipeline Value, Revenue), Pipeline Funnel, Pipeline Status, My To-Dos, Recent Pipelines, Upcoming Follow-ups, Quick Actions.
- Analytics Overview (WF-48): leads/active/converted/deactivated, conversion funnel, phase distribution, status trend, deactivation reasons.
- Pipeline Analytics (WF-49): per-phase counts + conversion %, conversion-by-phase, average time in phase, pipeline value (active/quotation/won/lost).
- Financial Analytics (WF-50): earnings/expenses/net/outstanding, monthly cash flow, expense breakdown, Monthly/Quarterly/Yearly toggle.
- Team Analytics (WF-51): workload, pipelines by owner, task performance (completed/overdue/completion rate).
- Aggregation query layer + a charts wrapper component; date-range control.

## 3. Requirements

### Functional
1. Dashboard KPIs and lists reflect live data; "View All" links deep-link to the respective sections; Quick Actions open the correct create flows — WF-06.
2. My To-Dos widget mirrors PHASE_6 grouping (Today/Tomorrow/…); Upcoming Follow-ups shows next scheduled with priority — WF-06.
3. Analytics funnels compute stage counts from pipelines/phases; conversion % = stage/previous-stage — WF-48, WF-49.
4. Average time in phase computed from phase `startedAt`→`promotedAt` (or now) — WF-49.
5. Financial analytics reuse PHASE_10 aggregations; support Monthly/Quarterly/Yearly grouping — WF-50.
6. Team analytics compute per-member workload and task completion metrics; fills PHASE_3 member workload counts — WF-51.
7. A global Date Range filter scopes analytics — WF-48.

### Non-Functional
- Aggregations run as efficient grouped queries (avoid N+1); heavy ones can be prefetched in server components and hydrated.
- Charts are accessible (labels, tooltips, keyboard focus) and theme-aware (light/dark).
- Numbers reconcile with source screens (e.g., analytics revenue == accounts earning for the same range).

## 4. Charting decision (read this)

The stack specifies **React-Charts** (TanStack `react-charts`). It is used here for all charts. Note the trade-off, then pick one and stay consistent:

- **TanStack `react-charts`** (as specified): lightweight, matches the TanStack ecosystem; API is still beta — pin the version.
- **shadcn Chart (Recharts)** — theme-native (uses your CSS variables), production-proven, drop-in with the shadcn components already installed. Recommended fallback if `react-charts` friction shows up.

Wrap whichever you choose behind `components/common/chart/*` so swapping later is a one-file change. All chart specifics below are library-agnostic (bar/line/funnel over aggregated series).

## 5. Wireframes

**WF-06 — Dashboard**
```text
Overview
[Businesses 128][Active Pipelines 45][Projects 18][Pipeline Value ₹8,40,000][Revenue ₹1,20,000]
┌ PIPELINE FUNNEL ─ Discovery 24 / Business 18 / Requirement 15 / Quotation 12 / Project 8 ┐
┌ PIPELINE STATUS ─ ACTIVE 45 / PROMOTED 28 / DEACTIVATED 20 / PROJECT 18 ┐
┌ MY TO-DOS ─ Discovery call ABC (Today) … [View All] ┐  ┌ RECENT PIPELINES ─ ABC Requirement ACTIVE … ┐
┌ UPCOMING FOLLOW-UPS ─ ABC Today HIGH … ┐            ┌ QUICK ACTIONS ─ +Business +Pipeline +To-Do +Resource ┐
```

**WF-48 — Analytics Overview**
```text
Analytics                                              [ Date Range ▾ ]
[Total Leads 128][Active 45][Converted 28][Deactivated 20]
┌ CONVERSION FUNNEL ─ Leads128→Business90→Requirement62→Quotation40→Project28 ┐
┌ PHASE DISTRIBUTION ┐  ┌ STATUS TREND (line) ┐  ┌ DEACTIVATION REASONS (bar) ┐
```

**WF-49 — Pipeline Analytics**
```text
[Discovery 24 · 75%→Next][Requirement 15 · 67%→Next][Quotation 12 · 70%→Project][Project 8 · 100%]
CONVERSION BY PHASE: Discovery→Business 75% · Business→Requirement 67% · Requirement→Quotation 77% · Quotation→Project 70%
AVERAGE TIME IN PHASE: Discovery 3.2d · Business 4.5d · Requirement 6.1d · Quotation 5.3d
PIPELINE VALUE: Active ₹8,40,000 · Quotation ₹4,20,000 · Won ₹12,00,000 · Lost ₹6,20,000
```

**WF-50 — Financial Analytics**  &  **WF-51 — Team Analytics**
```text
WF-50: [Earnings ₹12L][Expenses ₹4.5L][Net ₹7.5L][Outstanding ₹2.1L]
       MONTHLY CASH FLOW (line) · EXPENSE BREAKDOWN (bar)  [Monthly][Quarterly][Yearly]
WF-51: TEAM WORKLOAD (bar) · PIPELINES BY OWNER (bar)
       TASK PERFORMANCE: member · completed · overdue · completion rate
```

## 6. Technical Design / Architecture

### Aggregation layer (read-only)
```text
src/features/analytics/
├─ components/ date-range-picker  funnel-chart  distribution-chart  trend-chart  reasons-chart
│              pipeline-analytics  financial-analytics  team-analytics
├─ server/     analytics.queries.ts   // grouped counts, conversion, avg-time-in-phase
└─ hooks/       use-analytics.ts
src/features/dashboard/
├─ components/ kpi-cards  pipeline-funnel  pipeline-status  my-todos  recent-pipelines  upcoming-followups  quick-actions
├─ server/     dashboard.queries.ts
└─ hooks/       use-dashboard.ts
src/components/common/chart/   // library wrapper (react-charts today; swappable)
```
```ts
// examples (analytics.queries.ts)
funnelByPhase()        // groupBy currentPhase → counts
statusBreakdown()      // groupBy status
conversionByPhase()    // pairwise stage ratios from phase history
avgTimeInPhase()       // avg(promotedAt − startedAt) per PhaseType
deactivationReasons()  // groupBy deactivationReasonId (join DeactivationReason)
pipelineValue()        // Σ current-quotation subtotal split by status/won/lost
teamWorkload()         // tasks/pipelines/follow-ups grouped by assignee/owner
```
Financial charts reuse `financeSummary` / `revenueByMonth` from PHASE_10. Server components prefetch expensive aggregates; client charts hydrate.

## 7. Definition of Done

- Dashboard renders all cards/lists/widgets from live data; deep-links + Quick Actions work.
- Analytics Overview, Pipeline, Financial, and Team pages render correct, source-reconciled numbers with working Date Range (and Monthly/Quarterly/Yearly for finance).
- Average-time-in-phase and conversion % compute from phase history and match manual spot checks.
- Charts are theme-aware and accessible; the chart wrapper isolates the library.
- Team workload metrics backfill the PHASE_3 member-detail counts.
- No aggregation causes N+1 or full-table scans on hot paths (indexed/grouped).

## 8. What NOT To Do

- Do **not** introduce new write models here — analytics is read-only.
- Do **not** compute metrics on the client from raw lists — aggregate in the query layer.
- Do **not** let analytics numbers diverge from source screens (single source of truth).
- Do **not** scatter chart-library imports across features — go through the wrapper.
- Do **not** over-build BI (custom report builder, exports) beyond the wireframes for v1.

## 9. Dependencies / Enables

- **Depends on:** PHASE_4–PHASE_10 (domain data), PHASE_1 (charts installed).
- **Enables:** operational visibility; PHASE_12 notifications/search round out the system.
