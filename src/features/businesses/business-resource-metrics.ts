import {
  filterResources,
  isDocumentType,
  type ResourceFilter,
} from "@/features/resources/resource-metrics";
import type { PhaseType, ResourceType } from "@/generated/prisma/enums";

export type BusinessResourceItem = {
  id: string;
  name: string;
  type: ResourceType;
  pipelineId?: string | null;
  phaseType?: PhaseType | null;
};

export type BusinessResourceMetrics = {
  total: number;
  linked: number;
  documents: number;
  images: number;
  linkedHint: string | null;
};

export function computeBusinessResourceMetrics(
  items: BusinessResourceItem[],
): BusinessResourceMetrics {
  let linked = 0;
  let documents = 0;
  let images = 0;

  for (const item of items) {
    if (item.pipelineId) linked += 1;
    if (isDocumentType(item.type)) documents += 1;
    if (item.type === "IMAGE") images += 1;
  }

  const unattached = items.length - linked;

  return {
    total: items.length,
    linked,
    documents,
    images,
    linkedHint:
      items.length === 0
        ? null
        : unattached > 0
          ? `${unattached} unattached`
          : "All linked to pipelines",
  };
}

/** Business-scoped resource filters (no "this phase"). */
export const BUSINESS_RESOURCE_FILTERS: { value: ResourceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "documents", label: "Documents" },
  { value: "images", label: "Images" },
  { value: "quotation", label: "Quotation" },
  { value: "requirement", label: "Requirement" },
  { value: "research", label: "Research" },
  { value: "meeting_notes", label: "Meeting notes" },
  { value: "other", label: "Other" },
];

export function filterBusinessResources<T extends BusinessResourceItem>(
  items: T[],
  filter: ResourceFilter,
): T[] {
  if (filter === "this_phase") return items;
  return filterResources(items, filter, "DISCOVERY");
}
