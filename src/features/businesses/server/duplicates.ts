import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/** Strip scheme/www and path, lowercase — "https://www.ABC.com/x" → "abc.com". */
export function normalizeHost(website?: string | null): string | null {
  const t = (website ?? "").trim().toLowerCase();
  if (!t) return null;
  const host = t
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0];
  return host || null;
}

/** Keep digits only; ignore too-short fragments to avoid noise. */
export function normalizePhone(phone?: string | null): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

export type DuplicateCandidate = {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  pipelineCount: number;
  activePipelineCount: number;
};

export type DuplicateQuery = {
  name: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
};

/**
 * Fuzzy, indexed duplicate search across name / website host / email / contact
 * email / phone digits. Case-insensitive. Used by the create flow (WF-09).
 */
export async function findPossibleDuplicates(
  input: DuplicateQuery,
): Promise<DuplicateCandidate[]> {
  const name = input.name.trim();
  const host = normalizeHost(input.website);
  const email = input.email?.trim().toLowerCase() || null;
  const contactEmail = input.contactEmail?.trim().toLowerCase() || null;
  const phone = normalizePhone(input.phone);

  const or: Prisma.BusinessWhereInput[] = [];
  if (name.length >= 2) or.push({ name: { contains: name, mode: "insensitive" } });
  if (host) or.push({ website: { contains: host, mode: "insensitive" } });
  if (email) or.push({ email: { equals: email, mode: "insensitive" } });
  if (phone) or.push({ phone: { contains: phone } });
  const emails = [email, contactEmail].filter((e): e is string => Boolean(e));
  if (emails.length) {
    or.push({ contacts: { some: { email: { in: emails, mode: "insensitive" } } } });
  }

  if (or.length === 0) return [];

  const businesses = await db.business.findMany({
    where: { OR: or },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      pipelines: { select: { status: true } },
    },
  });

  return businesses.map((b) => ({
    id: b.id,
    name: b.name,
    website: b.website,
    email: b.email,
    primaryContactName: b.contacts[0]?.name ?? null,
    primaryContactEmail: b.contacts[0]?.email ?? null,
    pipelineCount: b.pipelines.length,
    activePipelineCount: b.pipelines.filter((p) => p.status === "ACTIVE").length,
  }));
}
