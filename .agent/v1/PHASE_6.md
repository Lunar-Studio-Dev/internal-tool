# Phase 6 — Tasks, Follow-ups & Resources

> Depends on PHASE_5. Delivers the shared work-tracking and document modules that the phase screens (PHASE_7) and dashboards consume. Introduces Cloudflare R2 file storage.

## 1. Objective

Build three cross-cutting modules: **To-Dos/Tasks** (independent records, optionally linked to Business + Pipeline + Phase), **Follow-ups** (scheduled future actions used heavily for unresponsive / revisit-later cases), and **Resources** (files/documents stored in R2, scoped to a Business or Business + Pipeline + Phase). Wire the "Add Task / Add Follow-up / Add Resource" actions surfaced in PHASE_5's phase shell.

## 2. Scope of Work (In Scope)

- `Task`, `FollowUp`, `Resource` models + enums.
- To-Do dashboard grouped by Overdue / Today / Tomorrow / Upcoming / Completed — WF-34; create + detail — WF-35, WF-36.
- Follow-up create — WF-37 (reason, date/time, assignee, links).
- Resource library with filters (Business/Pipeline/Phase/Type), upload via R2 presigned URL, detail/preview/download — WF-38, WF-39, WF-40.
- R2 client + presigned upload/download route (`lib/r2.ts`, `/api/r2`).
- Hook the phase shell's Add-Task/Follow-up/Resource buttons to these modules (prefilled Business/Pipeline/Phase).
- Overdue is derived (a task past due & not done reads OVERDUE); auto-reclassification job is scheduled in PHASE_12 (Inngest).

## 3. Requirements

### Functional
1. Task fields: Title*, Assigned To*, Created By, Due Date*, Due Time, Priority (LOW/MED/HIGH), Status (TODO/IN_PROGRESS/COMPLETED/CANCELLED), optional Business/Pipeline/Phase, Notes — WF-35.
2. To-Do dashboard tabs: My Tasks / All Tasks / Today / Upcoming / Overdue / Completed, grouped with counts — WF-34.
3. Task detail supports Mark Complete / Edit / Reassign / Cancel — WF-36; OVERDUE stays assigned until Completed/Cancelled/Reassigned.
4. Follow-up: Business/Pipeline/Phase, reason, date/time, assignee, notes; full follow-up history preserved (never bulk-deleted) — WF-37.
5. Resource can belong to a Business only, or Business + Pipeline + Phase, with a Resource Type; selection cascade Business → Pipeline → Phase → Type — WF-39.
6. Upload goes to R2 via presigned PUT; the app stores metadata + object key; download via presigned GET (or public base URL) — WF-39, WF-40.
7. Resources are searchable from the library and from a phase/business context — WF-38.

### Non-Functional
- Presigned URLs are short-lived; R2 credentials never reach the client.
- File type/size validated (Zod + server check) before issuing a presign; bucket CORS restricts to the app origin.
- Task/Follow-up queries are indexed by assignee + due date for fast dashboard grouping.

## 4. End-to-End User Flow

```text
Phase shell (WF-16) ─[Add Task]──▶ Create To-Do (WF-35, prefilled biz/pipeline/phase)
                     ─[Add Follow-up]▶ Create Follow-up (WF-37)
                     ─[Add Resource]─▶ Upload (WF-39): request presign → PUT to R2 → save metadata
My day: Dashboard/To-Dos (WF-34) → Overdue/Today/Tomorrow/Upcoming/Completed → Detail (WF-36)
Docs:   Resources (WF-38) → filter/search → Detail (WF-40) → download/replace
```

## 5. Wireframes

**WF-34 — To-Do Dashboard**
```text
My To-Dos                                              [ + New To-Do ]
[My Tasks][All Tasks][Today][Upcoming][Overdue][Completed]
OVERDUE · 3
 ☐ Follow up with BuildPro   Yesterday  HIGH   Pipeline #003
TODAY · 5
 ☐ Discovery call ABC Corp   10:00 AM   HIGH
 ☐ Prepare questionnaire     12:00 PM   MEDIUM
UPCOMING
 ☐ Requirement Meet BuildPro 22 Aug     HIGH
```

**WF-35 / WF-36 — Create To-Do & Detail**
```text
Create To-Do                                   To-Do Detail
Title * [__________]                            Call ABC Corporation  [HIGH]
Assigned To * [John ▾]  Due * [20 Aug] [11:00]  [ IN PROGRESS ]
Priority [HIGH ▾]                               Assigned John · Due 20 Aug 11:00
Business [ABC ▾] Pipeline [PL-123 ▾]            Business/Pipeline/Phase links
Phase [Discovery ▾]  Notes [______]             Notes […]
        [Cancel] [Create To-Do]                 [Mark Complete][Edit][Reassign][Cancel]
```

**WF-37 — Follow-up Create**
```text
Create Follow-up
Business [ABC ▾]  Pipeline [PL-123 ▾]  Phase [Quotation ▾]
Reason [ Client reviewing quotation ▾ ]
Date [25 Aug] Time [11:00 AM]  Assigned [John ▾]
Notes [______________________]                        [ Create Follow-up ]
```

**WF-38 / WF-39 / WF-40 — Resource library, Upload, Detail**
```text
Resources                                              [ + Upload ]
[ Search…] [Business ▾][Pipeline ▾][Phase ▾][Type ▾]
┌ RESOURCE ─────────┬ TYPE ┬ BUSINESS ┬ PHASE ────┬ ACTION ┐
│ Quotation-V3.pdf  │ PDF  │ ABC Corp │ Quotation │ Open › │
└───────────────────┴──────┴──────────┴───────────┴────────┘
Upload: [Drag & Drop / Choose File] → Name, Type, Business, Pipeline, Phase, Description
Detail: [ document preview ] + Type/Business/Pipeline/Phase/Created + [Download][Replace][Delete]
```

## 6. Technical Design / Architecture

### Prisma models
```prisma
enum Priority { LOW MEDIUM HIGH }
enum TaskStatus { TODO IN_PROGRESS COMPLETED CANCELLED }   // OVERDUE derived, not stored
enum ResourceType { PDF DOCX IMAGE TEXT QUOTATION REQUIREMENT RESEARCH MEETING_NOTES OTHER }

model Task {
  id         String @id @default(cuid())
  title      String
  assigneeId String?
  createdById String?
  dueAt      DateTime?
  priority   Priority @default(MEDIUM)
  status     TaskStatus @default(TODO)
  businessId String?  pipelineId String?  phaseType PhaseType?
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([assigneeId, dueAt]) @@index([status]) @@index([pipelineId])
}

model FollowUp {
  id         String @id @default(cuid())
  businessId String?  pipelineId String?  phaseType PhaseType?
  reason     String
  dueAt      DateTime
  assigneeId String?
  notes      String?
  completedAt DateTime?
  createdAt  DateTime @default(now())
  @@index([assigneeId, dueAt]) @@index([pipelineId])
}

model Resource {
  id          String @id @default(cuid())
  name        String
  type        ResourceType @default(OTHER)
  objectKey   String        // R2 key
  sizeBytes   Int?
  contentType String?
  businessId  String?  pipelineId String?  phaseType PhaseType?
  description String?
  createdById String?
  createdAt   DateTime @default(now())
  @@index([businessId]) @@index([pipelineId]) @@index([type])
}
```
> "Overdue" = `status NOT IN (COMPLETED, CANCELLED) AND dueAt < now()`. Compute in queries; a PHASE_12 Inngest job flips notifications, not a stored status.

### R2 storage
```ts
// src/lib/r2.ts (server-only)
import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
});
export const presignUpload = (key: string, contentType: string) =>
  getSignedUrl(r2, new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: contentType }), { expiresIn: 60 });
export const presignDownload = (key: string) =>
  getSignedUrl(r2, new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }), { expiresIn: 300 });
```
Upload flow: client asks `/api/r2` (server validates type/size + `resource:write`) → returns presigned PUT → client PUTs the file to R2 → client calls `createResource` action with the returned key + metadata. Set bucket CORS to allow PUT from `NEXT_PUBLIC_APP_URL`.

### Feature folders
```text
src/features/tasks/      components(table,form,detail,grouped-list) server(actions,queries) hooks schemas
src/features/followups/  components(form,list) server hooks schemas
src/features/resources/  components(library-table,upload-dialog,detail,type-filter) server(actions,queries,presign) hooks schemas
```

## 7. Definition of Done

- Create/edit/complete/cancel/reassign tasks work; dashboard groups correctly (Overdue/Today/Tomorrow/Upcoming/Completed) with counts.
- Follow-ups create with links + assignee; history is preserved (no destructive bulk ops).
- Resource upload round-trips through R2 (presign → PUT → metadata saved) for a real file; download works; wrong type/oversized files rejected server-side.
- Phase shell (PHASE_5) Add-Task/Follow-up/Resource buttons open prefilled forms and persist links.
- All three modules searchable/filterable; RBAC + activity logging applied.
- No R2 secret is exposed to the client bundle.

## 8. What NOT To Do

- Do **not** store files in Postgres or the app filesystem — R2 only; DB holds metadata + key.
- Do **not** implement the Inngest overdue/reminder cron here — that's PHASE_12 (this phase only derives Overdue in reads).
- Do **not** hard-delete follow-up history; resource delete is a guarded, audited action (not bulk).
- Do **not** duplicate task/resource logic inside phase features — those call into these shared modules.
- Do **not** issue long-lived or write-scoped presigned URLs to the browser.

## 9. Dependencies / Enables

- **Depends on:** PHASE_5 (pipeline+phase links), PHASE_3 (assignees/permissions), PHASE_1 (R2 SDK installed).
- **Enables:** PHASE_7 phase screens (attach tasks/resources), PHASE_10/11 (financial docs, dashboards), PHASE_12 (reminder jobs).
