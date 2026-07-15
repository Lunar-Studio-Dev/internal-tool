# Lunar Quotations Platform - Dashboard Implementation Plan

## Objective
To build a stunning, premium, high-fidelity entry dashboard (`/app/dashboard/page.tsx`) that greets the user post-login and provides immediate, actionable access to the platform's core resources (Quotations and Templates).

## Design System & UX
Following the project's aesthetics guidelines, the Dashboard will feature:
- Glassmorphism and subtle backdrop blurring for depth.
- Fluid hover micro-animations on interactive cards (scale up, shadow glow).
- A clean, modern B2B SaaS layout utilizing Tailwind CSS grid properties.
- Dynamic data injection securely fetched strictly server-side.

---

## Component Architecture 

### 1. The Server Component (`/app/dashboard/page.tsx`)
This will act as the Data Access Layer (DAL) ensuring strict security and maximum performance without client-side loading spinners.
- **Session Fetching**: Execute `auth.api.getSession()` to greet the user by name.
- **Quotations Query**: Run `prisma.quotation.findMany()` with `take: 5` and `orderBy: { createdAt: "desc" }` to fetch the most recent pipeline data. Include the base template relation.
- **Templates Query**: Run `prisma.template.findMany()` with `take: 3`.
- **Metrics Generation**: Calculate total entities for statistics counters.
- Pass this heavily pruned payload dynamically down to the `DashboardClient` interface.

### 2. The Client User Interface (`/app/dashboard/client-page.tsx`)
The view will be partitioned cleanly into 3 primary visual tiers:

#### Tier 1: Welcome & Quick Metrics Hero
- A highly polished greeting: *"Welcome back, {User.name}"*.
- **Quick Metric Cards (KPIs)** using Shadcn `<Card>`:
  - Total Quotations Drafted
  - Custom Base Templates Created
  - Last Document Generated Date

#### Tier 2: The Quick Actions Bar
- Full-width flex container surfacing the highest intent actions.
- Action 1: **"Generate New Quotation"** - A prominent, vibrant element (perhaps using an indigo gradient fill) drawing the user's eye to create revenue-generating proposals quickly.
- Action 2: **"Explore Templates"** - A secondary outline variant.
- Action 3: **"Settings / Configurations"** - Ghost variant for account control.

#### Tier 3: The Content Split (Data Preview)
A CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`):

**A. Recent Quotations Panel (Takes 2/3 of grid space)**
- A sleek, miniature version of the Ledger Table.
- Lists the top 5 recent quotations.
- Renders `Quote ID`, `Name`, and relative time (`2 hours ago`, `yesterday`).
- Minimalist "View All" link directing out to `/dashboard/quotations`.

**B. Active Base Templates Panel (Takes 1/3 of grid space side-column)**
- Renders stacked list cards.
- Previews the last 3 tweaked tech templates (e.g. `🤖 AI Chatbot (RAG)`).
- Hover effects indicating interactivity.
- "Manage Library" link directing out to `/dashboard/templates`.

---

## Backend Requirements (Server Side Utilities)
No new `.ts` action files are necessarily required. We can leverage standard Prisma commands directly inside the core `page.tsx` since we are merely reading aggregate and recent data securely for the authenticated session ID.

## Execution Sequence
1. Create `client-page.tsx` structuring the beautiful, animated visual layout (Tier 1, 2, and 3) utilizing mock objects initially for the pure CSS scaffolding.
2. Refactor existing `page.tsx` entirely to wire up the Prisma database connections.
3. Replace the Client mock data with real robust data bindings passed downstream from the Server component.
4. Verify responsiveness (Mobile vs Desktop grids).

---

## Visual ASCII Layout (Wireframe)

```text
+---------------------------------------------------------------------------------+
|  👋 Welcome back, Disha!                           [Settings] [Profile Avatar]  |
|  Here is what's happening with your projects today.                             |
+---------------------------------------------------------------------------------+

+-------------------------+  +-------------------------+  +-------------------------+
| 📊 Total Quotations     |  | 📑 Base Templates       |  | 🕒 Last Activity        |
|                         |  |                         |  |                         |
|       1,248             |  |         14              |  |      Today, 10:42 AM    |
|  +12% this month        |  |  2 updated recently     |  |  Drafted 'Wayne App'    |
+-------------------------+  +-------------------------+  +-------------------------+

+---------------------------------------------------------------------------------+
| 🚀 QUICK ACTIONS                                                                |
| [ ➕ Generate New Quotation (Primary) ]  [ 📁 Explore Template Library ]        |
+---------------------------------------------------------------------------------+

+------------------------------------------------------+  +-----------------------+
| ⏱️ RECENT QUOTATIONS                    [View All] -> |  | 📋 ACTIVE TEMPLATES    |
|------------------------------------------------------|  |-----------------------|
| ID      Client / Project Name    Date        Action  |  | 🤖 AI Chatbot (RAG)   |
| QT-012  Wayne Enterprises RAG    Oct 24      [...]   |  |    Last edited: 2d    |
| QT-011  Stark Industries B2B     Oct 14      [...]   |  |-----------------------|
| QT-010  Acme Corp Landing Page   Oct 12      [...]   |  | 🛒 B2B E-Commerce     |
| QT-009  Globex Mobile App        Oct 05      [...]   |  |    Last edited: 5d    |
| QT-008  Initech Integration      Oct 01      [...]   |  |-----------------------|
|                                                      |  | 📱 React Native SaaS  |
|                                                      |  |    [Manage Library]   |
+------------------------------------------------------+  +-----------------------+
```
