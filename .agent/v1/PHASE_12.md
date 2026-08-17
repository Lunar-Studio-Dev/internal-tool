# Phase 12 — System & Cross-cutting (Activity, Search, Notifications, Settings, Jobs)

> Depends on all prior phases. Completes the platform: the full Activity timeline, global search, notifications, settings + deactivation-reasons admin, and the Inngest scheduled jobs/workflows that keep data honest.

## 1. Objective

Round out the app with the cross-cutting features that touch every module: a system-wide Activity timeline, global search across entities, an in-app notification center, the Settings area (general + pipeline reference + deactivation reasons management), and the background jobs (overdue task reclassification, follow-up/payment reminders, stale-pipeline surfacing, notification fan-out) using Inngest.

## 2. Scope of Work (In Scope)

- Activity Timeline (WF-52): system-wide + entity-scoped views over `ActivityLog`, grouped by day, "Load More".
- Global Search (WF-53): command palette + results page across Businesses, Pipelines, Resources, Tasks.
- Notifications (WF-56): notification center, unread badge (top-bar bell from PHASE_2), Mark All Read.
- Settings (WF-54): General (company, currency, date format, timezone), Pipeline phases (read-only reference), and tabs to Team/Roles (PHASE_3).
- Deactivation Reasons admin (WF-55): list with usage, add/edit/disable (model + seed from PHASE_5).
- User Profile page (WF-57 menu targets): profile, my tasks, notifications, settings.
- **Inngest** jobs: overdue reclassification/notify, follow-up & payment reminders, stale-pipeline detector, notification delivery; `/api/inngest` route wired in PHASE_1.

## 3. Requirements

### Functional
1. Activity timeline reads `ActivityLog` (populated since PHASE_4) system-wide and per business/pipeline/member; paginated by day — WF-52.
2. Global search returns grouped results (Businesses/Pipelines/Resources/Tasks); ⌘K palette + full results page; each result deep-links — WF-53.
3. Notifications: payment received, meeting reminders, task overdue, quotation uploaded, pipeline deactivated, etc.; unread count on the bell; Mark All Read — WF-56.
4. Settings General persists company name, currency (default INR), date format, timezone (default Asia/Kolkata); pipeline phases shown read-only (fixed workflow) — WF-54.
5. Deactivation Reasons: list with usage counts; add/edit/disable (disabled reasons hidden from new deactivations, kept for history) — WF-55.
6. Inngest jobs:
   - **Overdue reclassification**: daily/hourly — find tasks past due & not done → emit notifications (status stays; Overdue is derived per PHASE_6).
   - **Follow-up & payment reminders**: notify assignees ahead of/at due time.
   - **Stale-pipeline detector**: flag pipelines inactive N days → dashboard "Inactive/Stale" indicator (do NOT auto-deactivate — CONTEXT rule).
   - **Notification fan-out**: turn domain events into notification rows.

### Non-Functional
- Search is indexed (Postgres trigram/`ILIKE` on key columns) and capped/paginated.
- Settings are read through a cached accessor; currency/timezone feed the shared formatters (PHASE_1).
- Inngest functions are idempotent, retry-safe, and signed (`INNGEST_SIGNING_KEY`) in production; local dev uses the Inngest dev server.
- Jobs never destroy data or auto-deactivate pipelines.

## 4. End-to-End Flow / Jobs

```text
Domain events (payment.recorded, task.overdue, followup.due, quotation.uploaded, pipeline.deactivated)
        │ emitted from server actions via inngest.send(...)
        ▼
Inngest functions (/api/inngest) ──▶ create Notification rows ──▶ bell badge + center (WF-56)
Scheduled (cron):
  daily  overdue-scan     → notify overdue task assignees
  hourly reminder-scan    → follow-up/payment reminders
  daily  stale-detector   → mark pipelines stale → Dashboard indicator (PHASE_11)
Search: ⌘K palette / WF-53 → grouped results → deep link
Activity: WF-52 timeline (system + scoped)
Settings: WF-54 general + WF-55 deactivation reasons admin
```

## 5. Wireframes

**WF-52 — Activity Timeline**
```text
Activity Timeline
28 Aug 2026
 ● 03:20 PM Quotation V3 created (₹2,30,000)         John Smith
 ● 02:10 PM Requirement promoted to Quotation        Sarah Johnson
27 Aug 2026
 ● 04:20 PM Questionnaire completed                  Sarah Johnson
[ Load More ]
```

**WF-53 — Global Search**
```text
[🔍 ABC Corporation__________________]
BUSINESSES  ABC Corporation · abc.com · 3 pipelines            View ›
PIPELINES   PL-00123 · ERP · Requirement · ACTIVE              View ›
            PL-00102 · Website · Quotation · DEACTIVATED        View ›
RESOURCES   Requirements.docx · Quotation.pdf · Research.pdf
TASKS       Follow-up ABC Corporation · Tomorrow · HIGH
```

**WF-56 — Notifications**  &  **WF-54 — Settings**  &  **WF-55 — Deactivation Reasons**
```text
WF-56: ● Payment received from ABC → PL-00123 moved to Project   5 min ago
       ● Requirement meeting in 30 min · ABC · PL-00123          30 min
       ● Task overdue: Follow up BuildPro                        2 h
       [ Mark All as Read ]

WF-54: [General][Pipeline][Team & Roles][Deactivation Reasons][Account]
       Company [Lunar Studio] Currency [INR ▾] Date [DD MMM YYYY ▾] TZ [Asia/Kolkata ▾]
       Pipeline phases 1..6 (fixed, read-only)                    [ Save Changes ]

WF-55: Deactivation Reasons                               [ + Add Reason ]
       No current requirement · 12 · Edit·Disable
       Price too high · 6 · Edit·Disable
```

## 6. Technical Design / Architecture

### Model additions
```prisma
enum NotificationType { PAYMENT MEETING TASK_OVERDUE QUOTATION PIPELINE FOLLOWUP SYSTEM }

model Notification {
  id        String  @id @default(cuid())
  recipientId String                 // TeamMember
  type      NotificationType
  title     String
  body      String?
  entityType String?  entityId String?
  readAt    DateTime?
  createdAt DateTime @default(now())
  @@index([recipientId, readAt, createdAt])
}

model AppSettings {
  id         String @id @default("singleton")
  companyName String @default("Lunar Studio")
  currency   String @default("INR")
  dateFormat String @default("DD MMM YYYY")
  timezone   String @default("Asia/Kolkata")
  staleDays  Int    @default(14)
  updatedAt  DateTime @updatedAt
}
// DeactivationReason: from PHASE_5 (add usage list/admin here)
// Pipeline: add `lastActivityAt` + `isStale` (set by detector) for the dashboard indicator
```

### Inngest
```ts
// src/lib/inngest/client.ts
import { Inngest } from "inngest";
export const inngest = new Inngest({ id: "lunar-internal-tool" });

// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import * as fns from "@/lib/inngest/functions";
export const { GET, POST, PUT } = serve({ client: inngest, functions: Object.values(fns) });

// src/lib/inngest/functions/overdue-scan.ts (example: scheduled)
export const overdueScan = inngest.createFunction(
  { id: "overdue-scan" },
  { cron: "0 * * * *" },
  async ({ step }) => { /* find overdue tasks → notify assignees (idempotent) */ }
);
```
Server actions emit events (`inngest.send({ name: "payment.recorded", data })`); functions fan out to `Notification` rows. The stale detector sets `Pipeline.isStale` for the PHASE_11 dashboard indicator — it never deactivates.

### Search
```ts
// src/features/search/server/search.queries.ts
export async function globalSearch(q: string) {
  // parallel ILIKE/trigram queries across businesses, pipelines, resources, tasks; cap each group
}
```

### Feature folders
```text
src/features/activity/      components(timeline, day-group) server(queries) hooks
src/features/search/        components(command-palette, results) server(queries) hooks
src/features/notifications/ components(center, bell, item) server(actions, queries) hooks
src/features/settings/      components(general-form, pipeline-reference, reasons-admin) server(actions, queries) hooks schemas
src/lib/inngest/functions/  overdue-scan  reminder-scan  stale-detector  notify
```

## 7. Definition of Done

- Activity timeline shows system-wide + scoped history grouped by day with pagination; entity tabs (business/pipeline/member Activity) all read it.
- Global search (⌘K + results page) returns grouped, deep-linking results across the four entity types.
- Notifications generate from real events, badge the bell, and Mark All Read works.
- Settings persist and drive the shared currency/date/timezone formatters; deactivation reasons admin add/edit/disable works and respects history.
- Inngest dev server runs the four jobs; overdue/reminder notifications fire; stale detector flags (never deactivates); functions are idempotent and signed in prod.
- `/api/inngest` deploys on Vercel and registers functions.

## 8. What NOT To Do

- Do **not** auto-deactivate stale pipelines — only surface an indicator (CONTEXT rule).
- Do **not** hard-delete notifications/activity or purge history.
- Do **not** let deactivation-reason disable break historical references — hide from new use only.
- Do **not** allow editing the fixed six-phase workflow in Settings (display-only).
- Do **not** run heavy scans inline in request handlers — use Inngest scheduled functions.
- Do **not** expose Inngest signing keys or run unsigned functions in production.

## 9. Dependencies / Enables

- **Depends on:** all prior phases (events to react to, data to search/aggregate); PHASE_1 (Inngest wired), PHASE_2 (bell/search slots), PHASE_4 (ActivityLog), PHASE_5 (deactivation reasons).
- **Enables:** v1 feature-complete. Next: hardening, E2E tests, and Vercel production deploy.
