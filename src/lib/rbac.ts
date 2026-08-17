import type { RoleName } from "@/generated/prisma/enums";

/**
 * Code-defined RBAC (v1). Single source of truth for permissions.
 *
 * Note the asymmetry: quotation/payment/project are WRITE-ONLY here. Reading them
 * is implied by the matching `:write` or a parent read scope (see READ_IMPLIED_BY
 * + `hasPermission`), so we don't mint dead `:read` permissions.
 */
export const PERMISSIONS = [
  "business:read",
  "business:write",
  "pipeline:read",
  "pipeline:write",
  "task:read",
  "task:write",
  "resource:read",
  "resource:write",
  "quotation:write",
  "payment:write",
  "accounts:read",
  "accounts:write",
  "project:write",
  "team:manage",
  "settings:manage",
  "analytics:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Allow arbitrary permission-like strings (e.g. implied `:read`) without losing autocomplete. */
type PermissionInput = Permission | (string & {});

export const ROLE_PERMS: Record<RoleName, Permission[]> = {
  ADMIN: [...PERMISSIONS],
  CLIENT_MANAGER: [
    "business:read",
    "business:write",
    "pipeline:read",
    "pipeline:write",
    "task:read",
    "task:write",
    "resource:read",
    "resource:write",
  ],
  BUSINESS_ANALYST: [
    "business:read",
    "pipeline:read",
    "resource:read",
    "resource:write",
    "task:read",
    "task:write",
  ],
  SALES: [
    "business:read",
    "business:write",
    "pipeline:read",
    "pipeline:write",
    "quotation:write",
    "task:read",
    "task:write",
  ],
  FINANCE: ["accounts:read", "accounts:write", "payment:write", "business:read"],
  DEVELOPER: ["project:write", "resource:read", "resource:write", "task:read", "task:write"],
  PROJECT_MANAGER: [
    "project:write",
    "pipeline:read",
    "pipeline:write",
    "task:read",
    "task:write",
    "resource:read",
  ],
};

/** Effective permissions for a member = union across their roles. */
export function getPermissions(roles: RoleName[]): Set<Permission> {
  return new Set(roles.flatMap((role) => ROLE_PERMS[role]));
}

// quotation/payment/project are write-only; a `:read` request is satisfied by the
// matching `:write` (write-implies-read) or by a parent read scope. This is what
// lets DEVELOPER (project:write, no pipeline:read) read their assigned projects.
const READ_IMPLIED_BY: Record<string, Permission[]> = {
  "quotation:read": ["quotation:write", "pipeline:read"],
  "payment:read": ["payment:write", "accounts:read"],
  "project:read": ["project:write", "pipeline:read"],
};

export function hasPermission(perms: Set<Permission>, needed: PermissionInput): boolean {
  if (perms.has(needed as Permission)) return true;
  return (READ_IMPLIED_BY[needed] ?? []).some((p) => perms.has(p));
}

export type PermissionContext = { isAdmin: boolean; roleNames: RoleName[] };

/** Pure authorization check given a resolved member context. Admin bypasses all. */
export function can(ctx: PermissionContext, needed: PermissionInput): boolean {
  if (ctx.isAdmin) return true;
  return hasPermission(getPermissions(ctx.roleNames), needed);
}

export class ForbiddenError extends Error {
  constructor(public readonly permission: string) {
    super(`Forbidden: missing permission "${permission}"`);
    this.name = "ForbiddenError";
  }
}
