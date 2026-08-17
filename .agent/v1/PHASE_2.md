# Phase 2 — Authentication & Application Shell

> Depends on PHASE_1. Adds identity (Neon Auth) and the persistent chrome every product screen renders inside.

## 1. Objective

Gate the app behind **Neon Auth (Managed Better Auth)** — whose users/sessions live in the `neon_auth` schema of your Postgres DB — and build the common application shell: collapsible sidebar navigation, top bar (global search slot, notifications bell, quick "+ New", user menu), page-header, breadcrumb, and the shared status/table/stepper primitives that later phases reuse.

## 2. Scope of Work (In Scope)

- Integrate **Neon Auth (Managed Better Auth, `@neondatabase/auth`)**: a `createNeonAuth` server instance, the `api/auth/[...path]` handler, `src/proxy.ts` route protection, and custom shadcn sign-in / sign-up screens driven by server actions.
- Protect the `(app)` route group via `src/proxy.ts`; redirect unauthenticated users to `/auth/sign-in`.
- Expose server helpers to read the current user (`lib/auth/server.ts` + `lib/auth/session.ts`).
- Confirm the Neon Auth identity tables in the `neon_auth` schema (esp. `neon_auth.user`) — the basis for Team Members in PHASE_3.
- Build the shell: `components/layout/{app-sidebar,app-header,user-menu,nav}.tsx` (WF-01, WF-02, WF-57).
- Build shared primitives in `components/common/`: `StatusBadge` (WF-03), `DataTable` (WF-05), `PipelineStepper` (WF-04), `PageHeader`, `EmptyState`.
- Theme tokens + dark mode toggle.

## 3. Requirements

### Functional
1. Visiting any `(app)` route while signed out redirects to `/auth/sign-in`.
2. After sign-in, the user lands on `/dashboard` inside the shell.
3. Sidebar lists: Dashboard, Businesses, Pipelines, To-Dos, Resources, Accounts, Team Members, Analytics, Settings; active route is highlighted; sidebar collapses.
4. Top bar shows global search (opens command palette — real search in PHASE_12), notifications bell (badge count wired in PHASE_12), "+ New" quick menu, and the user menu (name, roles, profile, sign out) per WF-57.
5. On first sign-in, the user is present in `neon_auth.user` (managed by Neon Auth).

### Non-Functional
- Auth checks run in `src/proxy.ts` AND server components (defense in depth); never rely on client-only guards.
- Shell is responsive (sidebar → sheet on mobile) and keyboard accessible; command palette on ⌘K/Ctrl-K.
- No layout shift between server-rendered shell and hydration.

## 4. End-to-End User Flow

```text
Unauthenticated → /auth/sign-in ──(Neon Auth)──▶ session established
        └─ user stored in neon_auth.user
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

### Neon Auth wiring (Managed Better Auth)
Enable Auth in the Neon console (Auth → Configuration), then set `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` (32+ chars) in `.env`. Auth data (users, sessions) lives in the `neon_auth` schema of your Neon database. Install `@neondatabase/auth` and create a single server instance with `createNeonAuth`.

> **Console prerequisites (required by PHASE_3 provisioning):** keep **email/password** sign-in enabled and **require email verification OFF** (members sign in with a temporary password, not a verification link), and add your app origins (e.g. `http://localhost:3000`) to **Trusted domains**. Magic-link is **not** used. Outbound invite emails are sent by **our app via Resend** (`RESEND_API_KEY`), not by Neon. The **admin API** (`auth.admin.createUser`, `auth.admin.setUserPassword`, `auth.admin.listUsers`) requires the caller's `neon_auth.user.role = 'admin'` — set that on the bootstrap admin (Console → Auth → Users → Make admin) before using PHASE_3's Add-Member flow.

```text
src/lib/auth/server.ts                 # createNeonAuth({ baseUrl, cookies:{ secret } }) → auth
src/lib/auth/session.ts                # getSession(), getCurrentUser(), requireUser()
src/app/api/auth/[...path]/route.ts    # export const { GET, POST } = auth.handler()
src/proxy.ts                           # Next 16 route protection: auth.middleware({ loginUrl:"/auth/sign-in" })
src/app/auth/layout.tsx                # centered auth shell
src/app/auth/sign-in/page.tsx          # custom shadcn form → server action (auth.signIn.email)
src/app/auth/sign-up/page.tsx          # custom shadcn form → server action (auth.signUp.email)
src/features/auth/actions.ts           # signInAction / signUpAction / signOutAction
```

> Auth screens are **custom shadcn forms + server actions**, not `@neondatabase/auth-ui`. The auth-ui `NeonAuthUIProvider` renders its own next-themes `ThemeProvider`, which would double-nest with our theme provider — so we call the Better Auth server methods directly and keep a single theme authority.

```ts
// src/lib/auth/server.ts
import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});

// src/lib/auth/session.ts
import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export async function getSession() {
  const { data } = await auth.getSession();
  return data ?? null;
}
export async function getCurrentUser() {
  return (await getSession())?.user ?? null;       // null if signed out
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");
  return user;                                     // user.id === neon_auth.user.id
}
```

- **Identity vs domain profile:** Neon Auth owns authentication + the `neon_auth.user` row (id, email, name, image). PHASE_3's `TeamMember` extends it with roles/status, linking via a plain `authUserId` string = `neon_auth.user.id` (no cross-schema FK; Neon manages `neon_auth`). Do not duplicate auth fields into the domain DB beyond the domain-owned profile.
- **`src/proxy.ts`** guards `(app)/*` (matcher excludes `/auth`, `/api/auth`, `/api/inngest`, static); server components additionally call `requireUser()` so no unguarded data path exists. Server Actions pass through the proxy (they enforce auth themselves).

### Shell composition
```text
src/app/layout.tsx            → <Providers>{children}   (Providers = ThemeProvider → QueryProvider → TooltipProvider + Toaster; auth needs no client provider)
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

- Signed-out access to `/dashboard` redirects to `/auth/sign-in`; successful auth returns to the shell.
- A new sign-up appears in `neon_auth.user` (verify with a quick query).
- Sidebar + header render on every `(app)` route; active nav item highlighted; mobile sidebar works.
- User menu shows real name/email from the session and signs out.
- `StatusBadge`, `DataTable`, `PipelineStepper`, `PageHeader`, `EmptyState` exist, typed, and storybook-free smoke-rendered on a scratch page.
- Dark/light theme toggles with no flash.

## 8. What NOT To Do

- Do **not** hand-roll password auth, sessions, or JWTs — Neon Auth owns identity.
- Do **not** model roles/permissions yet (PHASE_3) beyond reading the session.
- Do **not** implement real global search, notifications, or "+ New" targets (stub triggers; wired in later phases).
- Do **not** put business data in the `neon_auth` tables (they are managed by Neon Auth).
- Do **not** guard routes on the client only.

## 9. Dependencies / Enables

- **Depends on:** PHASE_1.
- **Enables:** PHASE_3 (Team & Roles link to `neon_auth.user`), and every UI phase (renders inside this shell and reuses the common primitives).
