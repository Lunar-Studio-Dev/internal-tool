import type { Metadata } from "next";
import { Building2Icon, ListTodoIcon, WalletIcon, WorkflowIcon } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { METRIC_GRID_CLASS } from "@/components/common/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

const STATS = [
  { label: "Active pipelines", value: "—", icon: WorkflowIcon },
  { label: "Businesses", value: "—", icon: Building2Icon },
  { label: "Open tasks", value: "—", icon: ListTodoIcon },
  { label: "Earnings (month)", value: "—", icon: WalletIcon },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your client management overview. Live metrics arrive as later phases land."
        breadcrumbs={[{ label: "Dashboard" }]}
      />
      <div className={METRIC_GRID_CLASS}>
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
