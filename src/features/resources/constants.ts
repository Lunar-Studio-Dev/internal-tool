import { ResourceType } from "@/generated/prisma/enums";

export const RESOURCE_TYPE_ORDER: ResourceType[] = [
  ResourceType.PDF,
  ResourceType.DOCX,
  ResourceType.IMAGE,
  ResourceType.TEXT,
  ResourceType.QUOTATION,
  ResourceType.REQUIREMENT,
  ResourceType.RESEARCH,
  ResourceType.MEETING_NOTES,
  ResourceType.OTHER,
];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  PDF: "PDF",
  DOCX: "Document",
  IMAGE: "Image",
  TEXT: "Text",
  QUOTATION: "Quotation",
  REQUIREMENT: "Requirement",
  RESEARCH: "Research",
  MEETING_NOTES: "Meeting Notes",
  OTHER: "Other",
};

/** MIME types accepted for upload. Enforced client-side (UX) and server-side (auth). */
export const ALLOWED_UPLOAD_MIME: string[] = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "text/markdown",
];

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

/** Best-effort file-format type from MIME/filename (semantic types are picked manually). */
export function inferResourceType(contentType: string, filename: string): ResourceType {
  const ct = contentType.toLowerCase();
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ct === "application/pdf" || ext === "pdf") return ResourceType.PDF;
  if (ct.startsWith("image/")) return ResourceType.IMAGE;
  if (ct.includes("word") || ext === "doc" || ext === "docx") return ResourceType.DOCX;
  if (ct.startsWith("text/") || ["txt", "md", "csv"].includes(ext)) return ResourceType.TEXT;
  return ResourceType.OTHER;
}

export function humanFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ResourcePreviewKind = "image" | "pdf" | "text" | "unsupported";

/** Same-origin file stream used for in-app preview and download. */
export function resourceFilePath(id: string, download = false): string {
  return download ? `/api/resources/${id}/file?download=1` : `/api/resources/${id}/file`;
}

/** How the preview modal should render this file (semantic ResourceType is ignored). */
export function previewKind(
  contentType: string | null | undefined,
  filename: string,
): ResourcePreviewKind {
  const ct = (contentType ?? "").toLowerCase();
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ct.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (ct === "application/pdf" || ext === "pdf") return "pdf";
  if (ct.startsWith("text/") || ["txt", "md", "csv"].includes(ext)) return "text";
  return "unsupported";
}
