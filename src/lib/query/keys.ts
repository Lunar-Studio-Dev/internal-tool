export const queryKeys = {
  team: {
    all: ["team"] as const,
    list: () => [...queryKeys.team.all, "list"] as const,
    detail: (id: string) => [...queryKeys.team.all, "detail", id] as const,
    workload: (id: string) => [...queryKeys.team.detail(id), "workload"] as const,
  },
  businesses: {
    all: ["businesses"] as const,
    list: () => [...queryKeys.businesses.all, "list"] as const,
    detail: (id: string) => [...queryKeys.businesses.all, "detail", id] as const,
    activity: (id: string) => [...queryKeys.businesses.detail(id), "activity"] as const,
    tasks: (id: string) => [...queryKeys.businesses.detail(id), "tasks"] as const,
    resources: (id: string) => [...queryKeys.businesses.detail(id), "resources"] as const,
    followUps: (id: string) => [...queryKeys.businesses.detail(id), "follow-ups"] as const,
    financials: (id: string) => [...queryKeys.businesses.detail(id), "financials"] as const,
    pipelines: (id: string) => [...queryKeys.businesses.detail(id), "pipelines"] as const,
  },
  pipelines: {
    all: ["pipelines"] as const,
    list: () => [...queryKeys.pipelines.all, "list"] as const,
    options: () => [...queryKeys.pipelines.all, "options"] as const,
    detail: (id: string) => [...queryKeys.pipelines.all, "detail", id] as const,
    activity: (id: string) => [...queryKeys.pipelines.detail(id), "activity"] as const,
    followUps: (id: string) => [...queryKeys.pipelines.detail(id), "follow-ups"] as const,
    tasks: (id: string) => [...queryKeys.pipelines.detail(id), "tasks"] as const,
    resources: (id: string) => [...queryKeys.pipelines.detail(id), "resources"] as const,
    reasons: () => [...queryKeys.pipelines.all, "reasons"] as const,
    phases: (id: string) => [...queryKeys.pipelines.detail(id), "phases"] as const,
    quotations: (id: string) => [...queryKeys.pipelines.detail(id), "quotations"] as const,
    decision: (id: string) => [...queryKeys.pipelines.detail(id), "decision"] as const,
    payments: (id: string) => [...queryKeys.pipelines.detail(id), "payments"] as const,
    paymentStatus: (id: string) => [...queryKeys.pipelines.detail(id), "payment-status"] as const,
    project: (id: string) => [...queryKeys.pipelines.detail(id), "project"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: () => [...queryKeys.tasks.all, "list"] as const,
    detail: (id: string) => [...queryKeys.tasks.all, "detail", id] as const,
    options: () => [...queryKeys.tasks.all, "options"] as const,
  },
  resources: {
    all: ["resources"] as const,
    list: () => [...queryKeys.resources.all, "list"] as const,
    detail: (id: string) => [...queryKeys.resources.all, "detail", id] as const,
    options: () => [...queryKeys.resources.all, "options"] as const,
    fileText: (id: string) => [...queryKeys.resources.all, "file-text", id] as const,
  },
  followUps: {
    all: ["follow-ups"] as const,
  },
  accounts: {
    all: ["accounts"] as const,
    summary: () => [...queryKeys.accounts.all, "summary"] as const,
    transactions: (filters?: Record<string, string | undefined>) =>
      [...queryKeys.accounts.all, "transactions", filters ?? {}] as const,
    outstanding: () => [...queryKeys.accounts.all, "outstanding"] as const,
    revenueByMonth: () => [...queryKeys.accounts.all, "revenue-by-month"] as const,
    earningsVsExpenses: () => [...queryKeys.accounts.all, "earnings-vs-expenses"] as const,
    options: () => [...queryKeys.accounts.all, "options"] as const,
    detail: (id: string) => [...queryKeys.accounts.all, "detail", id] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    data: () => [...queryKeys.dashboard.all, "data"] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    tab: (tab: string, period?: string) =>
      [...queryKeys.analytics.all, tab, period ?? "monthly"] as const,
  },
  activity: {
    all: ["activity"] as const,
    timeline: (filters?: Record<string, string | undefined>) =>
      [...queryKeys.activity.all, "timeline", filters ?? {}] as const,
  },
  search: {
    all: ["search"] as const,
    query: (q: string) => [...queryKeys.search.all, q] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: () => [...queryKeys.notifications.all, "list"] as const,
  },
  settings: {
    all: ["settings"] as const,
    data: () => [...queryKeys.settings.all, "data"] as const,
  },
} as const;
