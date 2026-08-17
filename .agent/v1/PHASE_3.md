# Phase 3 — Team Members & Roles (RBAC)

> Depends on PHASE_2. Establishes who the users are and what they can do. Built early because ownership/assignment (`Owner`, `Assigned To`, `Created By`) appears on nearly every later entity.

## 1. Objective

Model team members as domain profiles linked to Neon Auth identities, support multiple roles (stored as an enum array) with combined permissions, and provide a simple, code-defined RBAC layer (`lib/rbac.ts`) that every later phase enforces. Admins **provision** members — which creates the Neon Auth user with a generated temporary password and emails it — and members **activate** by signing in with that password (and are prompted to change it). Members are never deleted — they go INACTIVE.

## 2. Scope of Work (In Scope)

- `TeamMember` model with `roles` as a `RoleName[]` enum array (no separate role/join table).
- Admin CRUD for members (create, edit, deactivate/reactivate) — WF-44, WF-45, WF-46.
- Read-only Roles & Permissions matrix — WF-47.
- `lib/rbac.ts`: permission constants per role, `getPermissions(member)`, `hasPermission()`, `requirePermission()`.
- Roles are code-defined constants (no role table, no seed). New members are **provisioned by an Admin**: create the Neon Auth user with a generated temporary password (`auth.admin.createUser`) → create the `TeamMember` (`PENDING`) → email the temporary password (**Resend**, `sendMemberInviteEmail`). The bootstrap Admin's `TeamMember` row is still inserted **manually in the DB** (no seed/script/env) and lazy-links to its `neon_auth.user` by email on first sign-in.
- `useCurrentMember()` hook (session user → TeamMember + permissions) for gating UI affordances.

## 3. Requirements

### Functional
1. An Admin can add a member (name, email, phone, one-or-more roles) — WF-45. Status is system-managed (created `PENDING`); there is no status field on the form.
2. A member may hold multiple roles; effective permissions are the **union** across roles.
3. Roles (v1 fixed): Admin, Client Manager, Business Analyst, Sales, Finance, Developer, Project Manager.
4. Member list is searchable/filterable by role and status — WF-44.
5. Member detail shows roles, workload (active tasks, overdue, pipelines, follow-ups — counts wired as those phases land) and recent activity — WF-46.
6. Deactivating a member sets status INACTIVE (kept in system, excluded from assignee pickers) — never hard-deleted.
7. Only Admin can manage members and role assignments.
8. **App access gating:** an authenticated user reaches the app only if they resolve to an **ACTIVE** `TeamMember`. Anyone whose member is missing/unlinked, `PENDING` (invited, not yet signed in), `INACTIVE`, or whose `neon_auth.user` is `banned` is blocked with a context-specific "no access" screen (never the dashboard).
9. **Authorization:** Admin has full access to every feature. Every other member is gated by the **union of their roles' permissions** (server-enforced via `requirePermission`); UI affordances hide when the permission is absent.
10. **Provisioning (temporary password):** creating a member provisions the Neon Auth user with a **generated temporary password** and emails it (via **Resend**). If the email already has a Neon Auth user, that identity is reused and its password reset to the new temporary value.
11. **Activation (first sign-in):** signing in with the temporary password authenticates the member; on that first authenticated request a `PENDING` member is flipped to `ACTIVE`. The member is prompted to change the password from the account menu.

### Non-Functional
- Permission checks are server-authoritative; UI hiding is cosmetic only.
- Role→permission map is a single code constant (easy to audit); no per-user custom permissions in v1.
- **Provisioning (temporary password):** creating a member calls `auth.admin.createUser` with a generated temporary password to make the Neon Auth identity, stores its id as `authUserId`, creates the `TeamMember` as `PENDING`, and emails the temporary password via **Resend** (`sendMemberInviteEmail`). If the email already has a Neon Auth user, reuse it — recover the id via `auth.admin.listUsers` and reset its password with `auth.admin.setUserPassword`. If `RESEND_API_KEY` is unset, member creation still succeeds and the action returns a warning containing the temporary password for the admin to share manually. `authUserId` stays nullable only for the manually-inserted bootstrap Admin (email lazy-link fallback).

## 4. End-to-End User Flow

```text
Team Members (WF-44) ──[+ Add Member]──▶ Add form (WF-45): name, email, phone, roles[]
      │
      ▼
  createMemberAction:
    tempPassword = generateTempPassword()
    auth.admin.createUser({ email, name, password: tempPassword }) → authUserId
    create TeamMember { roles: RoleName[], status: PENDING, authUserId }
    sendMemberInviteEmail({ email, tempPassword })  → Resend delivers it
      │
      ▼
  Member signs in with the temp password → first request:
    getCurrentMember: PENDING → ACTIVE → lands in the app shell
    (prompted to change password via the account menu → changePasswordAction)
      │
      ▼
Member Detail (WF-46) ── Edit · Reassign roles · Resend invite (resets temp pw) · Deactivate(→INACTIVE)/Reactivate
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
Permissions are inherited from the selected roles.
On save: the Neon Auth user is created with a temporary password that is emailed to the member (no status field).
                                   [ Cancel ]  [ Save Member ]
```

**WF-46 — Member Detail**
```text
John Smith                                  [ Resend Invite ] [ Edit Member ]
john@lunarstudio.com · [● ACTIVE]   (PENDING until first sign-in)
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
enum MemberStatus { ACTIVE INACTIVE PENDING }

model TeamMember {
  id         String       @id @default(cuid())
  authUserId String?      @unique            // → neon_auth.user.id (set at provisioning; null only for the manual bootstrap admin until first sign-in)
  name       String
  email      String       @unique            // also the match key for the bootstrap-admin lazy-link
  phone      String?
  image      String?
  roles      RoleName[]                      // enum array — all of a member's roles in one row
  status     MemberStatus @default(ACTIVE)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
  @@map("team_member")
}
```
> The `neon_auth` schema (incl. `neon_auth.user`) is managed by Neon Auth — do **not** FK to it or manage it with Prisma. `authUserId` equals `neon_auth.user.id`. `roles` is a Postgres enum array (query with Prisma `has`/`hasSome`); there is **no join table**. `TeamMember` owns its `name`/`email`/`phone`/`image`. New members are created `PENDING` by `createMemberAction`; the DB default `ACTIVE` applies only to the manual bootstrap-admin row.

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

// quotation/payment/project are write-only in the set (no explicit ":read").
// Reading them is implied by the matching ":write" or a parent read scope.
const READ_IMPLIED_BY: Record<string, Permission[]> = {
  "quotation:read": ["quotation:write", "pipeline:read"],
  "payment:read":   ["payment:write", "accounts:read"],
  "project:read":   ["project:write", "pipeline:read"],
};

export function hasPermission(perms: Set<Permission>, needed: Permission | string): boolean {
  if (perms.has(needed as Permission)) return true;
  return (READ_IMPLIED_BY[needed] ?? []).some((p) => perms.has(p));
}

export async function requirePermission(needed: Permission | string) {
  const member = await getCurrentMember();          // session → TeamMember + roles
  if (!member) throw new ForbiddenError(String(needed));
  if (member.isAdmin) return member;                // Admin bypasses all checks
  if (!hasPermission(getPermissions(member.roleNames), needed)) throw new ForbiddenError(String(needed));
  return member;
}
```
> `project:read` / `payment:read` / `quotation:read` are intentionally not minted; `hasPermission` treats the matching `:write` (or a parent read scope) as granting read. This is what lets **Developer** — who holds `project:write` but not `pipeline:read` — read their assigned projects.

### Feature folder
```text
src/features/team/
├─ components/  member-table.tsx  member-form.tsx  role-picker.tsx  roles-matrix.tsx  member-detail.tsx
├─ server/      team.actions.ts (create/update/deactivate) team.queries.ts (list/detail)
├─ hooks/       use-members.ts  use-current-member.ts
├─ schemas/     team.schema.ts   (createMemberSchema, updateMemberSchema)
└─ constants.ts (ROLE_LABELS, STATUS_OPTIONS)
```

### Invite email & password (temporary password, Resend)
```text
src/lib/email.ts                              # Resend client + generateTempPassword() + sendMemberInviteEmail() + isEmailConfigured()
src/features/auth/actions.ts                  # + changePasswordAction (auth.changePassword, revokeOtherSessions)
src/features/auth/components/change-password-dialog.tsx  # account-menu dialog (current → new → confirm)
```
- **Provisioning** (`team.actions.ts`): `generateTempPassword()` (18 random bytes, base64url) → `auth.admin.createUser({ email, name, password })` → `TeamMember` `PENDING` → `sendMemberInviteEmail({ to, name, tempPassword, signInUrl })`. Reuse path: `auth.admin.listUsers` to find the id, then `auth.admin.setUserPassword`.
- **Resend invite** re-generates the temp password, sets it via `auth.admin.setUserPassword` (provisions first if the identity is missing), and re-emails it.
- **Email is optional:** with no `RESEND_API_KEY`, creation/resend still succeed and surface a warning toast containing the temp password so the admin can share it out of band.
- **Change password:** the account menu opens `ChangePasswordDialog` → `changePasswordAction` (`auth.changePassword`, `revokeOtherSessions: true`) so members rotate the temp password after first sign-in.
- **Neon console:** email/password sign-in enabled, **require email verification OFF**, app origin in **Trusted domains**, and the admin caller's `neon_auth.user.role = 'admin'`.

## 7. Definition of Done

- Admin can create/edit a member with multiple roles; non-admins cannot reach the actions (server-enforced).
- Creating a member provisions the Neon Auth user (`auth.admin.createUser` with a generated temporary password), stores `authUserId`, creates the member as `PENDING`, and emails the temporary password (via **Resend**); an email that already has a Neon Auth account is reused (password reset to the new temp value).
- Roles are stored as a `RoleName[]` array (a single row per member); effective permissions = union of roles; write-implies-read for quotation/payment/project (see `hasPermission`).
- Activation: signing in with the temporary password authenticates the member; the first authenticated request flips `PENDING` → `ACTIVE`. Members change their password from the account menu (`changePasswordAction`).
- Deactivate sets INACTIVE (excluded from assignee pickers, record preserved); `PENDING`/`INACTIVE`/banned members are blocked from the shell with a context-specific message.
- `requirePermission()` throws for unauthorized callers; `useCurrentMember()` drives UI gating.
- Roles/permissions are code-defined (no seed). The bootstrap Admin is a manually-inserted `TeamMember` row (email + ADMIN role, status ACTIVE) that lazy-links on first sign-in.
- List search/filter and detail tabs render (workload counts may read 0 until later phases populate them).

## 8. What NOT To Do

- Do **not** build a custom permission editor or per-user overrides in v1.
- Do **not** hard-delete members or reuse a freed email for a different person.
- Do **not** re-implement auth — link to Neon Auth (`neon_auth.user`) identities only.
- Do **not** add a seed/script/env for the bootstrap Admin — that row is inserted manually in the DB.
- Do **not** collect a password in the Add-Member form — the system generates a temporary one and emails it; the member changes it after first sign-in.
- Do **not** use magic-link or `auth.signIn.magicLink` for invites — it is PKCE/browser-bound and cannot complete in the member's browser when initiated server-side.
- Do **not** reintroduce a role join table — roles live in the `RoleName[]` array.
- Do **not** scatter role checks in components; funnel through `lib/rbac.ts`.
- Do **not** block the phase on real workload numbers — wire counts as those modules arrive.

## 9. Dependencies / Enables

- **Depends on:** PHASE_2 (identity in `neon_auth.user` + `requireUser`).
- **Enables:** assignee/owner pickers and permission gates used by PHASE_4 → PHASE_12.
