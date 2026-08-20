"use client";

import { format } from "date-fns";
import { ArrowRightIcon, CreditCardIcon, PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { InfoRow } from "@/components/common/info-row";
import { METRIC_GRID_CLASS } from "@/components/common/metric-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FollowUpFormDialog } from "@/features/followups/components/followup-form-dialog";
import { PAYMENT_METHOD_LABELS } from "@/features/payments/constants";
import { RecordPaymentDialog } from "@/features/payments/components/record-payment-dialog";
import type { PaymentItemDto, PaymentStatusDto } from "@/features/payments/api";
import { formatINR } from "@/features/phases/constants";
import { PhaseType } from "@/generated/prisma/enums";

export function PaymentPendingPanel({
  pipelineId,
  businessId,
  businessName,
  pipelineCode,
  status,
  payments,
  canWrite,
  canFollowUp,
  canHandoverWrite,
  deactivated,
  hasProject,
  onHandover,
}: {
  pipelineId: string;
  businessId: string;
  businessName: string;
  pipelineCode: string;
  status: PaymentStatusDto;
  payments: PaymentItemDto[];
  canWrite: boolean;
  canFollowUp: boolean;
  canHandoverWrite: boolean;
  deactivated: boolean;
  hasProject: boolean;
  onHandover?: () => void;
}) {
  const quotationLabel =
    status.quotationVersion != null
      ? `V${status.quotationVersion} · ${formatINR(status.contractTotalPaise)}`
      : "No current quotation";

  if (!status.quotationId && payments.length === 0) {
    return (
      <EmptyState
        icon={CreditCardIcon}
        title="No payment context yet"
        description="Publish and accept a quotation to start tracking payments."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Payment status</CardTitle>
            <p className="text-sm text-muted-foreground">{quotationLabel}</p>
          </div>
          {statusLabel(status)}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className={METRIC_GRID_CLASS}>
            <InfoRow label="Contract total" value={formatINR(status.contractTotalPaise)} />
            <InfoRow label="Received" value={formatINR(status.receivedPaise)} />
            <InfoRow label="Initial remaining" value={formatINR(status.initialRemainingPaise)} />
            <InfoRow label="Contract remaining" value={formatINR(status.contractRemainingPaise)} />
          </div>

          <div className="flex flex-wrap gap-2">
            {canWrite && status.canRecordPayment && !deactivated ? (
              <RecordPaymentDialog
                pipelineId={pipelineId}
                businessName={businessName}
                pipelineCode={pipelineCode}
                quotationLabel={quotationLabel}
                remainingPaise={status.contractRemainingPaise}
                trigger={
                  <Button size="sm">
                    <PlusIcon className="size-4" />
                    Receive payment from client
                  </Button>
                }
              />
            ) : null}

            {canFollowUp && status.canRecordPayment && !deactivated ? (
              <FollowUpFormDialog
                businessId={businessId}
                pipelineId={pipelineId}
                phaseType={
                  status.currentPhase === PhaseType.PROJECT_MANAGEMENT
                    ? PhaseType.PROJECT_MANAGEMENT
                    : PhaseType.QUOTATION
                }
                trigger={
                  <Button size="sm" variant="outline">
                    Add payment follow-up
                  </Button>
                }
              />
            ) : null}

            {status.canHandover && !deactivated && onHandover ? (
              hasProject ? (
                <Button size="sm" variant="outline" onClick={onHandover}>
                  View development handoff
                  <ArrowRightIcon className="size-4" />
                </Button>
              ) : canHandoverWrite ? (
                <Button size="sm" variant="secondary" onClick={onHandover}>
                  Handover to development
                  <ArrowRightIcon className="size-4" />
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled title="Needs project write access">
                  Handover to development
                </Button>
              )
            ) : null}
          </div>

          {status.awaitingInitial ? (
            <p className="text-sm text-muted-foreground">
              Initial payment ({formatINR(status.initialRequiredPaise)}) unlocks Project Management
              and development handover. Keep recording payments here until the full contract is paid.
            </p>
          ) : null}
          {status.initialMet && !status.fullyPaid ? (
            <p className="text-sm text-muted-foreground">
              Initial payment is met. Continue receiving balance payments until the contract total
              is cleared.
            </p>
          ) : null}
          {status.fullyPaid ? (
            <p className="text-sm text-muted-foreground">
              Contract is fully paid. No further client payments are needed for this quotation.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCardIcon}
          title="No payments recorded"
          description={
            status.canRecordPayment
              ? "Receive payment from the client when funds arrive."
              : "Payments for this pipeline will appear here."
          }
        />
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="font-medium">{formatINR(payment.amount)}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(payment.date), "d MMM yyyy")} ·{" "}
                  {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                  {payment.reference ? ` · ${payment.reference}` : ""}
                </span>
                {payment.notes ? (
                  <span className="text-xs text-muted-foreground">{payment.notes}</span>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {payment.createdByName ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusLabel(status: PaymentStatusDto) {
  if (status.fullyPaid) {
    return <Badge variant="secondary">Fully paid</Badge>;
  }
  if (status.awaitingInitial) {
    return <StatusBadge kind="PENDING" />;
  }
  if (status.initialMet && status.contractRemainingPaise > 0) {
    return <Badge variant="outline">Balance outstanding</Badge>;
  }
  if (status.currentPhase === PhaseType.PROJECT_MANAGEMENT) {
    return <Badge variant="secondary">Initial paid</Badge>;
  }
  return null;
}
