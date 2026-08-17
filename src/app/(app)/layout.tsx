import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NoAccessScreen } from "@/components/layout/no-access-screen";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CurrentMemberProvider } from "@/features/team/hooks/use-current-member";
import { getCurrentMember } from "@/lib/auth/member";
import { getCurrentUser } from "@/lib/auth/session";

// Reads session + member (cookies/DB), so this subtree renders dynamically.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");

  const member = await getCurrentMember();

  // Gate: only an ACTIVE, linked, non-banned member reaches the app shell.
  if (!member) {
    return (
      <NoAccessScreen
        email={user.email ?? ""}
        message="Your account isn't linked to a team member yet. Ask an admin to add you to the team."
      />
    );
  }
  if (member.banned) {
    return (
      <NoAccessScreen
        email={member.email}
        message="Your account has been suspended. Contact an administrator."
      />
    );
  }
  if (member.status === "PENDING") {
    return (
      <NoAccessScreen
        email={member.email}
        message="Your invitation is still pending. Sign in with the temporary password from your invite email to activate your account."
      />
    );
  }
  if (member.status === "INACTIVE") {
    return (
      <NoAccessScreen
        email={member.email}
        message="Your access has been deactivated. Contact an administrator to restore it."
      />
    );
  }

  const memberView = {
    id: member.id,
    name: member.name,
    email: member.email,
    image: member.image,
    isAdmin: member.isAdmin,
    roleNames: member.roleNames,
  };

  return (
    <CurrentMemberProvider member={memberView}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </CurrentMemberProvider>
  );
}
