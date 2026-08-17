# Phase 5 — Pipeline Core & Phase State Machine

> Depends on PHASE_4. Introduces Pipelines and the fixed six-phase engine (creation, current-phase tracking, promote/deactivate transitions). This is the backbone the phase-specific screens (PHASE_7) hang off.

## 1. Objective

Let a Business hold multiple concurrent Pipelines, each starting at Discovery and moving forward sequentially through six fixed phases. Implement the authoritative state machine for phase status (ACTIVE → PROMOTED or → DEACTIVATED) plus the generic Pipeline overview, stepper, and phase-view shell. Seed deactivation reasons (needed by the deactivate action).

## 2. Scope of Work (In Scope)

- `Pipeline`, `PipelinePhase`, `DeactivationReason` models + enums.
- Pipelines list (search/phase/status/owner/date filters) — WF-13.
- Create Pipeline from a Business (name, opportunity type, lead source, assignee, notes; initial phase = Discovery, status = ACTIVE) — WF-14.
- Pipeline overview: header, `PipelineStepper`, current-phase card, next action, recent activity, sub-tabs — WF-15.
- Generic Phase View shell (phase info, notes, phase tasks/resources slots, Deactivate / Promote actions) — WF-16.
- **State-machine service**: `promotePhase`, `deactivatePipeline` (reason required), guards for sequential/forward-only movement. (Reactivation lives in PHASE_9.)
- Seed default deactivation reasons.

## 3. Requirements

### Functional
1. Create Pipeline requires an existing Business (search/select) — WF-14; multiple active pipelines per business are allowed (rule #2/#3).
2. New pipeline: `currentPhase = DISCOVERY`, `status = ACTIVE`; Business Contact Info (phase 1) is informational, not a workable phase.
3. Promote advances `currentPhase` to the next phase in fixed order, marks the prior phase PROMOTED, records Promoted By/At/Notes — WF-16.
4. Deactivate sets pipeline `status = DEACTIVATED` at the current phase with a **required reason** + optional notes; the Business stays active — WF-16, and see WF-19 pattern.
5. Movement is forward-only and sequential; you cannot skip phases or move a DEACTIVATED pipeline (until reactivated in PHASE_9).
6. Pipeline list + business "Active Pipelines / History" now show real data (fills PHASE_4 placeholders).
7. Every transition writes an `ActivityLog` entry.

### Non-Functional
- Transitions run in a DB transaction; illegal transitions throw and change nothing.
- Phase order is a single source of truth (`PHASE_ORDER` constant) shared by stepper + service.
- Human-readable pipeline code (PL-00123) generated deterministically and unique.

## 4. Phase model & transitions

```text
Fixed order:  ① Business Contact Info → ② Discovery → ③ Business Understanding
              → ④ Requirement → ⑤ Quotation → ⑥ Project Management
Per active phase:   ACTIVE ──promote──▶ (next phase ACTIVE, this = PROMOTED)
                    ACTIVE ──deactivate(reason)──▶ pipeline DEACTIVATED @ phase
Quotation → Project is gated by payment (PHASE_8), not a plain promote.
Reactivation (DEACTIVATED → ACTIVE at previous phase) = PHASE_9.
```

## 5. Wireframes

**WF-13 — Pipelines List**
```text
Pipelines                                             [ + New Pipeline ]
[ Search…] [ Phase ▾ ] [ Status ▾ ] [ Owner ▾ ] [ Date ▾ ]
┌────────┬───────────┬───────────────┬───────────┬──────────┬────────┐
│ ID     │ BUSINESS  │ OPPORTUNITY   │ PHASE     │ STATUS   │ OWNER  │
├────────┼───────────┼───────────────┼───────────┼──────────┼────────┤
│ PL-001 │ ABC Corp  │ ERP Automation│ Requirement│ ACTIVE  │ John   │
│ PL-004 │ GreenLeaf │ CRM           │ Quotation │ DEACTIVE │ John   │
└────────┴───────────┴───────────────┴───────────┴──────────┴────────┘
```

**WF-14 — Create Pipeline**
```text
BUSINESS  [ Search existing business… ] [Select]   → ABC Corporation ✓
Pipeline Name *   [__________________]
Opportunity Type  [__________________]
Lead Source       [ Website ▾ ]      Assigned To [ John Smith ▾ ]
Notes             [__________________________________]
Initial Phase: DISCOVERY     Initial Status: ACTIVE
                                   [ Cancel ]  [ Create Pipeline ]
```

**WF-15 — Pipeline Overview**
```text
ABC Corporation · ERP Automation                         PL-00123
[● ACTIVE]  Owner: John Smith                            [ ⋮ Actions ]
[ ① Contact →② Discovery →③ Understanding →④ Requirement →⑤ Quotation →⑥ Project ]  ← WF-04 stepper
┌ CURRENT PHASE: REQUIREMENT MEET  [● ACTIVE] ───────────────────────┐
│ Meeting 26 Aug 3PM · Owner Sarah                                   │
│ [Open Phase] [Add Task] [Add Follow-up] [Add Resource]            │
└────────────────────────────────────────────────────────────────────┘
┌ NEXT ACTION ────────┐  ┌ RECENT ACTIVITY ─────────────────────────┐
│ Requirement Meeting │  │ 25 Aug questionnaire created …           │
└─────────────────────┘  └──────────────────────────────────────────┘
[Overview][Phases][Tasks][Resources][Quotation][Payments][Activity]
```

**WF-16 — Generic Phase View** (shell reused by PHASE_7 phase screens)
```text
Requirement Meet                                          [● ACTIVE]
┌ PHASE INFORMATION ─ Started / Owner / Meeting / Notes ─────────────┐
┌ PHASE TASKS ───────────────┐  ┌ PHASE RESOURCES ──────────────────┐
│ □ Prepare questionnaire    │  │ Requirement Questionnaire.pdf     │
│ [+ Add Task]               │  │ [+ Add Resource]                  │
└────────────────────────────┘  └───────────────────────────────────┘
              [ Deactivate ]                 [ Promote to Quotation ]
```

## 6. Technical Design / Architecture

### Prisma models
```prisma
enum PhaseType { CONTACT_INFO DISCOVERY BUSINESS_UNDERSTANDING REQUIREMENT QUOTATION PROJECT_MANAGEMENT }
enum PhaseStatus { ACTIVE PROMOTED DEACTIVATED }
enum PipelineStatus { ACTIVE DEACTIVATED COMPLETED }
enum LeadSource { WEBSITE INSTAGRAM LINKEDIN REFERRAL DIRECT COLD MANUAL_RESEARCH OTHER }

model Pipeline {
  id            String   @id @default(cuid())
  code          String   @unique               // PL-00123
  businessId    String
  business      Business @relation(fields: [businessId], references: [id])
  name          String
  opportunityType String?
  leadSource    LeadSource @default(OTHER)
  ownerId       String?                          // TeamMember
  notes         String?
  currentPhase  PhaseType     @default(DISCOVERY)
  status        PipelineStatus @default(ACTIVE)
  phases        PipelinePhase[]
  deactivationReasonId String?
  deactivatedAt DateTime?
  deactivatedById String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([businessId]) @@index([status]) @@index([currentPhase])
}

model PipelinePhase {
  id          String   @id @default(cuid())
  pipelineId  String
  pipeline    Pipeline @relation(fields: [pipelineId], references: [id])
  type        PhaseType
  status      PhaseStatus @default(ACTIVE)
  ownerId     String?
  startedAt   DateTime @default(now())
  promotedAt  DateTime?
  promotedById String?
  promoteNotes String?
  notes       String?
  // phase-specific payload tables attach in PHASE_7
  @@unique([pipelineId, type])
  @@index([pipelineId])
}

model DeactivationReason {
  id        String  @id @default(cuid())
  label     String  @unique
  enabled   Boolean @default(true)
  usageCount Int    @default(0)     // maintained for WF-55
}
```

### State machine (single authority)
```ts
// src/features/pipelines/server/state-machine.ts
export const PHASE_ORDER: PhaseType[] = [
  "CONTACT_INFO","DISCOVERY","BUSINESS_UNDERSTANDING","REQUIREMENT","QUOTATION","PROJECT_MANAGEMENT",
];
export function nextPhase(t: PhaseType) { /* returns following phase or null */ }

export async function promotePhase(pipelineId: string, notes?: string) {
  await requirePermission("pipeline:write");
  return db.$transaction(async (tx) => {
    // guard: pipeline ACTIVE; current phase ACTIVE; QUOTATION→PROJECT blocked here (payment gate)
    // mark current PROMOTED (promotedAt/By/notes); create next phase ACTIVE; bump currentPhase
    // logActivity("pipeline.promoted", ...)
  });
}
export async function deactivatePipeline(pipelineId: string, reasonId: string, notes?: string) {
  await requirePermission("pipeline:write");
  // set status DEACTIVATED, stamp phase, reason usageCount++, logActivity("pipeline.deactivated")
}
```

### Feature folder
```text
src/features/pipelines/
├─ components/ pipeline-table  create-pipeline-form  pipeline-header  phase-view-shell  deactivate-dialog  current-phase-card
├─ server/     pipelines.actions.ts  pipelines.queries.ts  state-machine.ts  code-generator.ts
├─ hooks/      use-pipelines.ts  use-pipeline.ts
├─ schemas/    pipeline.schema.ts
└─ constants.ts (PHASE_LABELS, PHASE_ORDER re-export)
```
Seed: `prisma/seed.ts` inserts default `DeactivationReason`s (No current requirement, Budget issue, Price too high, Client unresponsive, Not target customer, Other).

## 7. Definition of Done

- Create Pipeline attaches to a Business, generates a unique `PL-` code, starts ACTIVE at Discovery.
- Promote/deactivate go through the transactional service; illegal transitions (skip, wrong status, Quotation→Project) are rejected with clear errors and covered by tests.
- Overview renders the stepper with correct phase states; the generic phase-view shell drives Promote/Deactivate.
- Deactivate requires a seeded reason; Business remains ACTIVE; reason `usageCount` increments.
- Pipelines list + Business "Active/History" sections show real data.
- Every transition + creation logs activity.

## 8. What NOT To Do

- Do **not** build the per-phase content forms yet (Discovery/Understanding/Requirement/Quotation UIs) — that's PHASE_7; here only the generic shell + engine.
- Do **not** implement reactivation or re-entry (PHASE_9) or the payment-gated Quotation→Project promotion (PHASE_8).
- Do **not** allow phase skipping, backward moves, or editing a DEACTIVATED pipeline.
- Do **not** delete pipelines — ever.
- Do **not** hardcode phase order in multiple places; import `PHASE_ORDER`.

## 9. Dependencies / Enables

- **Depends on:** PHASE_4 (Business), PHASE_3 (owner/permissions).
- **Enables:** PHASE_6 (tasks/resources attach to pipeline+phase), PHASE_7 (phase content), PHASE_8 (payment gate), PHASE_9 (lifecycle).
