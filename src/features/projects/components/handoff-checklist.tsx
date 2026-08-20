"use client";

import { CheckCircle2Icon, CircleIcon } from "lucide-react";

import type { HandoffChecklist } from "@/features/projects/types";
import { cn } from "@/lib/utils";

const CHECKLIST_LABELS: { key: keyof HandoffChecklist; label: string }[] = [
  { key: "businessInfo", label: "Business info" },
  { key: "understanding", label: "Understanding" },
  { key: "requirements", label: "Requirements" },
  { key: "finalQuotation", label: "Final quotation" },
  { key: "initialPayment", label: "Initial payment" },
  { key: "clientContacts", label: "Client contacts" },
  { key: "resources", label: "Resources" },
];

export function HandoffChecklistView({ checklist }: { checklist: HandoffChecklist }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {CHECKLIST_LABELS.map(({ key, label }) => {
        const done = checklist[key];
        return (
          <li key={key} className="flex items-center gap-2 text-sm">
            {done ? (
              <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <CircleIcon className="size-4 text-muted-foreground" />
            )}
            <span className={cn(done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
