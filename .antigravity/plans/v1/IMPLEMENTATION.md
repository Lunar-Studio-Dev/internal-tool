# Platform Implementation Plan (v1): Templates & Quotations

## 1. Business Context & Objective
A software development and AI automation company uses this platform to streamline the technical quotation process. The user journey is split into two distinct panels to separate base definitions from final client deliverables.

### Panel Definitions:
- **Template Panel**: The repository where the technical team creates and manages general, reusable technical patterns (e.g., "Standard E-Commerce", "AI Support Bot"). These are derived from analyzing past successful quotations.
- **Quotations Panel**: The operational interface used to draft new client-specific quotations. Users select a base template, input the client’s detailed technical requirements via Markdown, generate a live preview, and save the final quotation ledger.

---

## 2. Route Architecture
- `/dashboard/templates` — Manage, view, and create Base Templates.
- `/dashboard/quotations` — View historical client quotations.
- `/dashboard/quotations/new` — The Markdown-powered split-screen wizard to generate a new quotation.

---

## 3. Template Panel (`/dashboard/templates`)

### Flow:
1. User enters the Template Dashboard.
2. They see a gallery or structured table of all internal base templates currently available.
3. They can add a new base template (setting default scope, categories, and markdown boilerplates).

### View A: Template Dashboard (ASCII Mockup)
```text
+---------------------------------------------------------------------------------+
|  # Templates Base                                                    [👤 User]  |
|  -----------------------------------------------------------------------------  |
|                                                                                 |
|  [🔍 Search templates...]  [Filter: Category v]           [+ Create Template]   |
|                                                                                 |
|  --- Active Base Templates ---------------------------------------------------  |
|                                                                                 |
|  +---------------------------+  +---------------------------+                   |
|  | 🤖 AI Chatbot (RAG)       |  | 🛒 B2B E-Commerce App     |                   |
|  |---------------------------|  |---------------------------|                   |
|  | Cat: AI Automation        |  | Cat: Business Automation  |                   |
|  | Mod: 4 base modules       |  | Mod: 8 base modules       |                   |
|  |                           |  |                           |                   |
|  | [Edit Base] [Duplicate]   |  | [Edit Base] [Duplicate]   |                   |
|  +---------------------------+  +---------------------------+                   |
|                                                                                 |
|  +---------------------------+  +---------------------------+                   |
|  | 📊 Landing Page Website   |  | 📱 React Native SaaS      |                   |
|  |---------------------------|  |---------------------------|                   |
|  | ...                       |  | ...                       |                   |
|  +---------------------------+  +---------------------------+                   |
+---------------------------------------------------------------------------------+
```

---

## 4. Quotations Panel (`/dashboard/quotations`)

### Flow:
1. User navigates to Quotations and sees a data table acting as the ledger of all previous client generation histories.
2. Clicking **New Quotation** launches the Quotation Generator wizard.
3. User selects an existing template from the Template Panel database.
4. User writes specific markdown constraints for the client; sees live parsing.

### View B: Historical Quotations Ledger (ASCII Mockup)
```text
+---------------------------------------------------------------------------------+
|  # Client Quotations                                                 [👤 User]  |
|  -----------------------------------------------------------------------------  |
|                                                                                 |
|  [🔍 Search by Client Name...]                     [+ Create New Quotation]     |
|                                                                                 |
|  --- Past Generations --------------------------------------------------------  |
|                                                                                 |
|  ID      Client Name         Base Template Used        Author       Date        |
|  -----------------------------------------------------------------------------  |
|  #012    Acme Corp           AI Chatbot (RAG)          John D.      Today       |
|  #011    Stark Industries    B2B E-Commerce App        Jane A.      Oct 14      |
|  #010    Wayne Ent           React Native SaaS         John D.      Oct 12      |
|                                                                                 |
|                                                       < Prev  [ 1 ]  Next >     |
+---------------------------------------------------------------------------------+
```

### View C: Quotation Generator & Markdown Parser (ASCII Mockup)
```text
+---------------------------------------------------------------------------------+
|  < Back to LEDGER                                                               |
|  # Generate New Client Quotation                                                |
|  -----------------------------------------------------------------------------  |
|                                                                                 |
|  1. Configuration                                                               |
|  [ Client Name : "Wayne Enterprises" ]  [ Template: [ 🤖 AI Chatbot   | ▼ ] ]   |
|                                                                                 |
|  2. Client Detail Requirements (Markdown Parsing)                               |
|  +-------------------------------------+-------------------------------------+  |
|  | EDITOR (Raw Markdown)           [✏️] | PREVIEW (Parsed HTML)           [👁️] |  |
|  |-------------------------------------|-------------------------------------|  |
|  | # Project Scope                     |                                     |  |
|  | Wayne Enterprises requires a rapid  | Project Scope                       |  |
|  | local secure RAG deployment.        | Wayne Enterprises requires a rapid  |  |
|  |                                     | local secure RAG deployment.        |  |
|  | ## Requirements                     |                                     |  |
|  | - *On-premise* LLaMa 3 deployment   | Requirements                        |  |
|  | - Internal API scraping             | • On-premise LLaMa 3 deployment     |  |
|  | - Security clearance checks         | • Internal API scraping             |  |
|  |                                     | • Security clearance checks         |  |
|  |                                     |                                     |  |
|  |                                     |                                     |  |
|  +-------------------------------------+-------------------------------------+  |
|                                                                                 |
|                                     [ Cancel ]  [ ✨ Generate Final Document ]  |
+---------------------------------------------------------------------------------+
```

---

## 5. Technical Requirements & Components Mapping

### UI Architecture (Shadcn + Next.js App Router):
- `/app/dashboard/templates/page.tsx` -> Renders View A (Cards/Grid for predefined standard tech patterns).
- `/app/dashboard/quotations/page.tsx` -> Renders View B (Historical data table of past quotes).
- `/app/dashboard/quotations/new/page.tsx` -> Renders View C (Generator).

### Required Dependencies:
- **UI Toolkit**: `shadcn/ui` (Cards, Inputs, Buttons, DataTables, Select, Resizable Grid).
- **Markdown Handling**: 
  - `react-markdown`: Core parser to render the right-hand panel in View C safely.
  - `remark-gfm`: Allows adding Github-flavored elements like markdown tables and checklist boxes (common in requirement scoping).
  - `@tailwindcss/typography`: To utilize the `prose text-sm dark:prose-invert` class so the generated markdown preview looks gorgeous automatically.
- **State Management**: `zustand` to temporarily store the half-written markdown if the user clicks away.

---
*Status: Design pending approval. Code implementation ready to begin upon confirmation.*
