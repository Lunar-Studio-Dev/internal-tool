import type { PhaseType, ResourceType } from "@/generated/prisma/enums";

export type ResourceMetricItem = {
  id: string;
  type: ResourceType;
  phaseType?: PhaseType | null;
};

export type ResourceMetrics = {
  total: number;
  thisPhase: number;
  documents: number;
  images: number;
};

const DOCUMENT_TYPES: ResourceType[] = ["PDF", "DOCX", "TEXT"];

export function isDocumentType(type: ResourceType): boolean {
  return DOCUMENT_TYPES.includes(type);
}

export function computeResourceMetrics(
  items: ResourceMetricItem[],
  currentPhase: PhaseType,
): ResourceMetrics {
  let thisPhase = 0;
  let documents = 0;
  let images = 0;

  for (const item of items) {
    if (item.phaseType === currentPhase) thisPhase += 1;
    if (isDocumentType(item.type)) documents += 1;
    if (item.type === "IMAGE") images += 1;
  }

  return {
    total: items.length,
    thisPhase,
    documents,
    images,
  };
}

export type ResourceFilter =
  | "all"
  | "this_phase"
  | "documents"
  | "images"
  | "pdf"
  | "docx"
  | "text"
  | "quotation"
  | "requirement"
  | "research"
  | "meeting_notes"
  | "other";

export function filterResources<T extends ResourceMetricItem>(
  items: T[],
  filter: ResourceFilter,
  currentPhase: PhaseType,
): T[] {
  switch (filter) {
    case "this_phase":
      return items.filter((item) => item.phaseType === currentPhase);
    case "documents":
      return items.filter((item) => isDocumentType(item.type));
    case "images":
      return items.filter((item) => item.type === "IMAGE");
    case "pdf":
      return items.filter((item) => item.type === "PDF");
    case "docx":
      return items.filter((item) => item.type === "DOCX");
    case "text":
      return items.filter((item) => item.type === "TEXT");
    case "quotation":
      return items.filter((item) => item.type === "QUOTATION");
    case "requirement":
      return items.filter((item) => item.type === "REQUIREMENT");
    case "research":
      return items.filter((item) => item.type === "RESEARCH");
    case "meeting_notes":
      return items.filter((item) => item.type === "MEETING_NOTES");
    case "other":
      return items.filter((item) => item.type === "OTHER");
    default:
      return items;
  }
}
