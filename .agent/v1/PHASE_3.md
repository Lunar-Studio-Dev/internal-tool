# Phase 3 — Team Members & Roles (RBAC)

> Depends on PHASE_2. Establishes who the users are and what they can do. Built early because ownership/assignment (`Owner`, `Assigned To`, `Created By`) appears on nearly every later entity.

## 1. Objective

Model team members as domain profiles linked to Neon Auth identities, support many-to-many roles with combined permissions, and provide a simple, code-defined RBAC layer (`lib/rbac.ts`) that every later phase enforces. Members are never deleted — they go INACTIVE.

## 2. Scope of Work (In Scope)

- `Role` (fixed set), `TeamMember`, `TeamMemberRole` (M:N) models.
- Admin CRUD for members (create, edit, deactivate/reactivate) — WF-44, WF-45, WF-46.
- Read-only Roles & Permissions matrix — WF-47.
- `lib/rbac.ts`: permission constants per role, `getPermissions(member)`, `hasPermission()`, `requirePermission()`.
- Seed default roles + link the first Admin.
- `useCurrentMember()` hook (session user → TeamMember + permissions) for gating UI affordances.

## 3. Requirements

### Functional
1. An Admin can add a member (name, email, phone, one-or-more roles, status) — WF-45.
2. A member may hold multiple roles; effective permissions are the **union** across roles.
3. Roles (v1 fixed): Admin, Client Manager, Business Analyst, Sales, Finance, Developer, Project Manager.
4. Member list is searchable/filterable by role and status — WF-44.
5. Member detail shows roles, workload (active tasks, overdue, pipelines, follow-ups — counts wired as those phases land) and recent activity — WF-46.
6. Deactivating a member sets status INACTIVE (kept in system, excluded from assignee pickers) — never hard-deleted.
7. Only Admin can manage members and role assignments.

### Non-Functional
- Permission checks are server-authoritative; UI hiding is cosmetic only.
- Role→permission map is a single code constant (easy to audit); no per-user custom permissions in v1.
- Adding a member reuses the existing Neon Auth user if the email already exists in `users_sync`; otherwise invites/creates per the Neon Auth flow.

## 4. End-to-End User Flow

```text
Team Members (WF-44) ──[+ Add Member]──▶ Create/Edit (WF-45)
      │                                     │ pick roles (checkboxes), status
      │                                     ▼
      │                              save → TeamMember (+ TeamMemberRole rows)
      ▼
Member Detail (WF-46) ── Edit · Reassign roles · Deactivate(→INACTIVE)/Reactivate
Roles matrix (WF-47) ── read-only reference of role → permission scopes
```

## 5. Wireframes

**WF-44 — Team Members List**
```text
Team Members                                        [ + Add Member ]
[ Search…]  [ Role ▾ ]  [ Status ▾ ]
┌───────────────┬───────────────────────┬──────────────────────┬────────┬──────┐
│ NAME          │ EMAIL                 │ ROLES                │ STATUS │  ⋮   │
├───────────────┼───────────────────────┼──────────────────────┼────────┼──────┤
│ John Smith    │ john@lunarstudio.com  │ Admin, Sales, PM     │ ACTIVE │  ⋮   │
│ Sarah Johnson │ sarah@lunarstudio.com │ BA, Client Manager   │ ACTIVE │  ⋮   │
└───────────────┴───────────────────────┴──────────────────────┴────────┴──────┘
```

**WF-45 — Create / Edit Member**
```text
Add Team Member
Name *  [__________]   Email * [__________]   Phone [__________]
ROLES *  [✓]Admin [ ]Sales [✓]Client Manager
         [✓]Business Analyst [ ]Finance [ ]Developer [ ]Project Manager
Status  [ ACTIVE ▾ ]
Permissions are inherited from the selected roles.
                                   [ Cancel ]  [ Save Member ]
```

**WF-46 — Member Detail**
```text
John Smith                                              [ Edit Member ]
john@lunarstudio.com · [● ACTIVE]
ROLES: [ADMIN][SALES][CLIENT MANAGER][PROJECT MANAGER]
┌ WORKLOAD ──────────────┐  ┌ RECENT ACTIVITY ───────────────┐
│ Active Tasks   12       │  │ Created Pipeline #001          │
│ Overdue         2       │  │ Completed Discovery ABC Corp   │
│ Pipelines       8       │  │ Sent quotation to TechNova     │
│ Follow-ups      5       │  └────────────────────────────────┘
└─────────────────────────┘
[ Tasks ] [ Pipelines ] [ Activity ] [ Roles ]
```

**WF-47 — Roles & Permissions (read-only)**
```text
┌ ROLE ────────────┬ PERMISSIONS ──────────────────────────────┐
│ Admin            │ Full system access                        │
│ Client Manager   │ Businesses, Pipelines, Tasks, Resources   │
│ Business Analyst │ Business, Requirement, Resources, Tasks   │
│ Sales            │ Businesses, Discovery, Quotation, Tasks   │
│ Finance          │ Accounts, Payments, Businesses            │
│ Developer        │ Assigned Projects, Resources, Tasks       │
│ Project Manager  │ Projects, Pipelines, Tasks, Resources     │
└──────────────────┴───────────────────────────────────────────┘
```

## 6. Technical Design / Architecture

### Prisma models
```prisma
enum RoleName { ADMIN CLIENT_MANAGER BUSINESS_ANALYST SALES FINANCE DEVELOPER PROJECT_MANAGER }
enum MemberStatus { ACTIVE INACTIVE }

model TeamMember {
  id         String   @id @default(cuid())
  authUserId String   @unique              // → neon_auth.users_sync.id
  name       String
  email      String   @unique
  phone      String?
  status     MemberStatus @default(ACTIVE)
  roles      TeamMemberRole[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model TeamMemberRole {
  memberId String
  role     RoleName
  member   TeamMember @relation(fields: [memberId], references: [id])
  @@id([memberId, role])
}
```
> `users_sync` is managed by Neon Auth (read-only from the app). Join to it when you need the live email/avatar; `TeamMember` stores the domain-owned fields.

### RBAC (code-defined, simple v1)
```ts
// src/lib/rbac.ts
export const PERMISSIONS = [
  "business:read","business:write","pipeline:read","pipeline:write",
  "task:read","task:write","resource:read","resource:write",
  "quotation:write","payment:write","accounts:read","accounts:write",
  "project:write","team:manage","settings:manage","analytics:read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMS: Record<RoleName, Permission[]> = {
  ADMIN: [...PERMISSIONS],
  CLIENT_MANAGER: ["business:read","business:write","pipeline:read","pipeline:write","task:read","task:write","resource:read","resource:write"],
  BUSINESS_ANALYST: ["business:read","pipeline:read","resource:read","resource:write","task:read","task:write"],
  SALES: ["business:read","business:write","pipeline:read","pipeline:write","quotation:write","task:read","task:write"],
  FINANCE: ["accounts:read","accounts:write","payment:write","business:read"],
  DEVELOPER: ["project:write","resource:read","resource:write","task:read","task:write"],
  PROJECT_MANAGER: ["project:write","pipeline:read","pipeline:write","task:read","task:write","resource:read"],
};

export function getPermissions(roles: RoleName[]): Set<Permission> {
  return new Set(roles.flatMap((r) => ROLE_PERMS[r]));
}
export async function requirePermission(p: Permission) {
  const member = await getCurrentMember();          // session → TeamMember + roles
  if (!member || !getPermissions(member.roleNames).has(p)) throw new ForbiddenError(p);
  return member;
}
```

### Feature folder
```text
src/features/team/
├─ components/  member-table.tsx  member-form.tsx  role-picker.tsx  roles-matrix.tsx  member-detail.tsx
├─ server/      team.actions.ts (create/update/deactivate) team.queries.ts (list/detail)
├─ hooks/       use-members.ts  use-current-member.ts
├─ schemas/     team.schema.ts   (createMemberSchema, updateMemberSchema)
└─ constants.ts (ROLE_LABELS, STATUS_OPTIONS)
```

## 7. Definition of Done

- Admin can create/edit a member with multiple roles; non-admins cannot reach the actions (server-enforced).
- Effective permissions = union of roles, verified by a unit test over `getPermissions`.
- Deactivate sets INACTIVE and removes the member from assignee pickers while preserving the record.
- `requirePermission()` throws for unauthorized callers; `useCurrentMember()` drives UI gating.
- Seed creates the 7 roles' mapping (code) and links the bootstrap Admin.
- List search/filter and detail tabs render (workload counts may read 0 until later phases populate them).

## 8. What NOT To Do

- Do **not** build a custom permission editor or per-user overrides in v1.
- Do **not** hard-delete members or reuse a freed email for a different person.
- Do **not** re-implement auth — link to Neon Auth identities only.
- Do **not** scatter role checks in components; funnel through `lib/rbac.ts`.
- Do **not** block the phase on real workload numbers — wire counts as those modules arrive.

## 9. Dependencies / Enables

- **Depends on:** PHASE_2 (identity + `users_sync`).
- **Enables:** assignee/owner pickers and permission gates used by PHASE_4 → PHASE_12.
