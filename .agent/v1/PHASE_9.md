# Phase 9 — Pipeline Lifecycle: Reactivation & Re-entry

> Depends on PHASE_8 (full phase machine + payment). Completes the "business returns" story: a deactivated pipeline can be **reactivated** and resumes at the phase it was stopped at, the number of deactivate/reactivate cycles is tracked, and payment stays locked until the pipeline is active again. **Strictly reuses existing UI — no new screens, no new patterns.**

## 1. Objective

Handle returning businesses and dead-but-not-deleted pipelines. A deactivated pipeline can be reactivated and resumes at its **previous (current) phase** — it never restarts at Discovery. A genuinely new opportunity gets a new pipeline via the existing create flow. Payment arriving after deactivation follows: reactivate → payment unlocks → record → auto-promote to Project Management. Every deactivate/reactivate cycle is counted on the pipeline for history and analytics (PHASE_11).

## 2. Scope of Work (In Scope)

- Track **how many times** a pipeline has been deactivated and reactivated (DB counters) — review point #1.
- `reactivatePipeline()` state-machine service: `DEACTIVATED → ACTIVE`, restore the stopped phase, stamp `reactivatedAt/ById`, increment `reactivationCount`, log the event.
- Reactivation confirmation dialog (notes-only) — mirrors the existing `deactivate-dialog.tsx` — WF-31.
- Surface reactivation **only through existing UI** (review point #2):
  - Pipeline detail: Reactivate action in the existing header action slot (empty today when deactivated); deactivation/reactivation counts added to the existing "Deactivated" Overview card — WF-29.
  - Business detail → Pipelines tab: the existing pipelines DataTable already serves as pipeline history (WF-33) and the existing `PipelineCreateDialog` already serves "new pipeline for this business" (WF-32); add a **Reactivate row action** for `DEACTIVATED` rows, mirroring the existing Complete row action — WF-30/33.
- Payment-after-deactivation gate (review point #3): keep payment locked while deactivated; add an explicit guard message + a muted hint.

### Out of scope / explicitly NOT built (reuse-first)

- No standalone "Returning business decision" screen — the business Pipelines tab already lists full history + New pipeline + open-to-reactivate.
- No new `pipeline-history` / `new-pipeline-from-business` / `returning-decision` components.
- No mobile layout changes — tabs stay the existing `SectionTabs` dropdown (`<Select>` under `md`).

## 3. Requirements

### Functional
1. **Cycle counters** — `Pipeline.deactivationCount` and `Pipeline.reactivationCount` track how many times the pipeline was deactivated/reactivated. Deactivate increments the former; reactivate increments the latter. Existing deactivated pipelines are backfilled to `deactivationCount = 1` — review point #1.
2. Reactivate resumes the **same** pipeline at the phase it was stopped at (`currentPhase` is preserved through deactivation), flips `status → ACTIVE`, and re-activates that phase row (`PhaseStatus.DEACTIVATED → ACTIVE`) — WF-31.
3. Reactivation is recorded as an activity (`pipeline.reactivated`) plus `reactivatedAt` / `reactivatedById` stamps. **No** new `PipelineStatus` value — REACTIVATED is an event, not a stored status.
4. Reactivation entry points are the existing header action slot (pipeline detail) and a Reactivate row action in the business Pipelines tab — no new screens (review point #2).
5. "Create New Pipeline" for a returning business is the **existing** `PipelineCreateDialog` (pre-filled `businessId`, starts at Discovery); prior pipelines are untouched — WF-32.
6. Pipeline history per business is the **existing** business Pipelines DataTable (code / opportunity / phase / status / decision / value / created) — WF-33.
7. **Payment stays locked while deactivated** and reopens only after reactivation — review point #3. Path: reactivate → record initial payment (PHASE_8) → auto-promote to Project Management.

### Non-Functional
- Reactivation is transactional; the status guard (`status === DEACTIVATED`) inside the transaction prevents a double-submit from double-activating or double-incrementing the counter (mirrors the existing deactivate guard).
- No historical data is destroyed on reactivation — quotations, resources, tasks, follow-ups, activity, payments and the prior deactivation stamps all remain intact.
- Strict UI reuse: only existing shared components (`SectionTabs`, `DataTable`, `Dialog`, `MetricCard`, `StatusBadge`, `FieldLabel/FieldError`, `PageHeader`) and existing API/TanStack-Query conventions are used.

## 4. End-to-End User Flow

```text
Business returns → Business detail ▸ Pipelines tab (existing DataTable = history)
   ├─ Continue existing → open a DEACTIVATED pipeline  OR  use the row's Reactivate action
   │        → Reactivation dialog (WF-31) → status DEACTIVATED→ACTIVE, resume stopped phase
   └─ New opportunity → existing "New pipeline" dialog (businessId prefilled) → Discovery ACTIVE

Payment-after-deactivation:
   Deactivated pipeline → Reactivate (WF-31) → Payments tab unlocks → Record payment (PHASE_8) → auto-promote → Project
```

## 5. Wireframes (Desktop + Mobile)

### WF-29 — Deactivated Pipeline Detail (existing `pipeline-detail.tsx`)

Desktop — header action slot (empty today when deactivated) now holds Reactivate; Overview "Deactivated" card gains count cells:
```text
ABC Corporation · Website Redesign · PL-00123                    [■ DEACTIVATED]
[ Discovery→Business→Requirement→Quotation→Project  (stepper, deactivated styling) ]
┌ tabs: Overview Details Tasks Follow-ups Resources Quotation Payments Activity ┐   [ ↻ Reactivate ]
│ ── Overview ─────────────────────────────────────────────────────────────── │
│ ┌ Deactivated ───────────────────────────────────────────────────────────┐  │
│ │ Reason: Price too high   By: John D.   On: 15 Aug 2026                   │  │
│ │ Times deactivated: 2     Times reactivated: 1                            │  │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ (normal overview cards below — unchanged)                                     │
└───────────────────────────────────────────────────────────────────────────── ┘
```

Mobile (tabs collapse to the existing `<Select>` dropdown; Reactivate button is full-width `w-full` under the tab select — same slot/classes as `PipelineActions`):
```text
ABC · Website Redesign
PL-00123                       [■ DEACTIVATED]
[ ===== stepper (scrolls) ===== ]
[ Overview ▾ ]        ← SectionTabs dropdown (unchanged)
[ ↻ Reactivate            (full width) ]
┌ Deactivated ───────────────────────────┐
│ Reason: Price too high                  │
│ By: John D.      On: 15 Aug 2026        │
│ Times deactivated: 2  reactivated: 1    │
└─────────────────────────────────────────┘
```

### WF-31 — Reactivation Dialog (new `reactivation-dialog.tsx`, mirrors `deactivate-dialog.tsx`, `sm:max-w-md`)
```text
Reactivate pipeline
Resumes ABC Corporation · PL-00123 at its previous phase. History is preserved.
Business ABC Corporation   ·   Pipeline PL-00123   ·   Resumes at Quotation
Notes  [_______________________________________________]
After: DEACTIVATED ─────▶ ACTIVE (Quotation)
                                   [ Cancel ]   [ ↻ Reactivate ]
```
Mobile: identical dialog; full-width stacked buttons (shadcn `DialogFooter` default). Trigger is the header button / row action.

### WF-30 & WF-33 — Business ▸ Pipelines tab (existing `business-pipelines-tab.tsx`, unchanged layout)
```text
[ Active ][ Deactivated ][ In progress ][ Pipeline value ]        (existing MetricCards)
[ search…  | filters | New pipeline ]                            (existing ListFilterBar → WF-32)
┌ ID ┬ Opportunity ┬ Phase ┬ Status ┬ Decision ┬ Value ┬ Owner ┬ Created ┬        ┐
│PL-1│ Website     │ Quot. │■DEACT. │ Later    │ ₹4.5L │ John  │ 15 Aug  │[↻ React.]│  ← row action added
│PL-2│ ERP         │ Proj. │●ACTIVE │ Accepted │ ₹9.0L │ Sarah │ 03 Mar  │[✓ Compl.]│
└──────────────────────────────────────────────────────────────────────────────── ┘
```
Mobile: the existing `DataTable` keeps its current responsive behavior (unchanged); the Reactivate action sits in the same actions column as Complete.

### Payments tab while deactivated (existing `payment-pending-panel.tsx`)
```text
Payment status                              [■ status badge]
Contract total  Received  Initial remaining  Contract remaining
(no action buttons — hidden while deactivated)
» This pipeline is deactivated. Reactivate it to record payments.   ← muted hint added
```

## 6. Technical Design / Architecture (reuse existing conventions)

### Model additions (`prisma/schema.prisma` → `Pipeline`)
```prisma
model Pipeline {
  // …existing…
  deactivationReasonId String?
  deactivatedAt        DateTime?
  deactivatedById      String?
  reactivatedAt        DateTime?   // NEW — last reactivation stamp
  reactivatedById      String?     // NEW — denormalized member id (no FK), like deactivatedById
  deactivationCount    Int      @default(0)  // NEW — review point #1
  reactivationCount    Int      @default(0)  // NEW — review point #1
}
```
- **No `previousPhase` column.** `deactivatePipeline` only flips the current `PipelinePhase` row to `DEACTIVATED`; it never mutates `Pipeline.currentPhase`. So `currentPhase` already holds the stopped phase and reactivation resumes from it.
- **No new `PipelineStatus` enum value.** REACTIVATED = `ActivityLog` event + stamps.
- Migration `20260821000000_phase9_reactivation_counts`: `ADD COLUMN IF NOT EXISTS` ×4 (idempotent, matches repo convention) + backfill `UPDATE "pipeline" SET "deactivationCount" = 1 WHERE "deactivatedAt" IS NOT NULL`.

### Reactivation service (`src/features/pipelines/server/state-machine.ts`, mirrors `deactivatePipeline`)
```ts
export async function reactivatePipeline(params: {
  pipelineId: string; actorId: string; notes?: string;
}): Promise<TransitionResult> {
  const result = await db.$transaction(async (tx) => {
    const pipeline = await tx.pipeline.findUnique({ where: { id: params.pipelineId } });
    if (!pipeline) throw new Error("Pipeline not found.");
    if (pipeline.status !== PipelineStatus.DEACTIVATED) {
      throw new Error("Only a deactivated pipeline can be reactivated.");   // idempotent guard
    }
    const resume = pipeline.currentPhase;                                    // preserved through deactivation
    await tx.pipelinePhase.updateMany({
      where: { pipelineId: pipeline.id, type: resume, status: PhaseStatus.DEACTIVATED },
      data: { status: PhaseStatus.ACTIVE },
    });
    await tx.pipeline.update({
      where: { id: pipeline.id },
      data: {
        status: PipelineStatus.ACTIVE,
        reactivatedAt: new Date(),
        reactivatedById: params.actorId,
        reactivationCount: { increment: 1 },
      },
    });
    return { businessId: pipeline.businessId, from: resume, to: resume };
  });
  await logActivity({ actorId: params.actorId, action: "pipeline.reactivated", entityType: "Pipeline",
    entityId: params.pipelineId, businessId: result.businessId, pipelineId: params.pipelineId,
    metadata: { phase: result.to, notes: params.notes ?? null } });
  return result;
}
```
`deactivatePipeline` gains `deactivationCount: { increment: 1 }` in its existing `pipeline.update`. Deactivation stamps (`deactivatedAt/ById/reasonId`) are **left in place** on reactivation to preserve the last-deactivation record.

### Wiring (existing files, existing patterns)
| Layer | File | Change |
|---|---|---|
| zod | `schemas/pipeline.schema.ts` | `reactivatePipelineSchema = { pipelineId, notes }` (mirrors complete) |
| action | `server/pipelines.actions.ts` | `reactivatePipelineAction` (`requirePermission("pipeline:write")` → parse → `reactivatePipeline` → `{ok}`) |
| route | `app/api/pipelines/[id]/reactivate/route.ts` | thin `handleApi`+`fromService`+`readJson` (copy of deactivate route) |
| query hook | `features/pipelines/api.ts` | `useReactivatePipeline` (POST `/reactivate`, `onSuccess: invalidatePipelineWrites`) |
| DTO | `server/pipelines.queries.ts` | resolve `reactivatedByName` via `memberNameMap`; counts flow through `...rest` automatically |
| dialog | `components/reactivation-dialog.tsx` | mirrors `deactivate-dialog.tsx` (notes-only, `parseForm`, `mutationErrorMessage`, toast) |
| detail | `components/pipeline-detail.tsx` | header slot: `deactivated && canWrite` → Reactivate; Overview card: count cells |
| business tab | `businesses/components/business-pipelines-tab.tsx` | Reactivate row action for `status === "DEACTIVATED"` |

### Payment-after-deactivation gate (review point #3)
Already enforced today: `isPipelinePaymentEligible()` returns `false` unless `status === ACTIVE`, so `recordPaymentAction` rejects and `getPaymentStatusForPipeline` sets `canRecordPayment=false` / `awaitingInitial=false` (UI hides all payment actions). Phase 9 additions:
- `recordPaymentAction`: explicit `status !== ACTIVE` check returning "Reactivate the pipeline before recording payment." (clearer than the generic phase message).
- `payment-pending-panel.tsx`: muted hint when `deactivated`.

## 7. Definition of Done

- `Pipeline` has `reactivatedAt`, `reactivatedById`, `deactivationCount`, `reactivationCount`; migration applied; existing deactivated pipelines backfilled to `deactivationCount = 1`.
- Deactivate increments `deactivationCount`; reactivate increments `reactivationCount`; both counts render in the Overview "Deactivated" card.
- Reactivation flips `DEACTIVATED → ACTIVE`, restores the stopped phase, preserves all history + prior stamps, logs `pipeline.reactivated`, and is safe against double submits.
- Reactivate is reachable from the pipeline-detail header slot and the business Pipelines tab row action — no new screens; mobile tabs unchanged (`SectionTabs` dropdown).
- New pipeline for a returning business uses the existing create dialog (Discovery, prior pipelines untouched); business Pipelines tab is the history view.
- Payment stays locked while deactivated (clear message + hint) and unlocks after reactivation; reactivate → record → auto-promote works end to end.
- `next build` type-checks clean.

## 8. What NOT To Do

- Do **not** restart a reactivated pipeline at Discovery — resume `currentPhase`.
- Do **not** add a `PipelineStatus.REACTIVATED` value or a `previousPhase` column.
- Do **not** build new screens/components for returning-decision, history, or new-from-business — reuse the business Pipelines tab + existing create dialog.
- Do **not** change existing UI/UX or the mobile tab dropdown behavior.
- Do **not** clear or detach historical quotations / resources / tasks / follow-ups / activity / payments (or the prior deactivation stamps) on reactivation.
- Do **not** allow recording payment on a deactivated pipeline.

## 9. Dependencies / Enables

- **Depends on:** PHASE_8 (full phase machine incl. payment gate), PHASE_5 (pipeline engine + phase rows).
- **Enables:** complete pipeline lifecycle; accurate won/lost/reactivated + cycle-count inputs for PHASE_11 analytics and PHASE_12 stale-pipeline surfacing.
