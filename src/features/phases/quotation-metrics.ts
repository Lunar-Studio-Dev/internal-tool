import { format } from "date-fns";

import type { PipelineDecisionDto, QuotationDto } from "@/features/phases/api";
import { formatINR } from "@/features/phases/constants";
import type { PaymentStatusDto } from "@/features/payments/api";

export type QuotationLineItem = {
  item: string;
  qty: number;
  ratePaise: number;
  amountPaise: number;
};

export const CLIENT_DECISION_LABELS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  LATER: "Later",
} as const;

export const QUOTATION_STATUS_LABELS = {
  DRAFT: "Draft",
  CURRENT: "Current",
  SUPERSEDED: "Superseded",
} as const;

export function parseQuotationItems(items: unknown): QuotationLineItem[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    const item = typeof record.item === "string" ? record.item : "";
    const qty = typeof record.qty === "number" ? record.qty : Number(record.qty) || 0;
    const ratePaise =
      typeof record.ratePaise === "number" ? record.ratePaise : Number(record.ratePaise) || 0;
    const amountPaise =
      typeof record.amountPaise === "number"
        ? record.amountPaise
        : Number(record.amountPaise) || Math.round(qty * ratePaise);
    if (!item.trim()) return [];
    return [{ item, qty, ratePaise, amountPaise }];
  });
}

export type QuotationKpis = {
  current: QuotationDto | null;
  versionCount: number;
  decision: keyof typeof CLIENT_DECISION_LABELS;
  decisionHint: string | null;
  contractValue: number;
  contractHint: string | null;
  initialPayment: number;
  initialHint: string | null;
  receivedPaise: number;
  remainingPaise: number;
  collectedHint: string | null;
  validUntil: Date | null;
  validUntilExpired: boolean;
};

export function computeQuotationKpis(params: {
  quotations: QuotationDto[];
  decision: PipelineDecisionDto | null;
  paymentStatus?: PaymentStatusDto | null;
}): QuotationKpis {
  const current =
    params.quotations.find((q) => q.status === "CURRENT") ??
    params.quotations[0] ??
    null;
  const decision = params.decision?.decision ?? "PENDING";
  const contractValue = current?.subtotal ?? params.paymentStatus?.contractTotalPaise ?? 0;
  const initialPayment = current?.initialPayment ?? params.paymentStatus?.initialRequiredPaise ?? 0;
  const receivedPaise = params.paymentStatus?.receivedPaise ?? 0;
  const remainingPaise =
    params.paymentStatus?.contractRemainingPaise ??
    Math.max(0, contractValue - receivedPaise);
  const validUntil = current?.validUntil ? new Date(current.validUntil) : null;
  const validUntilExpired = validUntil ? validUntil.getTime() < Date.now() : false;

  let decisionHint: string | null = null;
  if (params.decision?.decidedAt) {
    decisionHint = `Decided ${format(new Date(params.decision.decidedAt), "d MMM yyyy")}`;
  } else if (decision === "PENDING") {
    decisionHint = "Awaiting client response";
  }

  const contractHint = current
    ? `V${current.version}${current.title ? ` · ${current.title}` : ""}`
    : params.quotations.length
      ? `${params.quotations.length} version${params.quotations.length === 1 ? "" : "s"}`
      : "No quotation yet";

  const initialHint =
    contractValue > 0 && initialPayment > 0
      ? `${Math.round((initialPayment / contractValue) * 100)}% of contract`
      : initialPayment > 0
        ? formatINR(initialPayment)
        : "Not set";

  const collectedHint =
    decision === "ACCEPTED"
      ? remainingPaise > 0
        ? `${formatINR(remainingPaise)} remaining`
        : receivedPaise > 0
          ? "Fully collected"
          : "No payments recorded"
      : decision === "PENDING"
        ? "Accept quotation to collect"
        : null;

  return {
    current,
    versionCount: params.quotations.length,
    decision,
    decisionHint,
    contractValue,
    contractHint,
    initialPayment,
    initialHint,
    receivedPaise,
    remainingPaise,
    collectedHint,
    validUntil,
    validUntilExpired,
  };
}
