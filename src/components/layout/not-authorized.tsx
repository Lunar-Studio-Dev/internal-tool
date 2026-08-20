import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";

export function NotAuthorized({
  title,
  description,
  breadcrumbs,
}: {
  title: string;
  description: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <>
      <PageHeader title={title} breadcrumbs={breadcrumbs ?? [{ label: title }]} />
      <EmptyState icon={ShieldIcon} title="Not authorized" description={description} />
    </>
  );
}
