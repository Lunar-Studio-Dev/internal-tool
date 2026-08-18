"use server";

import { revalidatePath } from "next/cache";

import {
  createBusinessSchema,
  updateBusinessSchema,
  type SocialLinks,
} from "@/features/businesses/schemas/business.schema";
import {
  createContactSchema,
  updateContactSchema,
} from "@/features/businesses/schemas/contact.schema";
import {
  findPossibleDuplicates,
  type DuplicateCandidate,
} from "@/features/businesses/server/duplicates";
import { Prisma } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

export type ActionResult = { ok: true; warning?: string } | { ok: false; error: string };

/** Create can succeed, fail, or surface duplicate candidates for the WF-09 step. */
export type CreateBusinessResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | { ok: false; duplicates: DuplicateCandidate[] };

function emptyToNull(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

/** Drop empty social entries; return null when nothing remains. */
function cleanSocial(social?: SocialLinks): Record<string, string> | null {
  if (!social) return null;
  const entries = Object.entries(social)
    .map(([key, value]) => [key, (value ?? "").trim()] as const)
    .filter(([, value]) => value.length > 0);
  return entries.length ? Object.fromEntries(entries) : null;
}

export async function createBusinessAction(input: unknown): Promise<CreateBusinessResult> {
  const member = await requirePermission("business:write");

  const parsed = createBusinessSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  if (data.force) {
    // Only admins may bypass the duplicate guard (requirement #3).
    if (!member.isAdmin) {
      return { ok: false, error: "Only an admin can create a business despite duplicates." };
    }
  } else {
    const duplicates = await findPossibleDuplicates({
      name: data.name,
      website: data.website,
      email: data.email,
      phone: data.phone,
      contactEmail: data.contact.email,
    });
    if (duplicates.length > 0) return { ok: false, duplicates };
  }

  try {
    const business = await db.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          name: data.name,
          website: emptyToNull(data.website),
          email: emptyToNull(data.email),
          phone: emptyToNull(data.phone),
          industry: emptyToNull(data.industry),
          location: emptyToNull(data.location),
          address: emptyToNull(data.address),
          social: cleanSocial(data.social) ?? undefined,
          notes: emptyToNull(data.notes),
          createdById: member.id,
        },
      });
      // The creation form always captures a primary contact (WF-08).
      await tx.contact.create({
        data: {
          businessId: created.id,
          name: data.contact.name,
          email: data.contact.email.toLowerCase(),
          phone: emptyToNull(data.contact.phone),
          isPrimary: true,
        },
      });
      return created;
    });

    await logActivity({
      actorId: member.id,
      action: "business.created",
      entityType: "Business",
      entityId: business.id,
      businessId: business.id,
      metadata: { name: business.name },
    });

    revalidatePath("/businesses");
    return { ok: true, id: business.id };
  } catch {
    return { ok: false, error: "Could not create the business." };
  }
}

export async function updateBusinessAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("business:write");

  const parsed = updateBusinessSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    // Only business-level info is edited here; contacts and any pipeline
    // snapshots (PHASE_5) are untouched — editing must not rewrite history.
    await db.business.update({
      where: { id: data.id },
      data: {
        name: data.name,
        website: emptyToNull(data.website),
        email: emptyToNull(data.email),
        phone: emptyToNull(data.phone),
        industry: emptyToNull(data.industry),
        location: emptyToNull(data.location),
        address: emptyToNull(data.address),
        social: cleanSocial(data.social) ?? Prisma.DbNull,
        notes: emptyToNull(data.notes),
      },
    });
  } catch {
    return { ok: false, error: "Could not update the business." };
  }

  await logActivity({
    actorId: member.id,
    action: "business.updated",
    entityType: "Business",
    entityId: data.id,
    businessId: data.id,
    metadata: { name: data.name },
  });

  revalidatePath("/businesses");
  revalidatePath(`/businesses/${data.id}`);
  return { ok: true };
}

export async function createContactAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("business:write");

  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { businessId, name, email, phone, role, isPrimary, notes } = parsed.data;

  try {
    const contact = await db.$transaction(async (tx) => {
      if (isPrimary) {
        // Preserve the single-primary invariant.
        await tx.contact.updateMany({
          where: { businessId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.contact.create({
        data: {
          businessId,
          name,
          email: email.toLowerCase(),
          phone: emptyToNull(phone),
          role,
          isPrimary,
          notes: emptyToNull(notes),
        },
      });
    });

    await logActivity({
      actorId: member.id,
      action: isPrimary ? "contact.created_primary" : "contact.created",
      entityType: "Contact",
      entityId: contact.id,
      businessId,
      metadata: { name, email },
    });

    revalidatePath(`/businesses/${businessId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not add the contact." };
  }
}

export async function updateContactAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("business:write");

  const parsed = updateContactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, businessId, name, email, phone, role, isPrimary, notes } = parsed.data;

  const existing = await db.contact.findUnique({ where: { id } });
  if (!existing || existing.businessId !== businessId) {
    return { ok: false, error: "Contact not found." };
  }
  // Keep exactly one primary: you promote a different contact rather than
  // leaving the business with none.
  if (existing.isPrimary && !isPrimary) {
    return { ok: false, error: "Set another contact as primary instead of unsetting this one." };
  }

  try {
    await db.$transaction(async (tx) => {
      if (isPrimary && !existing.isPrimary) {
        await tx.contact.updateMany({
          where: { businessId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      await tx.contact.update({
        where: { id },
        data: {
          name,
          email: email.toLowerCase(),
          phone: emptyToNull(phone),
          role,
          isPrimary,
          notes: emptyToNull(notes),
        },
      });
    });
  } catch {
    return { ok: false, error: "Could not update the contact." };
  }

  await logActivity({
    actorId: member.id,
    action: existing.isPrimary !== isPrimary ? "contact.primary_changed" : "contact.updated",
    entityType: "Contact",
    entityId: id,
    businessId,
    metadata: { name },
  });

  revalidatePath(`/businesses/${businessId}`);
  return { ok: true };
}

export async function setPrimaryContactAction(contactId: string): Promise<ActionResult> {
  const member = await requirePermission("business:write");

  const contact = await db.contact.findUnique({ where: { id: contactId } });
  if (!contact) return { ok: false, error: "Contact not found." };
  if (contact.isPrimary) return { ok: true };

  await db.$transaction([
    db.contact.updateMany({
      where: { businessId: contact.businessId, isPrimary: true },
      data: { isPrimary: false },
    }),
    db.contact.update({ where: { id: contactId }, data: { isPrimary: true } }),
  ]);

  await logActivity({
    actorId: member.id,
    action: "contact.primary_changed",
    entityType: "Contact",
    entityId: contactId,
    businessId: contact.businessId,
    metadata: { name: contact.name },
  });

  revalidatePath(`/businesses/${contact.businessId}`);
  return { ok: true };
}
