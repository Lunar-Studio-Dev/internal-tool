import "server-only";

import { db } from "@/lib/db";

async function nameMap(
  ids: Array<string | null | undefined>,
  load: (unique: string[]) => Promise<Array<{ id: string; name: string }>>,
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  if (unique.length === 0) return new Map();
  const rows = await load(unique);
  return new Map(rows.map((row) => [row.id, row.name]));
}

export function memberNameMap(ids: Array<string | null | undefined>) {
  return nameMap(ids, (unique) =>
    db.teamMember.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } }),
  );
}

export function businessNameMap(ids: Array<string | null | undefined>) {
  return nameMap(ids, (unique) =>
    db.business.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } }),
  );
}

export async function pipelineCodeMap(ids: Array<string | null | undefined>) {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  if (unique.length === 0) return new Map<string, string>();
  const rows = await db.pipeline.findMany({
    where: { id: { in: unique } },
    select: { id: true, code: true },
  });
  return new Map(rows.map((row) => [row.id, row.code]));
}
