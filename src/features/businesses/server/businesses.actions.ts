import "server-only";

import { SOURCE_CATEGORY_NAMES } from "@/features/businesses/constants";
import {
  createBusinessSchema,
  updateBusinessSchema,
  type SocialLinks,
} from "@/features/businesses/schemas/business.schema";
import {
  createContactSchema,
  updateContactSchema,
} from "@/features/businesses/schemas/contact.schema";
import { findPossibleDuplicates } from "@/features/businesses/server/duplicates";
import type { DuplicateCandidate } from "@/features/businesses/types";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/utils";

export type ActionResult = { ok: true; warning?: string } | { ok: false; error: string };

/** Create can succeed, fail, or surface duplicate candidates for the WF-09 step. */
export type CreateBusinessResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | { ok: false; duplicates: DuplicateCandidate[] };

function cleanSocial(social?: SocialLinks): Record<string, string> | null {
  if (!social) return null;
  const entries = Object.entries(social)
    .map(([key, value]) => [key, (value ?? "").trim()] as const)
    .filter(([, value]) => value.length > 0);
  return entries.length ? Object.fromEntries(entries) : null;
}

async function validateSourceOnServer(data: {
  sourceCategoryId: string;
  sourceSubCategoryId?: string;
  sourceReferredByBusinessId?: string;
  sourceReferenceLabel?: string;
}): Promise<{ ok: true; categoryName: string } | { ok: false; error: string }> {
  const category = await db.sourceCategory.findUnique({
    where: { id: data.sourceCategoryId },
    select: { name: true },
  });
  if (!category) return { ok: false, error: "Invalid source category." };

  if (category.name === SOURCE_CATEGORY_NAMES.CLUB) {
    if (!data.sourceSubCategoryId) {
      return { ok: false, error: "Select a club or sub-club." };
    }
    const sub = await db.sourceSubCategory.findFirst({
      where: { id: data.sourceSubCategoryId, sourceCategoryId: data.sourceCategoryId },
    });
    if (!sub) return { ok: false, error: "Invalid club selection." };
  } else if (data.sourceSubCategoryId) {
    return { ok: false, error: "Sub-category applies to Club source only." };
  }

  if (category.name === SOURCE_CATEGORY_NAMES.EXISTING_CLIENT) {
    if (!data.sourceReferredByBusinessId) {
      return { ok: false, error: "Select the referring client." };
    }
  }

  if (category.name === SOURCE_CATEGORY_NAMES.EXTERNAL) {
    if (!data.sourceReferenceLabel?.trim()) {
      return { ok: false, error: "Enter a reference label." };
    }
  }

  return { ok: true, categoryName: category.name };
}

async function denormalizedProfileText(data: {
  industryId?: string;
  locationIds?: string[];
}) {
  const [industry, locations] = await Promise.all([
    data.industryId
      ? db.industry.findUnique({ where: { id: data.industryId }, select: { name: true } })
      : null,
    data.locationIds?.length
      ? db.location.findMany({
          where: { id: { in: data.locationIds } },
          select: { name: true },
          orderBy: { name: "asc" },
        })
      : [],
  ]);
  return {
    industry: industry?.name ?? null,
    location: locations[0]?.name ?? null,
  };
}

function businessWriteData(
  data: {
    name: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    social?: SocialLinks;
    notes?: string;
    sourceCategoryId?: string;
    sourceSubCategoryId?: string;
    sourceReferredByBusinessId?: string;
    sourceReferenceLabel?: string;
    sourceReferenceNote?: string;
    sectorId?: string;
    industryId?: string;
    marketId?: string;
  },
  denormalized: { industry: string | null; location: string | null },
) {
  return {
    name: data.name,
    website: emptyToNull(data.website),
    email: emptyToNull(data.email),
    phone: emptyToNull(data.phone),
    industry: denormalized.industry,
    location: denormalized.location,
    address: emptyToNull(data.address),
    social: cleanSocial(data.social) ?? undefined,
    notes: emptyToNull(data.notes),
    ...(data.sourceCategoryId
      ? {
          sourceCategoryId: data.sourceCategoryId,
          sourceSubCategoryId: emptyToNull(data.sourceSubCategoryId),
          sourceReferredByBusinessId: emptyToNull(data.sourceReferredByBusinessId),
          sourceReferenceLabel: emptyToNull(data.sourceReferenceLabel),
          sourceReferenceNote: emptyToNull(data.sourceReferenceNote),
        }
      : {}),
    sectorId: emptyToNull(data.sectorId),
    industryId: emptyToNull(data.industryId),
    marketId: emptyToNull(data.marketId),
  };
}

export async function createBusinessAction(input: unknown): Promise<CreateBusinessResult> {
  const member = await requirePermission("business:write");

  const parsed = createBusinessSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const sourceCheck = await validateSourceOnServer(data);
  if (!sourceCheck.ok) return sourceCheck;

  if (data.force) {
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

  const denormalized = await denormalizedProfileText(data);

  try {
    const business = await db.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          ...businessWriteData(data, denormalized),
          createdById: member.id,
          businessLocations: data.locationIds.length
            ? {
                create: data.locationIds.map((locationId) => ({ locationId })),
              }
            : undefined,
          businessTags: data.tagIds.length
            ? {
                create: data.tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
        },
      });
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
      metadata: {
        name: business.name,
        sourceCategoryId: data.sourceCategoryId,
        sectorId: data.sectorId,
        industryId: data.industryId,
        marketId: data.marketId,
        locationIds: data.locationIds,
        tagIds: data.tagIds,
      },
    });
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

  if (data.sourceCategoryId) {
    const sourceCheck = await validateSourceOnServer({
      sourceCategoryId: data.sourceCategoryId,
      sourceSubCategoryId: data.sourceSubCategoryId,
      sourceReferredByBusinessId: data.sourceReferredByBusinessId,
      sourceReferenceLabel: data.sourceReferenceLabel,
    });
    if (!sourceCheck.ok) return sourceCheck;
  }

  const denormalized = await denormalizedProfileText(data);

  try {
    await db.$transaction(async (tx) => {
      await tx.businessLocation.deleteMany({ where: { businessId: data.id } });
      await tx.businessTag.deleteMany({ where: { businessId: data.id } });
      await tx.business.update({
        where: { id: data.id },
        data: {
          ...businessWriteData(data, denormalized),
          businessLocations: data.locationIds.length
            ? { create: data.locationIds.map((locationId) => ({ locationId })) }
            : undefined,
          businessTags: data.tagIds.length
            ? { create: data.tagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
      });
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
  return { ok: true };
}
