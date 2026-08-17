# Phase 9 — Pipeline Lifecycle: Reactivation & Re-entry

> Depends on PHASE_8 (full phase machine + payment). Completes the "business returns" story: deactivated-pipeline views, the continue-vs-new decision, reactivation resuming at the previous phase, and preserved history.

## 1. Objective

Handle returning businesses and dead-but-not-deleted pipelines. A deactivated pipeline can be reactivated and resumes at its previous phase (never restarts); a genuinely new opportunity gets a new pipeline; requirement changes and quotation revisions stay on the same pipeline. Payment arriving after deactivation reactivates → records payment → promotes (no forced new pipeline).

## 2. Scope of Work (In Scope)

- Deactivated Pipeline detail with deactivation details + preserved-history summary — WF-29.
- Returning Business decision screen: list previous pipelines, choose Continue Existing vs Create New — WF-30.
- Reactivation confirmation (DEACTIVATED → ACTIVE at previous phase, with notes) — WF-31.
- New Pipeline from existing business (reuses business info, starts at Discovery) — WF-32.
- Pipeline History table per business (final phase/status/created) — WF-33.
- `reactivatePipeline()` service; decision rules engine; payment-after-deactivation path (reactivate → record payment (PHASE_8) → promote).

## 3. Requirements

### Functional
1. Deactivated pipeline detail shows Stopped At, Deactivated On/By, Reason, Notes, and preserved counts (resources/tasks/quotations/activities); offers Reactivate or Create New — WF-29.
2. On a business's return, show existing business + full pipeline history and the two choices — WF-30.
3. Reactivate resumes the **same** pipeline at its previous phase (status → ACTIVE), records reactivation as an event/activity (REACTIVATED is an action, not a stored status) — WF-31; the previously-active phase becomes ACTIVE again.
4. Create New Pipeline starts a fresh opportunity at Discovery; old pipelines remain untouched — WF-32.
5. Decision rules: requirement change = same pipeline (update, keep history); new/different opportunity = new pipeline; quotation revision = new version, same pipeline; if multiple pipelines exist the user must choose which to continue; multiple active pipelines allowed — CONTEXT rules #10/#11/#12.
6. Payment after deactivation: reactivate → record payment (PHASE_8) → promote to Project (no forced new pipeline).
7. Pipeline History lists all pipelines for the business with final phase/status/created — WF-33.

### Non-Functional
- Reactivation is transactional and idempotent-safe (double-click cannot double-activate).
- No historical data is destroyed on reactivation; old quotation versions, resources, tasks, activities remain intact and linked.
- REACTIVATED is represented via `ActivityLog` + a `reactivatedAt`/`reactivatedById` stamp, not a new pipeline status enum value.

## 4. End-to-End User Flow

```text
Business returns → Returning decision (WF-30)
   ├─ Continue Existing → pick pipeline → Deactivated detail (WF-29) → Reactivate (WF-31)
   │        └─ status DEACTIVATED → ACTIVE, resume previous phase (history preserved)
   └─ Create New → New Pipeline from business (WF-32) → Discovery ACTIVE (old ones untouched)

Payment-after-deactivation: Deactivated (WF-29) → Reactivate (WF-31) → Record Payment (PHASE_8) → Project
```

## 5. Wireframes

**WF-29 — Deactivated Pipeline Detail**
```text
ABC Corporation · Website Redesign                    [■ DEACTIVATED]
[ ①→②→③→④→⑤→⑥ stepper (WF-04) ]
┌ DEACTIVATION DETAILS ─ Stopped At Quotation · On 15 Aug · By John · Reason Price too high
                         Notes: Client may reconsider ┐
┌ PRESERVED HISTORY ─ Discovery✓ Business✓ Requirement✓ Quotation✓
                      Resources 8 · Tasks 12 · Quotations 3 · Activities 31 ┐
        [ Reactivate Pipeline ]          [ Create New Pipeline ]
```

**WF-30 — Returning Business Decision**
```text
ABC Corporation Returns — Existing Business Found ✓
PREVIOUS PIPELINES:
 #001 ERP Automation  Requirement  ACTIVE
 #002 Website         Quotation    DEACTIVATED
 #003 AI Automation   Discovery    DEACTIVATED
┌ CONTINUE EXISTING ─ select [#002 Website ▾] [Continue Pipeline] ┐
┌ CREATE NEW ─ new opportunity starts at Discovery [Create New Pipeline] ┐
```

**WF-31 — Reactivation Confirmation**
```text
Reactivate Pipeline
Business ABC · Pipeline #002 Website · Previous Phase Quotation · Prev Status DEACTIVATED
Reactivation Notes [__________________________]
After: DEACTIVATED ─────▶ ACTIVE (Quotation)
⚠ Resumes from its previous phase.                 [ Cancel ] [ Reactivate ]
```

**WF-32 — New Pipeline from Existing Business**  &  **WF-33 — Pipeline History**
```text
Create New Pipeline — ABC Corporation (business info reused)
Name * [Mobile Application]  Type [Software Dev ▾]  Source [Referral ▾]  Assigned [Sarah ▾]
Starts at: ① DISCOVERY [● ACTIVE]   Previous pipelines preserved.  [Cancel][Create Pipeline]

Pipeline History (WF-33):
┌ PIPELINE ┬ OPPORTUNITY ┬ FINAL PHASE ┬ FINAL STATUS ┬ CREATED ┐
│ #001     │ Website     │ Quotation   │ DEACTIVATED  │ Jan 2026│
│ #002     │ ERP         │ Project     │ ACTIVE       │ Mar 2026│
```

## 6. Technical Design / Architecture

### Model additions
```prisma
// extend Pipeline (PHASE_5) with reactivation stamps
model Pipeline {
  // …existing…
  reactivatedAt   DateTime?
  reactivatedById String?
  previousPhase   PhaseType?   // set on deactivate so reactivate can restore it
}
```
No new pipeline status is added — REACTIVATED is an event. On deactivate (PHASE_5) also store `previousPhase = currentPhase`.

### Reactivation service
```ts
// src/features/pipelines/server/reactivation.ts
export async function reactivatePipeline(pipelineId: string, notes?: string) {
  await requirePermission("pipeline:write");
  return db.$transaction(async (tx) => {
    const p = await tx.pipeline.findUniqueOrThrow({ where: { id: pipelineId } });
    if (p.status !== "DEACTIVATED") return p;               // idempotent guard
    const resume = p.previousPhase ?? p.currentPhase;
    await tx.pipelinePhase.update({ where: { pipelineId_type: { pipelineId, type: resume } }, data: { status: "ACTIVE" } });
    const updated = await tx.pipeline.update({ where: { id: pipelineId },
      data: { status: "ACTIVE", currentPhase: resume, reactivatedAt: new Date(), reactivatedById: me.id } });
    await logActivity({ action: "pipeline.reactivated", pipelineId, metadata: { resume, notes } });
    return updated;
  });
}
```

### Decision routing (WF-30)
`resolveReturnDecision(businessId, choice)` → Continue (open deactivated detail / reactivate) OR New (open create-pipeline WF-32). Guidance surfaced inline per CONTEXT rules (requirement change vs new opportunity vs quotation revision).

### Feature folder additions
```text
src/features/pipelines/
├─ components/ deactivated-detail  returning-decision  reactivation-dialog  new-pipeline-from-business  pipeline-history
├─ server/     reactivation.ts  decisions.ts
└─ hooks/       use-pipeline-history.ts
```

## 7. Definition of Done

- Deactivated detail shows accurate deactivation info + preserved-history counts; both actions work.
- Returning decision lists all pipelines and routes to Continue (reactivate) or New correctly; multi-pipeline case forces an explicit choice.
- Reactivation flips DEACTIVATED→ACTIVE, restores the previous phase, preserves all history, logs the event, and is safe against double submits.
- Create New starts at Discovery and leaves prior pipelines untouched.
- Payment-after-deactivation path works end to end (reactivate → record payment → promote).
- Pipeline History renders per business.

## 8. What NOT To Do

- Do **not** restart a reactivated pipeline at Discovery — resume the previous phase (rule #9).
- Do **not** create a new status value for REACTIVATED — it is an activity/event.
- Do **not** force a new pipeline for requirement changes or quotation revisions (rules #11/#12).
- Do **not** destroy or detach historical quotations/resources/tasks/activities on reactivation.
- Do **not** auto-merge or auto-pick when multiple pipelines exist — require user choice.

## 9. Dependencies / Enables

- **Depends on:** PHASE_8 (full phase machine incl. payment), PHASE_5 (engine + `previousPhase`).
- **Enables:** complete pipeline lifecycle; accurate inputs for PHASE_11 analytics (won/lost/reactivated) and PHASE_12 stale-pipeline surfacing.
