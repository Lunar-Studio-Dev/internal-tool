# Phase 1 — Project Foundation & Developer Tooling

> Anchor document for the whole build. Global stack, folder pattern, and shared conventions defined here are referenced by every later phase (PHASE_2 … PHASE_12).

## 1. Objective

Stand up a production-shaped Next.js monorepo-of-one that every later phase plugs into: App Router + TypeScript + Tailwind v4 + shadcn, a working Prisma 7 ↔ Neon connection, TanStack Query wired for the App Router, Zod validation, and the R2 S3 client installed and configured. No product features yet — this is the skeleton and the paved road.

## 2. Scope of Work (In Scope)

- Scaffold the Next.js app (App Router, TS, `src/` dir, import alias `@/*`).
- Initialize shadcn/ui (Tailwind v4) and install the base component set.
- Configure Prisma 7 with the Neon serverless driver adapter + a single `db` client singleton.
- Wire TanStack Query (server-safe `QueryClient`, provider, devtools, Hydration pattern).
- Install + configure Zod, R2 S3 client, and the charting lib.
- Establish the **features folder pattern**, path aliases, lint/format, and the base providers + root layout.
- Author `.env` / `.env.example` for the full stack.
- Add shared infra helpers: `lib/db.ts`, `lib/query/*`, `lib/utils.ts`, `lib/env.ts` (Zod-validated env).

## 3. Requirements

### Functional
- `pnpm dev` boots the app with a themeable shadcn baseline and no runtime errors.
- `pnpm prisma migrate dev` connects to Neon and applies an (empty) initial migration.
- A trivial TanStack Query hook renders on a client component and shows devtools.

### Non-Functional
- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`).
- ESLint + Prettier + Tailwind class sorting pass clean in CI.
- All secrets read through a single Zod-validated `env` module — no raw `process.env` in feature code.
- Node 22 LTS pinned via `.nvmrc` / `engines`.

## 4. Prerequisites

- Node 22 LTS, `pnpm` (via corepack).
- A Neon project + database (copy the pooled connection string).
- Cloudflare R2 bucket + S3 API token (Phase 6 needs it; create now).
- A Vercel account (deploy target).

## 5. Setup Commands (run in order)

```bash
# 0) Toolchain
corepack enable && corepack prepare pnpm@latest --activate
node -v   # expect v22.x

# 1) Scaffold Next.js (App Router, TS, Tailwind v4, src dir)
#    The repo already contains .git/.env/.agent. Scaffold IN PLACE:
npx create-next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-pnpm
#    If create-next-app refuses because of existing files, scaffold to a temp
#    dir and copy in, preserving .env / .agent / .git:
#    npx create-next-app@latest ../_scaffold --typescript --tailwind --eslint \
#      --app --src-dir --import-alias "@/*" --use-pnpm
#    rsync -a --exclude='.git' ../_scaffold/ ./ && rm -rf ../_scaffold

# 2) shadcn/ui (latest auto-detects Tailwind v4). Choose "Neutral" base color.
npx shadcn@latest init
npx shadcn@latest add button input label textarea select checkbox switch \
  dropdown-menu dialog sheet table tabs badge card avatar sonner form \
  popover calendar command tooltip separator skeleton breadcrumb \
  alert alert-dialog scroll-area progress

# 3) Prisma 7 + Neon serverless adapter
pnpm add -D prisma
pnpm add @prisma/client @prisma/adapter-neon @neondatabase/serverless
pnpm dlx prisma init --datasource-provider postgresql

# 4) Data / state / validation
pnpm add @tanstack/react-query @tanstack/react-query-devtools zod

# 5) Object storage (Cloudflare R2 is S3-compatible)
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# 6) Charts (TanStack React Charts, as specified in the stack)
pnpm add react-charts@beta
#   NOTE: shadcn's Chart component (Recharts) is a theme-native alternative — see PHASE_11.

# 7) Everyday utilities
pnpm add date-fns clsx tailwind-merge lucide-react nanoid
```

> **Prisma 7 note (breaking vs v6):** the datasource URL and config now live in a root `prisma.config.ts`, and the client is generated ESM-first via the new `prisma-client` generator (custom output path). Confirm exact config keys against the current Prisma 7 docs when wiring `prisma.config.ts`; the shape below is representative.

```ts
// prisma.config.ts (root)
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL! },
});
```

```prisma
// prisma/schema.prisma (generator + datasource header)
generator client {
  provider = "prisma-client"          // Prisma 7 ESM generator
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```ts
// src/lib/db.ts — single Prisma client backed by the Neon adapter
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") g.prisma = db;
```

## 6. Environment Variables

Update `.env.example` (and local `.env`) to match the real stack. Auth is **Neon Managed Better Auth** (`@neondatabase/auth`) — values come from the Neon console (Auth → Configuration); see PHASE_2.

```dotenv
# Database (Neon pooled connection string)
DATABASE_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Neon Auth = Managed Better Auth (see PHASE_2 — Neon console → Auth → Configuration)
NEON_AUTH_BASE_URL=
NEON_AUTH_COOKIE_SECRET=

# Transactional email — Resend (PHASE_3 member-invite temp passwords).
# If RESEND_API_KEY is blank, invites are not emailed and the admin shares the temp password manually.
RESEND_API_KEY=
EMAIL_FROM="Lunar Studio <onboarding@resend.dev>"

# Cloudflare R2 (PHASE_6)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

```ts
// src/lib/env.ts — fail fast on misconfig (import this, never process.env directly)
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEON_AUTH_BASE_URL: z.string().min(1).optional(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(1).default("Lunar Studio <onboarding@resend.dev>"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_BUCKET: z.string().optional(),
});

export const env = schema.parse(process.env);
```

## 7. Complete Project Structure (features folder pattern)

Feature-first: everything a feature owns (UI, server logic, hooks, schemas, types) lives under `src/features/<feature>/`. Only genuinely shared code lives in `src/components`, `src/lib`, `src/hooks`.

```text
internal-tool/
├─ prisma/
│  ├─ schema.prisma            # models grow phase by phase
│  ├─ migrations/
│  └─ seed.ts                  # roles, deactivation reasons, settings
├─ prisma.config.ts
├─ src/
│  ├─ app/
│  │  ├─ auth/                # PHASE_2: sign-in / sign-up pages
│  │  ├─ (app)/                # authenticated shell + all product pages
│  │  │  ├─ layout.tsx         # sidebar + header shell (PHASE_2)
│  │  │  ├─ dashboard/
│  │  │  ├─ businesses/
│  │  │  ├─ pipelines/
│  │  │  ├─ todos/
│  │  │  ├─ resources/
│  │  │  ├─ accounts/
│  │  │  ├─ team/
│  │  │  ├─ analytics/
│  │  │  └─ settings/
│  │  ├─ api/
│  │  │  ├─ r2/route.ts        # presigned upload/download (PHASE_6)
│  │  │  └─ auth/[...path]/route.ts  # Neon Auth (Managed Better Auth) handler (PHASE_2)
│  │  ├─ layout.tsx            # root: providers + fonts + globals.css
│  │  └─ globals.css           # Tailwind v4 @import + @theme tokens
│  ├─ features/
│  │  └─ <feature>/
│  │     ├─ components/        # feature-scoped UI
│  │     ├─ server/
│  │     │  ├─ <feature>.actions.ts   # 'use server' mutations (Zod-validated)
│  │     │  ├─ <feature>.service.ts   # business logic
│  │     │  └─ <feature>.queries.ts   # read queries (server-only)
│  │     ├─ hooks/             # TanStack Query hooks (client)
│  │     ├─ schemas/           # Zod schemas + inferred types
│  │     ├─ types.ts
│  │     └─ constants.ts
│  ├─ components/
│  │  ├─ ui/                   # shadcn generated primitives
│  │  ├─ layout/               # app shell (sidebar, header, user-menu)
│  │  └─ common/               # StatusBadge, DataTable, PipelineStepper, EmptyState
│  ├─ lib/
│  │  ├─ db.ts                 # Prisma client singleton (Neon adapter)
│  │  ├─ env.ts                # Zod-validated env
│  │  ├─ auth/                # Neon Auth: server.ts (createNeonAuth) + session.ts (PHASE_2)
│  │  ├─ rbac.ts               # role → permission checks (PHASE_3)
│  │  ├─ activity.ts           # logActivity() audit helper (PHASE_4)
│  │  ├─ r2.ts                 # R2 S3 client + presign (PHASE_6)
│  │  ├─ query/                # get-query-client.ts + provider.tsx
│  │  └─ utils.ts              # cn(), money + date formatters
│  └─ hooks/                   # shared client hooks
├─ .nvmrc                      # 22
├─ .env  /  .env.example
└─ components.json             # shadcn config
```

```ts
// src/lib/query/get-query-client.ts
import { QueryClient, isServer, defaultShouldDehydrateQuery } from "@tanstack/react-query";

function make() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000 },
      dehydrate: { shouldDehydrateQuery: (q) =>
        defaultShouldDehydrateQuery(q) || q.state.status === "pending" },
    },
  });
}
let browserClient: QueryClient | undefined;
export function getQueryClient() {
  if (isServer) return make();            // always a fresh client on the server
  return (browserClient ??= make());      // singleton in the browser
}
```

```tsx
// src/lib/query/provider.tsx
"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "./get-query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## 8. Shared Conventions (apply to every phase)

- **Reads:** Server Components prefetch with `queryClient.prefetchQuery` + `<HydrationBoundary>`; client components consume via TanStack Query hooks. Query keys are arrays namespaced by feature, e.g. `["businesses", "list", filters]`.
- **Writes:** Server Actions (`'use server'`) in `<feature>.server/*.actions.ts`, input parsed by a Zod schema at the top of the action. On success, call `revalidate*` and/or return data the hook uses to invalidate keys.
- **Validation:** one Zod schema per input; export the inferred type. Never trust client input in the service layer.
- **RBAC:** every mutating action and sensitive query calls `requirePermission(...)` from `lib/rbac.ts` (PHASE_3). Deny by default.
- **Audit:** every meaningful mutation calls `logActivity(...)` (PHASE_4).
- **Money:** store as integer **minor units (paise)**; format at the edge with a shared `formatMoney()`. Never use floats for money.
- **IDs:** cuid/uuid primary keys; human-facing codes (PL-00123, PRJ-00123) are separate display fields.
- **Never hard-delete** domain data — use status flags (INACTIVE / DEACTIVATED). Enforced across phases.
- **Dates/timezone:** persist UTC; render in the app timezone from Settings (default Asia/Kolkata).

## 9. Definition of Done

- Fresh clone → `pnpm i` → `pnpm dev` runs with zero console errors.
- `pnpm prisma migrate dev` succeeds against Neon; `db` singleton imports cleanly in a server component.
- shadcn components render with the chosen theme; dark mode toggles.
- TanStack Query devtools visible; a sample prefetched query hydrates without a client refetch.
- `lib/env.ts` throws clearly when a required var is missing.
- Lint + typecheck + format all green.

## 10. What NOT To Do

- Do **not** build any product screens, models, or auth flows here (those are PHASE_2+).
- Do **not** scatter `process.env` reads across the app — go through `lib/env.ts`.
- Do **not** downgrade to Tailwind v3 or pin shadcn to the v3 line; the stack is Tailwind v4.
- Do **not** create per-feature `QueryClient`s or instantiate `PrismaClient` more than once.
- Do **not** commit real secrets; only `.env.example` is tracked.
- Do **not** introduce a global Redux/Zustand store for server data — TanStack Query owns server state.

## 11. Enables

Every subsequent phase. PHASE_2 (auth + shell) is the immediate next step and depends only on this foundation.
