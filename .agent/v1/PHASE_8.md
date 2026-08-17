# Phase 8 — Payment Gate & Project Management Handoff

> Depends on PHASE_7. Implements the money gate between Quotation and Project Management, and the clean handoff bundle. Introduces the `Transaction` (Earning) and `Project` models reused by PHASE_10.

## 1. Objective

Enforce the rule that **initial payment is the gate** to Project Management: an accepted quotation stays in Quotation (Payment Pending) until payment is recorded, at which point an Earning transaction is created, the pipeline promotes to Project Management, and a handoff package is assembled for the delivery team.

## 2. Scope of Work (In Scope)

- Payment Pending view: required vs received vs remaining, follow-up creation — WF-25.
- Record Payment: amount, date, type, reference, notes; "Create Earning Record"; supports partial + multiple payments — WF-26.
- On sufficient/initial payment → create `Transaction(EARNING)` linked to Business + Pipeline + Quotation → promote to Project Management (⑥) via the state machine.
- Phase ⑥ Project Management setup: project details + handoff checklist — WF-27.
- Handoff summary/package assembly — WF-28.
- `Transaction` (EARNING here; EXPENSE added in PHASE_10), `Payment`, `Project` models.

## 3. Requirements

### Functional
1. Accepting a quotation (PHASE_7) lands the pipeline in **Payment Pending**; the pipeline does not promote yet — WF-25.
2. Payment Pending shows Required (from quotation initial payment), Received (sum of payments), Remaining; supports adding a payment follow-up while pending — WF-25.
3. Record Payment captures amount*, date*, type (Bank Transfer/UPI/Card/Cash/Other), reference, notes; creates an Earning transaction when "Create Earning Record" is checked — WF-26.
4. Partial payments are allowed (remaining stays outstanding); multiple payments each are separate transactions — CONTEXT Accounts rules.
5. When the initial payment threshold is met, promote Quotation → Project Management (ACTIVE) — this is the ONLY path across that boundary — WF-26.
6. Project Management setup: Project Name, Code (PRJ-…), Project Manager, Start Date, Expected Deadline, notes; handoff checklist verifies bundle completeness — WF-27.
7. Handoff package bundles: Business Info + Business Understanding + Requirement + Final Quotation + Payment Info + Resources + Important Notes + Client Contacts — WF-28.
8. A payment arriving after deactivation is handled here conceptually but the reactivate→pay→promote path is finalized in PHASE_9.

### Non-Functional
- Payment recording + earning creation + phase promotion happen atomically (one transaction); partial failure rolls back all.
- Money in paise; remaining/threshold comparisons are integer-safe.
- Promotion across the gate reuses the PHASE_5 engine (no side-channel promote).

## 4. End-to-End User Flow

```text
Quotation Accepted (PHASE_7) ─▶ Payment Pending (WF-25)
   ├─ add Payment Follow-up (PHASE_6) while awaiting funds
   └─ [Record Payment] (WF-26)
         │ amount ≥ initial payment?
         ├─ yes → create Earning(Transaction) → promote ⑥ Project Mgmt (WF-27)
         └─ partial → record txn, remain in Payment Pending (outstanding tracked)
   ▼
Project Management (WF-27) → [Create Project & Handoff] → Handoff Summary (WF-28)
```

## 5. Wireframes

**WF-25 — Payment Pending**
```text
Quotation Accepted                                    [PAYMENT PENDING]
Quotation V3 · ₹2,30,000   Initial Payment Required ₹50,000
┌ PAYMENT STATUS ─ Required ₹50,000 · Received ₹0 · Remaining ₹50,000 [Record Payment] ┐
┌ FOLLOW-UP ─ □ Payment follow-up · Due 20 Aug · John  [Add Follow-up] ┐
```

**WF-26 — Record Payment**
```text
Record Payment
Business ABC Corporation   Pipeline PL-00123   Quotation V3 · ₹2,30,000
Amount * [₹ 50,000]  Date * [20 Aug]  Type [Bank Transfer ▾]  Reference [____]  Notes [____]
[✓] Create Earning Record
                 [ Cancel ]  [ Record Payment & Continue to Project ]
```

**WF-27 — Phase ⑥ Project Management Handoff**
```text
⑥ Project Management                                     [● ACTIVE]
PROJECT DETAILS: Name [ABC ERP Automation] Code [PRJ-00123] PM [Mike ▾]
                 Start [01 Sep] Deadline [30 Nov]
HANDOFF CHECKLIST: ✓ Business info ✓ Understanding ✓ Requirements ✓ Final quotation
                   ✓ Initial payment ✓ Client contacts ✓ Resources
                                       [ Create Project & Handoff ]
```

**WF-28 — Project Handoff Summary**
```text
PROJECT READY FOR HANDOFF
┌ BUSINESS ─ ABC Corporation · James · james@abc.com ┐  ┌ PROJECT ─ ERP Automation · PRJ-00123 · Mgr Mike ┐
┌ HANDOFF PACKAGE ─ ✓ Understanding ✓ Requirement ✓ Final Quotation ✓ Payment
                    ✓ Client Contacts ✓ All Resources ✓ Important Notes ┐
                              [ Open Project ]   [ View Pipeline ]
```

## 6. Technical Design / Architecture

### Prisma models
```prisma
enum TransactionType { EARNING EXPENSE }        // EXPENSE used from PHASE_10
enum PaymentMethod { BANK_TRANSFER UPI CARD CASH OTHER }
enum ProjectStatus { ACTIVE ON_HOLD COMPLETED }

model Transaction {
  id          String   @id @default(cuid())
  type        TransactionType
  amount      Int                    // paise (+earning / expense magnitude)
  date        DateTime
  category    String?                // "Initial Payment", "Software", …
  description String?
  businessId  String?
  pipelineId  String?
  quotationId String?
  reference   String?
  createdById String?
  createdAt   DateTime @default(now())
  @@index([type, date]) @@index([businessId]) @@index([pipelineId])
}

model Payment {
  id          String   @id @default(cuid())
  pipelineId  String
  quotationId String
  amount      Int
  date        DateTime
  method      PaymentMethod @default(BANK_TRANSFER)
  reference   String?
  notes       String?
  transactionId String?              // → Transaction(EARNING) when earning created
  createdAt   DateTime @default(now())
  @@index([pipelineId]) @@index([quotationId])
}

model Project {
  id          String   @id @default(cuid())
  code        String   @unique       // PRJ-00123
  pipelineId  String   @unique
  businessId  String
  quotationId String?
  name        String
  managerId   String?
  startDate   DateTime?
  deadline    DateTime?
  notes       String?
  status      ProjectStatus @default(ACTIVE)
  handoff     Json?                   // snapshot bundle references
  createdAt   DateTime @default(now())
}
```

### Payment → promote (atomic)
```ts
// src/features/payments/server/payments.actions.ts
export async function recordPayment(input: RecordPaymentInput) {
  await requirePermission("payment:write");
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.create({ data: ... });
    let txn = null;
    if (input.createEarning) txn = await tx.transaction.create({ data: { type: "EARNING", ... } });
    const received = await sumPayments(tx, input.pipelineId, input.quotationId);
    if (received >= quotation.initialPayment) {
      await promoteToProject(tx, input.pipelineId);   // reuses PHASE_5 engine (gate-aware)
    }
    await logActivity({ action: "payment.recorded", ... });
    return { payment, txn };
  });
}
```
Handoff assembly reads the pipeline's Understanding + Requirement + current Quotation + payments + resources + contacts into a `Project.handoff` snapshot for WF-28.

### Feature folders
```text
src/features/payments/  components(payment-pending,record-payment-form) server(actions,queries) hooks schemas
src/features/projects/  components(project-setup,handoff-checklist,handoff-summary) server hooks schemas
```

## 7. Definition of Done

- Accepted quotation sits in Payment Pending; required/received/remaining computed correctly (paise).
- Recording the initial payment creates an Earning transaction (when checked), links Business+Pipeline+Quotation, and promotes to Project Management in one atomic operation.
- Partial payments record and keep the pipeline pending with outstanding tracked; multiple payments accumulate.
- Project setup captures details + generates a unique PRJ code; handoff checklist reflects real bundle completeness.
- Handoff summary renders the full package; "Open Project"/"View Pipeline" navigate correctly.
- All monetary/promotion steps audited; no promote bypasses the gate.

## 8. What NOT To Do

- Do **not** promote to Project on acceptance alone — only on the payment threshold (rule #13).
- Do **not** build the full Accounts dashboards/expenses here (PHASE_10) — only the Earning transaction created by payment.
- Do **not** use floats for money or compare across currencies.
- Do **not** mutate quotation versions when recording payment.
- Do **not** implement reactivation-after-deactivation payment here (PHASE_9 finalizes that path).

## 9. Dependencies / Enables

- **Depends on:** PHASE_7 (accepted quotation + initial payment amount), PHASE_5 (engine), PHASE_6 (payment follow-ups).
- **Enables:** PHASE_9 (payment-after-deactivation path), PHASE_10 (finance module builds on Transaction), PHASE_11 (revenue analytics).
