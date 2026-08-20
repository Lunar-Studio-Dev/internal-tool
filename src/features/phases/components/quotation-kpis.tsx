"use client";

import {
  CalendarClockIcon,
  CheckCircle2Icon,
  FileStackIcon,
  IndianRupeeIcon,
  WalletIcon,
} from "lucide-react";

import { MetricCard, METRIC_GRID_CLASS } from "@/components/common/metric-card";
import type { PipelineDecisionDto, QuotationDto } from "@/features/phases/api";
import { formatINR } from "@/features/phases/constants";
import {
  CLIENT_DECISION_LABELS,
  computeQuotationKpis,
} from "@/features/phases/quotation-metrics";
import type { PaymentStatusDto } from "@/features/payments/api";

export function QuotationKpis({
  quotations,
  decision,
  paymentStatus,
  onOpenPayments,
  onOpenCurrent,
}: {
  quotations: QuotationDto[];
  decision: PipelineDecisionDto | null;
  paymentStatus?: PaymentStatusDto | null;
  onOpenPayments?: () => void;
  onOpenCurrent?: () => void;
}) {
  const kpis = computeQuotationKpis({ quotations, decision, paymentStatus });

  if (!quotations.length) return null;

  const decisionTone =
    kpis.decision === "ACCEPTED"
      ? "success"
      : kpis.decision === "REJECTED"
        ? "warning"
        : "default";

  return (
    <div className={METRIC_GRID_CLASS}>
      <MetricCard
        icon={IndianRupeeIcon}
        label="Contract value"
        value={formatINR(kpis.contractValue)}
        hint={kpis.contractHint}
        tone={kpis.validUntilExpired ? "warning" : "default"}
        onClick={kpis.current ? onOpenCurrent : undefined}
      />
      <MetricCard
        icon={WalletIcon}
        label="Initial payment"
        value={formatINR(kpis.initialPayment)}
        hint={kpis.initialHint}
        onClick={kpis.current ? onOpenCurrent : undefined}
      />
      <MetricCard
        icon={CheckCircle2Icon}
        label="Client decision"
        value={CLIENT_DECISION_LABELS[kpis.decision]}
        hint={kpis.decisionHint}
        tone={decisionTone}
      />
      {kpis.decision === "ACCEPTED" ? (
        <MetricCard
          icon={FileStackIcon}
          label="Collected"
          value={formatINR(kpis.receivedPaise)}
          hint={kpis.collectedHint}
          tone={kpis.remainingPaise === 0 && kpis.receivedPaise > 0 ? "success" : "default"}
          onClick={onOpenPayments}
        />
      ) : (
        <MetricCard
          icon={CalendarClockIcon}
          label="Versions"
          value={kpis.versionCount}
          hint={
            kpis.validUntil
              ? `Valid until ${kpis.validUntil.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
              : "No expiry set"
          }
          tone={kpis.validUntilExpired ? "warning" : "default"}
        />
      )}
    </div>
  );
}
