# Client Management Tool — Business User Flow (Context)

This document captures the business/user flow this internal tool is intended to support. It is the functional foundation only — no implementation decisions or assumptions beyond what was specified.

## Core Model

- **Business** is the permanent identity of a client/company. It is never duplicated and never deleted.
- A Business has one or more **Pipelines**. Each Pipeline is a single, separate opportunity/engagement with that Business.
- Multiple Pipelines can be **active at the same time** for one Business.
- Alongside Pipelines, a Business also has: **Tasks/To-Dos, Resources, Financial Records, and Activity History**.

```text
Business
   ├── Pipeline 1 (Discovery → Business Understanding → Requirement → Quotation → Project Management)
   ├── Pipeline 2 (...)
   └── Pipeline 3 (...)

Business
   ├── Pipelines
   ├── Tasks / To-Dos
   ├── Resources
   ├── Financial Records
   └── Activity History
```

## The Six Fixed Phases

The workflow is fixed (no custom/heavy workflow builder), always in this order:

1. **Business Contact Info** — not really a pipeline phase; it is the permanent info about the business.
2. **Discovery Call**
3. **Business Understanding**
4. **Requirement Meet**
5. **Quotation Meet**
6. **Project Management**

A Pipeline always starts at **Discovery** and moves forward sequentially.

## Phase Statuses

- Every active phase uses: **ACTIVE → PROMOTED** (move forward) or **ACTIVE → DEACTIVATED** (stop).
- **REACTIVATED** is treated as an action/event, not a permanent status.
- Lifecycle: `DEACTIVATED → REACTIVATE → ACTIVE`, resuming at the previous phase (it does not restart the pipeline).

## New Lead Flow

1. Receive a lead (website, Instagram, LinkedIn, referral, direct contact, cold lead, manual research, other source).
2. **Search first** for an existing business (by business name, website, email, phone, contact person).
   - If it does not exist → Create Business → enter contact info → save → Create Pipeline.
   - If it exists → open the existing business (do not recreate) → Create New Pipeline (or continue an existing one).
3. Pipeline is created with basic opportunity info (pipeline name, opportunity/work type, lead source, assigned team member, notes). Current Phase = Discovery, Status = ACTIVE.

## Business Contact Information

Belongs to the company itself and remains available across all pipelines. Example fields: Business Name, Website, Business Email, Phone, Contact Person, Contact Person Email, Contact Person Phone, Address, Industry, Social Media, Business Metrics, Notes. Updating it later must not modify historical pipeline information.

## Phase-by-Phase Outcomes

Each of Discovery, Business Understanding, Requirement, and Quotation supports common actions (notes, meetings, tasks, follow-ups, resources) and resolves as either:

- **Promote** to the next phase (records Promoted By, Promoted At, Notes), or
- **Deactivate** with a required reason (the Business stays active in the system regardless).

Specifics:

- **Discovery** answers: "Can our agency potentially provide meaningful value to this business?"
- **Business Understanding** is high-level understanding (what the business does, how it operates, processes, problems, pain points, existing tools, automation/software opportunities, stakeholders, high-level expectations) — not detailed requirements.
- **Requirement** is detailed requirement gathering (review business info + understanding, prepare questionnaire from internal templates, schedule meet). No complex questionnaire builder needed initially. Captures business/functional/technical requirements, features, users, workflow, problems, integrations, constraints, timeline, deliverables, etc.
- **Quotation** supports multiple versions (V1, V2, V3…), never overwriting previous ones — every version stays accessible.

## Quotation → Payment → Project Gate

- Client **accepts** → does NOT immediately promote. **Initial payment is the gate** to Project Management.
- Payment received → create an **Earning** record (linked to Business + Pipeline + Quotation) → promote → **Project Management ACTIVE**.
- Payment **pending** → pipeline stays in Quotation; team creates payment follow-ups until payment arrives.
- Client **rejects** → deactivate with reason (price too high, timeline, scope disagreement, competitor selected, postponed, no longer interested, other).
- Client **wants to revisit later** → keep active with a future-dated follow-up rather than deactivating immediately; deactivate only if the opportunity eventually dies.

## Client Stops Responding (Edge Case)

Do not immediately delete or deactivate. Keep creating follow-ups; the full follow-up history is preserved. Deactivate (reason: client unresponsive) only when the team decides the opportunity is no longer active.

## Project Management & Handoff

- Project Management's main responsibility is a **clean handoff**.
- Records: Project Name, Pipeline, Business, Quotation, Payment, Project Manager, Assigned Team, Project Start Date, Expected Deadline, Project Notes.
- Handoff bundle: Business Information + Business Understanding + Requirement + Final Quotation + Payment Information + Resources + Important Notes + Client Contacts.
- One Business can have **many projects** across different pipelines (complete client history).

## Re-entry (Business Returns)

On return, show existing business + pipeline history, then choose:

- **Continue Existing Pipeline** → reactivate, resume at previous phase (old quotation versions preserved; can add new versions, update requirements, add notes, schedule meetings, continue negotiation).
- **Create New Pipeline** → new opportunity starting at Discovery; old pipeline untouched.

Decision rules:

- **Requirement change = same pipeline** (update requirement info, keep history).
- **New/different business opportunity = new pipeline.**
- **Quotation revision = new version, same pipeline.**
- If multiple pipelines exist, the user must choose which to continue.
- Multiple active pipelines for one business are allowed (do not force a new opportunity into an existing pipeline).
- Payment arriving after deactivation → reactivate → record payment → promote (no forced new pipeline).

## Supporting Concepts

- **Tasks/To-Dos**: independent records, optionally linked to Business + Pipeline + Phase. Fields: Title, Assigned To, Created By, Due Date, Priority, Status, Business, Pipeline, Phase, Notes. Statuses: TODO, IN PROGRESS, COMPLETED, CANCELLED. Overdue is auto-classified as OVERDUE and stays assigned until Completed/Cancelled/Reassigned.
- **Daily Team Member Flow**: Dashboard → My Tasks grouped by Overdue / Today / Tomorrow / Upcoming / Completed.
- **Follow-ups**: scheduled future actions (used heavily for unresponsive clients and "revisit later" cases).
- **Resources**: can belong to a Business only, or to Business + Pipeline + Phase (with a Resource Type). Selecting: Business → Pipeline → Phase → Resource Type. Searchable from multiple locations.
- **Accounts**: intentionally simple — **EARNING** and **EXPENSE**. Earnings link to Business + Pipeline + Quotation. Supports partial payments (remaining stays outstanding) and multiple payments (each a separate transaction).
- **Team Members & Roles**: many-to-many. A person can hold multiple roles (Admin, Client Manager, Business Analyst, Sales, Finance, Developer, Project Manager); permissions combine across roles. Keep RBAC simple for v1. An Admin role manages team members and permissions.
- **Contacts**: a Business can have multiple contacts with one marked **Primary**; different pipelines can optionally have different primary contacts. Historical meeting participants/contacts are preserved even when the current contact changes.
- **Duplicate prevention**: before creating a Business, warn about possible existing matches and prefer "Open Existing Business"; only Admin/authorized users may force-create a duplicate.
- **Stale pipelines**: do not auto-deactivate on inactivity; surface an "Inactive / Stale Pipeline" dashboard indicator instead.
- **Activity History**: every important action is recorded as an audit trail.

## Universal Rules

1. Never duplicate a Business unnecessarily.
2. A Business can have multiple Pipelines.
3. Multiple Pipelines can be active simultaneously.
4. A Pipeline always starts at Discovery.
5. A Pipeline moves forward sequentially.
6. A Pipeline can be deactivated at any phase before project execution.
7. Deactivated Pipelines are never deleted.
8. A deactivated Pipeline can be reactivated.
9. Reactivation resumes the same Pipeline at its previous phase.
10. A completely new opportunity gets a new Pipeline.
11. Requirement changes do not automatically create a new Pipeline.
12. Quotation revisions do not create a new Pipeline.
13. Initial payment is the gate to Project Management.
14. Every important action is recorded in Activity History.
15. Tasks and follow-ups can be linked to Business + Pipeline + Phase.
16. Resources can belong to Business or Business + Pipeline + Phase.
17. A Team Member can have multiple Roles.
18. Team Members are never deleted when they leave (set INACTIVE).
19. Historical data is never destroyed.
20. The system should remain operationally simple rather than becoming a heavy customizable CRM.

## Glossary

| Concept | Meaning |
| --- | --- |
| Business | Permanent identity of the client/company |
| Pipeline | One specific opportunity with that business |
| Phase | Current stage of that opportunity |
| Status | Current condition of the phase |
| Task | Work someone needs to perform |
| Follow-up | Scheduled future action |
| Resource | Document/information |
| Quotation | Commercial proposal/version |
| Payment | Money received |
| Expense | Money spent |
| Team Member | Person using the system |
| Role | Permission/group assigned to a team member |
| Activity | Historical event/audit trail |
