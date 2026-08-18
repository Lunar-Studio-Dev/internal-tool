import {
  FolderClosedIcon,
  ListTodoIcon,
  WalletIcon,
  WorkflowIcon,
} from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityList } from "@/features/businesses/components/activity-list";
import { BusinessDetailActions } from "@/features/businesses/components/business-detail-actions";
import type { BusinessFormInitial } from "@/features/businesses/components/business-form";
import { ContactTable, type ContactRow } from "@/features/businesses/components/contact-table";
import { CONTACT_ROLE_LABELS } from "@/features/businesses/constants";
import type {
  BusinessActivityItem,
  BusinessDetail as BusinessDetailData,
} from "@/features/businesses/server/businesses.queries";

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value ? value : <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

function TabPlaceholder({
  icon,
  title,
  description,
}: {
  icon: typeof WorkflowIcon;
  title: string;
  description: string;
}) {
  return <EmptyState icon={icon} title={title} description={description} />;
}

export function BusinessDetail({
  business,
  activity,
}: {
  business: BusinessDetailData;
  activity: BusinessActivityItem[];
}) {
  const social = (business.social ?? {}) as Record<string, string>;
  const socialEntries = Object.entries(social).filter(([, v]) => Boolean(v));

  const primary = business.contacts.find((c) => c.isPrimary) ?? business.contacts[0] ?? null;

  const contactRows: ContactRow[] = business.contacts.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    role: c.role,
    isPrimary: c.isPrimary,
    notes: c.notes ?? "",
  }));

  const editInitial: BusinessFormInitial = {
    id: business.id,
    name: business.name,
    website: business.website ?? "",
    email: business.email ?? "",
    phone: business.phone ?? "",
    industry: business.industry ?? "",
    location: business.location ?? "",
    address: business.address ?? "",
    notes: business.notes ?? "",
    social: {
      linkedin: social.linkedin ?? "",
      instagram: social.instagram ?? "",
      facebook: social.facebook ?? "",
      x: social.x ?? "",
    },
  };

  const subtitle = [business.website, business.industry, business.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        title={business.name}
        description={subtitle || undefined}
        breadcrumbs={[{ label: "Businesses", href: "/businesses" }, { label: business.name }]}
        action={<BusinessDetailActions initial={editInitial} />}
      />

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Business information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <InfoRow label="Website" value={business.website} />
                <InfoRow label="Email" value={business.email} />
                <InfoRow label="Phone" value={business.phone} />
                <InfoRow label="Industry" value={business.industry} />
                <InfoRow label="Location" value={business.location} />
                <InfoRow label="Address" value={business.address} />
                {socialEntries.length > 0 ? (
                  <div className="col-span-2 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Social</span>
                    <div className="flex flex-wrap gap-1">
                      {socialEntries.map(([key, value]) => (
                        <Badge key={key} variant="outline" className="font-normal">
                          {SOCIAL_LABELS[key] ?? key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {business.notes ? (
                  <div className="col-span-2">
                    <InfoRow label="Notes" value={business.notes} />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Primary contact</CardTitle>
              </CardHeader>
              <CardContent>
                {primary ? (
                  <div className="flex flex-col gap-3">
                    <InfoRow label="Name" value={primary.name} />
                    <InfoRow label="Email" value={primary.email} />
                    <InfoRow label="Phone" value={primary.phone} />
                    <InfoRow label="Role" value={CONTACT_ROLE_LABELS[primary.role]} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No contact on file.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipelines">
          <TabPlaceholder
            icon={WorkflowIcon}
            title="No pipelines yet"
            description="Pipelines for this business will appear here."
          />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactTable businessId={business.id} contacts={contactRows} />
        </TabsContent>

        <TabsContent value="resources">
          <TabPlaceholder
            icon={FolderClosedIcon}
            title="No resources yet"
            description="Documents and links attached to this business will appear here."
          />
        </TabsContent>

        <TabsContent value="tasks">
          <TabPlaceholder
            icon={ListTodoIcon}
            title="No tasks yet"
            description="Tasks related to this business will appear here."
          />
        </TabsContent>

        <TabsContent value="financials">
          <TabPlaceholder
            icon={WalletIcon}
            title="No financials yet"
            description="Earnings and payments for this business will appear here."
          />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityList items={activity} />
        </TabsContent>
      </Tabs>
    </>
  );
}
