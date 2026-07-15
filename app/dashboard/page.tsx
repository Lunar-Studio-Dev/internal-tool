import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./client-page";

export default async function DashboardPage() {
  // 1. Authenticate Request
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    redirect("/");
  }

  // 2. Fetch Data in Parallel for maximum performance
  const [quotationsCount, templatesCount, recentQuotations, recentTemplates] = await Promise.all([
    prisma.quotation.count({ where: { userId: session.user.id } }),
    prisma.template.count({ where: { userId: session.user.id } }),
    prisma.quotation.findMany({
      where: { userId: session.user.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { template: true }
    }),
    prisma.template.findMany({
      where: { userId: session.user.id },
      take: 3,
      orderBy: { updatedAt: "desc" }
    })
  ]);

  // 3. Render integrated Client view
  return (
    <DashboardClient
      user={{ name: session.user.name || "User", email: session.user.email }}
      counts={{ quotations: quotationsCount, templates: templatesCount }}
      recentQuotations={recentQuotations}
      recentTemplates={recentTemplates}
    />
  );
}
