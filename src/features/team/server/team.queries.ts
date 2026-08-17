import "server-only";

import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

/** Admin-gated. Lists all members (including INACTIVE) with their roles. */
export async function listMembers() {
  await requirePermission("team:manage");
  return db.teamMember.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}
export type MemberListItem = Awaited<ReturnType<typeof listMembers>>[number];

/** Admin-gated. Single member detail with roles. */
export async function getMemberById(id: string) {
  await requirePermission("team:manage");
  return db.teamMember.findUnique({ where: { id } });
}
export type MemberDetail = NonNullable<Awaited<ReturnType<typeof getMemberById>>>;
