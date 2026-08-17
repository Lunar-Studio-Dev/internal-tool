# Phase 2 — Authentication & Application Shell

> Depends on PHASE_1. Adds identity (Neon Auth) and the persistent chrome every product screen renders inside.

## 1. Objective

Gate the app behind Neon Auth, sync authenticated users into Postgres, and build the common application shell: collapsible sidebar navigation, top bar (global search slot, notifications bell, quick "+ New", user menu), page-header, breadcrumb, and the shared status/table/stepper primitives that later phases reuse.

## 2. Scope of Work (In Scope)

- Integrate **Neon Auth** (Stack-Auth based): handler route, provider, middleware, sign-in / sign-up / user-button.
- Protect the `(app)` route group; redirect unauthenticated users to sign-in.
- Expose server + client helpers to read the current user (`lib/auth.ts`).
- Confirm the Neon Auth `neon_auth.users_sync` table is queryable (basis for Team Members in PHASE_3).
- Build the shell: `components/layout/{app-sidebar,app-header,user-menu,nav}.tsx` (WF-01, WF-02, WF-57).
- Build shared primitives in `components/common/`: `StatusBadge` (WF-03), `DataTable` (WF-05), `PipelineStepper` (WF-04), `PageHeader`, `EmptyState`.
- Theme tokens + dark mode toggle.

## 3. Requirements

### Functional
1. Visiting any `(app)` route while signed out redirects to `/sign-in` with a return URL.
2. After sign-in, the user lands on `/dashboard` inside the shell.
3. Sidebar lists: Dashboard, Businesses, Pipelines, To-Dos, Resources, Accounts, Team Members, Analytics, Settings; active route is highlighted; sidebar collapses.
4. Top bar shows global search (opens command palette — real search in PHASE_12), notifications bell (badge count wired in PHASE_12), "+ New" quick menu, and the user menu (name, roles, profile, sign out) per WF-57.
5. On first sign-in, the user is present in `neon_auth.users_sync` (managed by Neon Auth).

### Non-Functional
- Auth checks run in middleware AND server components (defense in depth); never rely on client-only guards.
- Shell is responsive (sidebar → sheet on mobile) and keyboard accessible; command palette on ⌘K/Ctrl-K.
- No layout shift between server-rendered shell and hydration.

## 4. End-to-End User Flow

```text
Unauthenticated → /sign-in ──(Neon Auth)──▶ session established
        └─ user synced into neon_auth.users_sync
   ▼
/dashboard (inside shell)
   ├─ Sidebar navigation ──▶ section pages
   ├─ Top bar: Search (⌘K) · Bell · + New · User menu
   └─ User menu ──▶ My Profile · My Tasks · Notifications · Settings · Sign Out
```

## 5. Wireframes

**WF-01 — Application Shell**
```text
┌───────────────┬─────────────────────────────────────────────────────────┐
│ 🌙 LUNAR      │ [ Search…(⌘K) ]              🔔   ?   [ + New ▾ ]   👤▾  │
│ STUDIO        ├─────────────────────────────────────────────────────────┤
│               │                                                         │
│ ▣ Dashboard   │                                                         │
│ ◉ Businesses  │                                                         │
│ ◉ Pipelines   │                  [ PAGE CONTENT AREA ]                  │
│ ✓ To-Dos      │                  (route group (app)/*)                  │
│ ▤ Resources   │                                                         │
│ ₹ Accounts    │                                                         │
│ 👥 Team       │                                                         │
│ ◫ Analytics   │                                                         │
│ ⚙ Settings    │                                                         │
├───────────────┤                                                         │
│ 👤 John Smith │                                                         │
│ Admin·Dev  ▾  │                                                         │
└───────────────┴─────────────────────────────────────────────────────────┘
```

**WF-02 — Page Header** (reused by every list/detail page)
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Businesses                                          [ + New Business ]     │
│ Manage all businesses and their pipelines                                  │
│ Dashboard / Businesses                          ← breadcrumb               │
└──────────────────────────────────────────────────────────────────────────┘
```

**WF-57 — User Menu** (extends WF-01 avatar)
```text
        ┌─────────────────────────────┐
        │ 👤 John Smith               │
        │ john@lunarstudio.com        │
        │ Roles: Admin · Sales · PM   │
        │ ───────────────────────────  │
        │ My Profile · My Tasks       │
        │ Notifications · Settings    │
        │ Sign Out                    │
        └─────────────────────────────┘
```

**WF-03 / WF-04 / WF-05** — status badges, pipeline stepper, and data table are implemented as shared components here and rendered in later phases.

## 6. Technical Design / Architecture

### Neon Auth wiring
Enable Auth in the Neon console (Auth → Enable), copy the three keys into `.env`. Neon Auth provisions a synced identity table `neon_auth.users_sync` in your database. Install and initialize the SDK (Stack-Auth based) — the console's setup wizard prints the exact package/commands; verify against the current Neon Auth Next.js quick-start.

```text
src/app/handler/[...stack]/route.ts   # Neon Auth catch-all handler
src/app/(auth)/sign-in/[[...rest]]/page.tsx
src/app/(auth)/sign-up/[[...rest]]/page.tsx
src/lib/auth.ts                        # server helpers: getCurrentUser(), requireUser()
src/middleware.ts                      # protect (app)/* , allow (auth)/* and /handler/*
```

```ts
// src/lib/auth.ts  (shape — align imports with the Neon Auth SDK you install)
import "server-only";
import { redirect } from "next/navigation";
import { stackServerApp } from "@/lib/stack";     // configured StackServerApp

export async function getCurrentUser() {
  return stackServerApp.getUser();                 // null if signed out
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;                                     // has id === users_sync.id
}
```

- **Identity vs domain profile:** Neon Auth owns authentication + the `users_sync` row (id, email, name, avatar). PHASE_3's `TeamMember` extends it with roles/status via `authUserId` FK. Do not duplicate auth fields into the domain DB.
- **Middleware** guards `(app)/*`; server components additionally call `requireUser()` so no unguarded data path exists.

### Shell composition
```text
src/app/layout.tsx            → <StackProvider><QueryProvider><ThemeProvider>{children}
src/app/(app)/layout.tsx      → requireUser(); <AppSidebar/> + <AppHeader/> + <main>{children}</main>
components/layout/app-sidebar.tsx   → nav config array → active-link highlighting
components/layout/app-header.tsx    → <GlobalSearchTrigger/> <NotificationsBell/> <QuickNew/> <UserMenu/>
components/layout/nav.ts             → NAV_ITEMS: {label, href, icon}
```

### Shared primitives (used everywhere after this)
```tsx
// components/common/status-badge.tsx — single source of truth for status colors
export type StatusKind =
  | "ACTIVE" | "PROMOTED" | "DEACTIVATED" | "REACTIVATED"
  | "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  | "PENDING" | "PARTIAL" | "PAID" | "OVERDUE"
  | "LOW" | "MEDIUM" | "HIGH";
export function StatusBadge({ kind }: { kind: StatusKind }) { /* Badge + color map */ }
```
- `DataTable<T>`: generic wrapper over shadcn `Table` + TanStack-friendly props (search box, filter/sort/columns slots, pagination) matching WF-05. Later list phases pass column defs + a query hook.
- `PipelineStepper`: renders the 6 fixed phases (WF-04) with `active | completed | deactivated | current` states.

## 7. Definition of Done

- Signed-out access to `/dashboard` redirects to `/sign-in`; successful auth returns to the shell.
- A new sign-up appears in `neon_auth.users_sync` (verify with a quick `db` query).
- Sidebar + header render on every `(app)` route; active nav item highlighted; mobile sidebar works.
- User menu shows real name/email from the session and signs out.
- `StatusBadge`, `DataTable`, `PipelineStepper`, `PageHeader`, `EmptyState` exist, typed, and storybook-free smoke-rendered on a scratch page.
- Dark/light theme toggles with no flash.

## 8. What NOT To Do

- Do **not** hand-roll password auth, sessions, or JWTs — Neon Auth owns identity.
- Do **not** model roles/permissions yet (PHASE_3) beyond reading the session.
- Do **not** implement real global search, notifications, or "+ New" targets (stub triggers; wired in later phases).
- Do **not** put business data in the auth/users_sync table.
- Do **not** guard routes on the client only.

## 9. Dependencies / Enables

- **Depends on:** PHASE_1.
- **Enables:** PHASE_3 (Team & Roles read `users_sync`), and every UI phase (renders inside this shell and reuses the common primitives).
