"use client";

import type { ReactNode } from "react";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  FileStackIcon,
  IndianRupeeIcon,
  WalletIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { PipelineDecisionDto, QuotationDto } from "@/features/phases/api";
import { formatINR } from "@/features/phases/constants";
import {
  CLIENT_DECISION_LABELS,
  computeQuotationKpis,
} from "@/features/phases/quotation-metrics";
import type { PaymentStatusDto } from "@/features/payments/api";
import { cn } from "@/lib/utils";

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string | null;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning" | "success";
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);

  return (
    <Card
      className={cn(
        tone === "warning" && "border-amber-500/40",
        tone === "success" && "border-emerald-500/40",
        interactive && "cursor-pointer transition-colors hover:bg-muted/40",
      )}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <CardContent className="flex items-start gap-3 pt-4">
        <div className="rounded-md bg-muted p-2">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
          {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
