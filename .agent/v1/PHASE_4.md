# Phase 4 — Businesses & Contacts

> Depends on PHASE_3. Builds the root domain entity. Also establishes the cross-cutting **Activity Log** foundation (`ActivityLog` model + `logActivity()`), used by every later phase.

## 1. Objective

Create the permanent Business identity with its contacts, duplicate-prevention on create, and the business detail hub (tabbed) that later phases populate. Introduce the audit-trail primitive so every meaningful mutation is recorded from here on.

## 2. Scope of Work (In Scope)

- `Business`, `Contact`, and `ActivityLog` models + `logActivity()` service.
- Businesses list with search/industry/status filters — WF-07.
- Create Business with **duplicate check** step — WF-08, WF-09.
- Business detail with tabs: Overview, Pipelines, Contacts, Resources, Tasks, Financials, Activity — WF-10 (tabs light up as later phases land; Overview + Contacts + Activity are live now).
- Contacts list + add/edit with single **Primary** enforcement — WF-11, WF-12.
- Edit Business (updates must not mutate historical pipeline snapshots).

## 3. Requirements

### Functional
1. Create Business captures: Name*, Website, Email, Phone, Industry, Location, Address, Social (LinkedIn/Instagram/Facebook/X) — WF-08.
2. On save, run a duplicate search (name / website / email / phone / contact); if matches exist, show them and prefer **Open Existing** — WF-09.
3. Only Admin/authorized users may **Create New Anyway** to force a duplicate.
4. A Business has ≥1 Contact; exactly one is Primary; changing Primary preserves historical participants — WF-11, WF-12.
5. Business list shows pipeline counts (total / active) — counts come from PHASE_5; render 0 until then.
6. Editing business info never rewrites data captured inside past pipeline phases.
7. Every create/update/contact change writes an `ActivityLog` row.

### Non-Functional
- Duplicate search is fuzzy (case-insensitive, trims domains/scheme, normalizes phone) and fast (indexed columns).
- Contact email/phone validated by Zod; website normalized to host.
- Deleting is disallowed; businesses persist forever (universal rule #1, #19).

## 4. End-to-End User Flow (New Lead)

```text
[+ New Business] → Create form (WF-08)
      │ submit
      ▼
Duplicate Check (WF-09) ── matches? ──▶ [Open Existing Business] (WF-10)
      │ no matches / "Create New Anyway" (admin)
      ▼
Business created → Business Detail (WF-10)
      └─ Contacts tab → add Primary contact (WF-12)
      └─ (next) [+ New Pipeline] → PHASE_5
```

## 5. Wireframes

**WF-07 — Businesses List**
```text
Businesses                                            [ + New Business ]
[ Search…]  [ Industry ▾ ]  [ Status ▾ ]
┌────────────┬───────────────┬──────────┬──────────┬────────┬────────┐
│ BUSINESS   │ WEBSITE       │ CONTACT  │ PIPELINES│ ACTIVE │ ACTION │
├────────────┼───────────────┼──────────┼──────────┼────────┼────────┤
│ ABC Corp   │ abc.com       │ James    │    3     │   2    │ View › │
│ TechNova   │ technova.com  │ Priya    │    2     │   1    │ View › │
└────────────┴───────────────┴──────────┴──────────┴────────┴────────┘
```

**WF-08 — Create Business** (Business Info · Primary Contact · Social Media sections)
```text
BUSINESS INFORMATION
 Name * [__________]  Website [__________]  Email [__________]
 Phone  [__________]  Industry [__________] Location [__________]
 Address [________________________________________________]
PRIMARY CONTACT
 Name * [__________]  Email * [__________]  Phone [__________]  [✓] Primary
SOCIAL  LinkedIn [____]  Instagram [____]  Facebook [____]  X [____]
                                   [ Cancel ]   [ Save Business ]
```

**WF-09 — Duplicate Business Check**
```text
⚠ POSSIBLE EXISTING BUSINESS — we found businesses that may already exist.
┌ ABC Corporation · abc.com · contact@abc.com · 3 Pipelines/2 Active ──[Open]┐
└─────────────────────────────────────────────────────────────────────────┘
┌ ABC Foods · abcfoods.com · hello@abcfoods.com · 1 Pipeline/0 Active ─[Open]┐
└─────────────────────────────────────────────────────────────────────────┘
                          [ Cancel ]   [ Create New Anyway ]  (admin only)
```

**WF-10 — Business Detail** (hub)
```text
ABC Corporation                                          [ Edit Business ]
abc.com · Technology · Mumbai
[Overview][Pipelines][Contacts][Resources][Tasks][Financials][Activity]
┌ BUSINESS INFORMATION ─────┐  ┌ PRIMARY CONTACT ───────────┐
│ Website / Email / Phone   │  │ James Anderson             │
│ Industry / Location       │  │ james@abc.com  [View]      │
└───────────────────────────┘  └────────────────────────────┘
┌ ACTIVE PIPELINES ─────────────────────────[+ New Pipeline]┐  (PHASE_5)
│ #PL-001 ERP Automation  Requirement  ACTIVE   View ›       │
└────────────────────────────────────────────────────────────┘
```

**WF-11 / WF-12 — Contacts list + Add/Edit Contact** (Name*, Email*, Phone, Role, Notes, [✓]Primary).

## 6. Technical Design / Architecture

### Prisma models
```prisma
enum ContactRole { OWNER MANAGER CTO OTHER }

model Business {
  id         String   @id @default(cuid())
  name       String
  website    String?
  email      String?
  phone      String?
  industry   String?
  location   String?
  address    String?
  social     Json?          // {linkedin, instagram, facebook, x}
  metrics    Json?          // business research/metrics (PHASE_7 uses too)
  notes      String?
  contacts   Contact[]
  // pipelines Pipeline[]   // added in PHASE_5
  createdById String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([name])
  @@index([email])
}

model Contact {
  id         String  @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id])
  name       String
  email      String
  phone      String?
  role       ContactRole @default(OTHER)
  isPrimary  Boolean @default(false)
  notes      String?
  createdAt  DateTime @default(now())
  @@index([businessId])
}

model ActivityLog {
  id         String   @id @default(cuid())
  actorId    String?                 // TeamMember id
  action     String                  // "business.created", "contact.primary_changed"
  entityType String                  // "Business" | "Pipeline" | ...
  entityId   String
  businessId String?                 // denormalized for fast per-business timelines
  pipelineId String?
  metadata   Json?
  createdAt  DateTime @default(now())
  @@index([businessId, createdAt])
  @@index([entityType, entityId])
}
```

### Activity foundation (cross-cutting)
```ts
// src/lib/activity.ts
export async function logActivity(input: {
  actorId?: string; action: string; entityType: string; entityId: string;
  businessId?: string; pipelineId?: string; metadata?: Record<string, unknown>;
}) { await db.activityLog.create({ data: input }); }
```
Call `logActivity` inside every mutating server action from this phase forward. The full **timeline UI** and remaining coverage complete in PHASE_12; the Business detail "Activity" tab renders a scoped view now.

### Duplicate detection
`findPossibleDuplicates(input)` normalizes website host, lowercases email/name, strips non-digits from phone, then queries indexed columns with `OR`/`ILIKE`. Returns candidates with pipeline counts for WF-09.

### Feature folder
```text
src/features/businesses/
├─ components/ business-table  business-form  duplicate-dialog  business-detail  contact-table  contact-form
├─ server/     businesses.actions.ts  businesses.queries.ts  duplicates.ts
├─ hooks/      use-businesses.ts  use-business.ts  use-contacts.ts
└─ schemas/    business.schema.ts  contact.schema.ts
```

## 7. Definition of Done

- Create → duplicate check → save flow works; matches render with Open-Existing; force-create gated to admins.
- Primary-contact invariant holds (exactly one) via a transaction that unsets the previous primary.
- Editing business info leaves any (future) pipeline snapshots untouched — documented + covered by a service test.
- Business detail renders Overview/Contacts/Activity live; other tabs present as empty states.
- `ActivityLog` rows written for business + contact mutations; per-business Activity tab lists them.
- List filters + search work; pipeline count columns render 0 (wired in PHASE_5).

## 8. What NOT To Do

- Do **not** allow deleting a business or a contact (universal rules #1/#19) — deactivate/replace instead.
- Do **not** let a business edit cascade into historical pipeline/quotation data.
- Do **not** skip the duplicate step or auto-merge businesses.
- Do **not** build pipelines here (PHASE_5) — only the Pipelines tab shell/links.
- Do **not** allow more than one Primary contact.

## 9. Dependencies / Enables

- **Depends on:** PHASE_3 (owner/creator, permissions).
- **Enables:** PHASE_5 (pipelines attach to a Business) and the audit trail used everywhere.
