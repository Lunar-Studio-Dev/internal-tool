# Phase 7 — Six-Phase Workflow: Contact Info → Quotation

> Depends on PHASE_5 (engine) and PHASE_6 (tasks/resources). Fills in the actual content and outcome screens for the workable phases. Introduces versioned quotations and the AI Gateway assist.

## 1. Objective

Implement the content, capture forms, and promote/deactivate outcomes for phases ①–⑤: Business Contact Info, Discovery Call, Business Understanding, Requirement Meet (with a template-driven questionnaire), and Quotation Meet (with non-destructive versioning and the client decision). Phase ⑥ (Project) is reached only through the payment gate in PHASE_8.

## 2. Scope of Work (In Scope)

- Phase ① Contact Info (read-through of business profile + contacts + research) — WF-17.
- Phase ② Discovery (meeting, notes, checklist, outcome) + Deactivate dialog — WF-18, WF-19.
- Phase ③ Business Understanding (model, processes, pain points, opportunities) — WF-20.
- Phase ④ Requirement Meet + Questionnaire form (template, sections, progress) — WF-21, WF-22.
- Phase ⑤ Quotation Meet (versions V1..Vn, current/superseded, client decision Pending/Accepted/Rejected/Later) + Create Quotation (line items, initial payment, terms, validity) — WF-23, WF-24.
- AI assist (Vercel AI Gateway): draft a requirement questionnaire / summarize understanding — optional, behind a button.
- Wire Promote transitions to the PHASE_5 state machine; "Accepted → Payment Pending" hands to PHASE_8.

## 3. Requirements

### Functional
1. Each workable phase supports common actions: notes, meeting scheduling, tasks, follow-ups, resources (via PHASE_6) — resolves as Promote or Deactivate(reason) — WF-16 pattern.
2. Discovery answers "can we provide meaningful value?"; checklist + outcome captured — WF-18.
3. Business Understanding captures high-level model/process/pain-points/opportunities/stakeholders (not detailed requirements) — WF-20.
4. Requirement captures business/functional/technical requirements, features, users, integrations, timeline, constraints; questionnaire built from a selectable internal template; progress tracked; Save Draft / Save & Continue — WF-21, WF-22.
5. Quotation supports multiple versions; **previous versions are never overwritten** and stay accessible (V1/V2/V3 with Superseded/Current) — WF-23.
6. Create Quotation captures scope, line items (item/qty/rate/amount), subtotal, initial payment amount, payment terms, valid-until; can generate/attach a PDF resource — WF-24.
7. Client decision: **Accepted** → does NOT auto-promote; routes to Payment Pending (PHASE_8). **Rejected** → deactivate with reason. **Later** → keep active with a future-dated follow-up (PHASE_6) rather than deactivating — WF-23 and CONTEXT rules.

### Non-Functional
- Phase payload writes are transactional and audited; promoting requires the phase to be ACTIVE.
- Quotation versioning is append-only; the "current" pointer moves, rows are immutable once superseded.
- AI assist is optional, rate-limited, and never blocks manual entry; output is editable draft text only.

## 4. End-to-End User Flow

```text
① Contact Info (WF-17) ─[Continue to Discovery]─▶
② Discovery (WF-18) ── Deactivate(WF-19) ▶ history
                    └─ Promote ▶ ③ Understanding (WF-20)
                                  └─ Promote ▶ ④ Requirement (WF-21) + Questionnaire (WF-22)
                                                └─ Promote ▶ ⑤ Quotation (WF-23) + Create (WF-24)
                                                              ├─ Accepted ─▶ Payment Pending (PHASE_8)
                                                              ├─ Rejected ─▶ Deactivate(reason)
                                                              └─ Later    ─▶ future-dated Follow-up (stay ACTIVE)
```

## 5. Wireframes

**WF-17 — Phase ① Business Contact Info**
```text
① Business Contact Info
┌ BUSINESS PROFILE ─ Name/Website/Email/Phone/Industry/Location ┐
┌ CONTACTS ─ James (Owner) · Priya (Manager) ─────────────────┐
┌ BUSINESS RESEARCH / METRICS ─ Notes + [Add Resource][Add Note]┐
                                        [ Continue to Discovery ]
```

**WF-18 — Phase ② Discovery Call**  (+ **WF-19** Deactivate dialog)
```text
② Discovery Call                                         [● ACTIVE]
┌ MEETING ─ Date/Time/Owner/Link [Schedule] ┐  ┌ DISCOVERY NOTES ─ understanding / pain points ┐
┌ CHECKLIST ─ □ Understand business □ Pain points □ Software opportunity □ Can we add value? ┐
Outcome:              [ Deactivate ]        [ Promote to Business ]
Deactivate (WF-19): Reason * [ No current requirement ▾ ] + Notes → pipeline preserved/reactivatable
```

**WF-20 — Phase ③ Business Understanding**
```text
③ Business Understanding                                 [● ACTIVE]
What does the business do? / How does it operate? / Current processes  [textareas]
┌ PROBLEMS / PAIN POINTS ┐   ┌ OPPORTUNITIES ┐
[Add Note][Schedule Meeting][Add Resource][Add Task]
              [ Deactivate ]        [ Promote to Requirement ]
```

**WF-21 — Phase ④ Requirement Meet**  &  **WF-22 — Questionnaire**
```text
④ Requirement Meet                                       [● ACTIVE]
QUESTIONNAIRE Template [Software Development ▾]
 [✓]Business Problem [✓]Users [✓]Features [✓]Integrations [✓]Timeline [✓]Constraints
 [Open Questionnaire][Send Questionnaire]   Meeting [26 Aug][3PM][Sarah ▾]
REQUIREMENTS: Business / Functional / Integrations / Timeline / Constraints [textareas]
              [ Deactivate ]        [ Promote to Quotation ]
WF-22: progress bar + numbered sections (Problem/Users/Features/Integrations/Timeline) [Save Draft][Save & Continue]
```

**WF-23 — Phase ⑤ Quotation Meet**  &  **WF-24 — Create Quotation**
```text
⑤ Quotation Meet                                         [● ACTIVE]
┌ QUOTATION ─ Version V3 · ₹2,30,000 · Valid 30 Sep [View][Upload New Version] ┐
┌ CLIENT DECISION ─ (●)Pending  [Accepted][Rejected][Later] ┐
┌ QUOTATION HISTORY ─ V1 Superseded · V2 Superseded · V3 Current ┐
[Deactivate]                    [ Accepted → Payment Pending ]  (PHASE_8)
Create (WF-24): Version, Title, Scope, line items (item/qty/rate/amount), Subtotal,
                Initial Payment, Payment Terms, Valid Until  [Save Draft][Generate PDF][Share]
```

## 6. Technical Design / Architecture

### Prisma models (phase payloads + quotation)
```prisma
enum QuotationVersionStatus { DRAFT CURRENT SUPERSEDED }
enum ClientDecision { PENDING ACCEPTED REJECTED LATER }

model BusinessUnderstanding {           // 1:1 with a pipeline's understanding phase
  id String @id @default(cuid())
  pipelineId String @unique
  model String?  operations String?  processes String?
  painPoints Json?  opportunities Json?  stakeholders Json?
  updatedAt DateTime @updatedAt
}

model Requirement {                     // 1:1 with a pipeline's requirement phase
  id String @id @default(cuid())
  pipelineId String @unique
  templateKey String?
  businessReq String?  functionalReq String?  technicalReq String?
  features Json?  users Json?  integrations String?  timeline String?  constraints String?
  questionnaire Json?                   // section answers + progress
  updatedAt DateTime @updatedAt
}

model Quotation {                       // one row per version (append-only)
  id String @id @default(cuid())
  pipelineId String
  version Int                           // 1,2,3…
  title String?
  scope String?
  items Json                           // [{item, qty, rate, amount}]
  subtotal Int                          // paise
  initialPayment Int                    // paise (gate amount)
  paymentTerms String?
  validUntil DateTime?
  status QuotationVersionStatus @default(DRAFT)
  pdfResourceId String?                 // → Resource (R2)
  createdById String?
  createdAt DateTime @default(now())
  @@unique([pipelineId, version])
  @@index([pipelineId])
}

model PipelineDecision {               // current client decision at Quotation
  pipelineId String @id
  decision ClientDecision @default(PENDING)
  decidedAt DateTime?
}
```

### Services & AI assist
```text
src/features/phases/
├─ components/ contact-info  discovery  understanding  requirement  questionnaire  quotation  create-quotation  decision-panel
├─ server/     phases.actions.ts (save payload, promote/deactivate wrappers)
│              quotations.actions.ts (createVersion → sets prior CURRENT→SUPERSEDED in a tx)
│              decision.actions.ts (accept→handoff to PHASE_8 payment; reject→deactivate; later→followup)
├─ hooks/      use-phase.ts  use-quotations.ts
└─ schemas/    understanding.schema.ts  requirement.schema.ts  quotation.schema.ts
```
```ts
// src/lib/ai.ts — Vercel AI Gateway (single credential; model swap = string change)
import { generateText } from "ai";
export const draftQuestionnaire = (ctx: string) =>
  generateText({ model: "google/gemini-3-flash", prompt: buildPrompt(ctx) }); // AI_GATEWAY_API_KEY
```
- Accept flow does NOT promote; it creates/returns a Payment-Pending context consumed by PHASE_8.
- Quotation "Upload New Version" or "Create" wraps in a transaction: new row `CURRENT`, previous `CURRENT`→`SUPERSEDED`; optional PDF stored as a Resource (PHASE_6/R2).

## 7. Definition of Done

- All five workable phase screens capture and persist their payloads; Promote uses the PHASE_5 engine and moves to the next phase.
- Deactivate from any phase requires a reason and preserves the pipeline (WF-19).
- Requirement questionnaire saves drafts, tracks progress, and supports template selection; AI assist produces editable draft text (or is cleanly disabled if no key).
- Quotation versioning is append-only and correct: exactly one CURRENT, others SUPERSEDED, all viewable; amounts stored in paise.
- Client decision routes correctly: Accepted → Payment Pending handoff, Rejected → deactivate, Later → future follow-up (stays ACTIVE).
- Every save/promote/deactivate/decision is audited.

## 8. What NOT To Do

- Do **not** overwrite or delete prior quotation versions (rule #12 / append-only).
- Do **not** auto-promote to Project on Accept — payment is the gate (PHASE_8).
- Do **not** build a heavy custom questionnaire/workflow builder (CONTEXT: keep simple; templates only).
- Do **not** deactivate on "Later" — schedule a follow-up and keep the pipeline active.
- Do **not** let AI output persist unreviewed or block manual entry.
- Do **not** re-implement the phase state transitions here — call PHASE_5's service.

## 9. Dependencies / Enables

- **Depends on:** PHASE_5 (engine), PHASE_6 (tasks/resources), PHASE_1 (AI SDK/R2).
- **Enables:** PHASE_8 (payment gate + project handoff), and feeds the handoff bundle.
