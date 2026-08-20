"use client";

import Link from "next/link";
import { Building2Icon } from "lucide-react";

import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTACT_ROLE_LABELS } from "@/features/businesses/constants";
import type { PhaseDataDto } from "@/features/phases/api";

export function BusinessAtAGlance({
  businessName,
  ownerName,
  leadSourceLabel,
  paymentPending,
  contactInfo,
}: {
  businessName: string;
  ownerName: string | null;
  leadSourceLabel: string;
  paymentPending: boolean;
  contactInfo: PhaseDataDto["contactInfo"] | undefined;
}) {
  const primaryContact =
    contactInfo?.contacts.find((c) => c.isPrimary) ?? contactInfo?.contacts[0] ?? null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-base">Business at a glance</CardTitle>
        {contactInfo ? (
          <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" asChild>
            <Link href={`/businesses/${contactInfo.id}`}>View business</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex items-start gap-3">
          <Building2Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="font-medium">{businessName}</p>
            <p className="text-muted-foreground">
              {[contactInfo?.industry, contactInfo?.location].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
        {primaryContact ? (
          <div className="rounded-md border px-3 py-2">
            <p className="font-medium">{primaryContact.name}</p>
            <p className="text-xs text-muted-foreground">
              {CONTACT_ROLE_LABELS[primaryContact.role]}
              {primaryContact.email ? ` · ${primaryContact.email}` : ""}
            </p>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>
            Owner: <span className="text-foreground">{ownerName ?? "Unassigned"}</span>
          </span>
          <span>
            Lead: <span className="text-foreground">{leadSourceLabel}</span>
          </span>
        </div>
        {paymentPending ? <StatusBadge kind="PENDING" className="self-start" /> : null}
      </CardContent>
    </Card>
  );
}
