import { NextResponse } from "next/server";

import { ForbiddenError } from "@/lib/rbac";

export type ServiceOk = { ok: true; warning?: string; id?: string };
export type ServiceErr = { ok: false; error: string; duplicates?: unknown };
export type RouteContext = { params: Promise<{ id: string }> };

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function jsonDuplicates(duplicates: unknown) {
  return NextResponse.json({ error: "Possible duplicates found.", duplicates }, { status: 409 });
}

export function fromService(
  result: { ok: true; warning?: string; id?: string } | { ok: false; error?: string; duplicates?: unknown },
  created = false,
) {
  if (!result.ok) {
    if ("duplicates" in result && result.duplicates) return jsonDuplicates(result.duplicates);
    return jsonError(result.error ?? "Request failed", 400);
  }
  return jsonData(
    { warning: result.warning, id: result.id },
    created || result.id ? 201 : 200,
  );
}

export async function readJson(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function handleApi(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const status = error.permission === "access" ? 401 : 403;
      return jsonError(error.message, status);
    }
    console.error(error);
    return jsonError("Internal server error", 500);
  }
}
