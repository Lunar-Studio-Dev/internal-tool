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
} as const;
