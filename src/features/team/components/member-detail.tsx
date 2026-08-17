import { ActivityIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberDetailActions } from "@/features/team/components/member-detail-actions";
import { ROLE_LABELS } from "@/features/team/constants";
import type { MemberDetail } from "@/features/team/server/team.queries";

const WORKLOAD = [
  { label: "Active Tasks", value: 0 },
  { label: "Overdue", value: 0 },
  { label: "Pipelines", value: 0 },
  { label: "Follow-ups", value: 0 },
];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function MemberDetailView({ member }: { member: MemberDetail }) {
  const roleNames = member.roles;
  const editInitial = {
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone ?? "",
    roles: roleNames,
  };

  return (
    <>
      <PageHeader
        title={member.name}
        description={member.email}
        breadcrumbs={[{ label: "Team", href: "/team" }, { label: member.name }]}
        action={
          <MemberDetailActions id={member.id} status={member.status} initial={editInitial} />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge kind={member.status} />
        {roleNames.map((role) => (
          <Badge key={role} variant="secondary">
            {ROLE_LABELS[role]}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workload</CardTitle>
            <CardDescription>Counts populate as later phases land.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {WORKLOAD.map((item) => (
              <div key={item.label}>
                <div className="text-2xl font-semibold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <DetailRow label="Email" value={member.email} />
            <DetailRow label="Phone" value={member.phone || "—"} />
            <DetailRow
              label="Account"
              value={
                member.status === "PENDING"
                  ? "Invited — awaiting first sign-in"
                  : member.authUserId
                    ? "Linked"
                    : "Not linked"
              }
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <EmptyState
            title="No tasks yet"
            description="Task assignments appear here once the To-Dos module lands."
          />
        </TabsContent>
        <TabsContent value="pipelines">
          <EmptyState
            title="No pipelines yet"
            description="Owned and assigned pipelines appear here in a later phase."
          />
        </TabsContent>
        <TabsContent value="activity">
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Audit-trail entries for this member will show here."
          />
        </TabsContent>
        <TabsContent value="roles">
          <div className="flex flex-wrap gap-2 p-1">
            {roleNames.map((role) => (
              <Badge key={role} variant="secondary">
                {ROLE_LABELS[role]}
              </Badge>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
