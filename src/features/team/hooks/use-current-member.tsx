"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { RoleName } from "@/generated/prisma/enums";
import { can } from "@/lib/rbac";

export type CurrentMemberView = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isAdmin: boolean;
  roleNames: RoleName[];
};

const CurrentMemberContext = createContext<CurrentMemberView | null>(null);

export function CurrentMemberProvider({
  member,
  children,
}: {
  member: CurrentMemberView;
  children: ReactNode;
}) {
  return (
    <CurrentMemberContext.Provider value={member}>{children}</CurrentMemberContext.Provider>
  );
}

export function useCurrentMember(): CurrentMemberView {
  const ctx = useContext(CurrentMemberContext);
  if (!ctx) {
    throw new Error("useCurrentMember must be used within CurrentMemberProvider");
  }
  return ctx;
}

/** UI gating only (cosmetic). Server actions/queries remain authoritative. */
export function useCan(permission: string): boolean {
  const member = useCurrentMember();
  return can({ isAdmin: member.isAdmin, roleNames: member.roleNames }, permission);
}
