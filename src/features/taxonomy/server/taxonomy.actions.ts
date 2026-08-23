import "server-only";

import {
  createIndustrySchema,
  createNamedTaxonomySchema,
  createSourceSubCategorySchema,
} from "@/features/taxonomy/schemas/taxonomy.schema";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/utils";

export type TaxonomyCreateResult =
  | { ok: true; id: string; name: string }
  | { ok: false; error: string };

async function createUniqueNamed<T extends { id: string; name: string }>(
  label: string,
  create: () => Promise<T>,
): Promise<TaxonomyCreateResult> {
  try {
    const row = await create();
    return { ok: true, id: row.id, name: row.name };
  } catch {
    return { ok: false, error: `Could not create ${label}. It may already exist.` };
  }
}

export async function createSourceCategoryAction(input: unknown): Promise<TaxonomyCreateResult> {
  await requirePermission("business:write");
  const parsed = createNamedTaxonomySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return createUniqueNamed("source category", () =>
    db.sourceCategory.create({
      data: { name: parsed.data.name, allowsSubcategories: false },
      select: { id: true, name: true },
    }),
  );
}

export async function createSourceSubCategoryAction(input: unknown): Promise<TaxonomyCreateResult> {
  await requirePermission("business:write");
  const parsed = createSourceSubCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const category = await db.sourceCategory.findUnique({
    where: { id: parsed.data.sourceCategoryId },
    select: { allowsSubcategories: true },
  });
  if (!category?.allowsSubcategories) {
    return { ok: false, error: "This source category does not support sub-categories." };
  }
  return createUniqueNamed("club", () =>
    db.sourceSubCategory.create({
      data: {
        name: parsed.data.name,
        sourceCategoryId: parsed.data.sourceCategoryId,
        parentId: emptyToNull(parsed.data.parentId),
      },
      select: { id: true, name: true },
    }),
  );
}

export async function createSectorAction(input: unknown): Promise<TaxonomyCreateResult> {
  await requirePermission("business:write");
  const parsed = createNamedTaxonomySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return createUniqueNamed("sector", () =>
    db.sector.create({ data: { name: parsed.data.name }, select: { id: true, name: true } }),
  );
}

export async function createIndustryAction(input: unknown): Promise<TaxonomyCreateResult> {
  await requirePermission("business:write");
  const parsed = createIndustrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return createUniqueNamed("industry", () =>
    db.industry.create({
      data: {
        name: parsed.data.name,
        sectorId: emptyToNull(parsed.data.sectorId),
      },
      select: { id: true, name: true },
    }),
  );
}

export async function createMarketAction(input: unknown): Promise<TaxonomyCreateResult> {
  await requirePermission("business:write");
  const parsed = createNamedTaxonomySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return createUniqueNamed("market", () =>
    db.market.create({ data: { name: parsed.data.name }, select: { id: true, name: true } }),
  );
}

export async function createLocationAction(input: unknown): Promise<TaxonomyCreateResult> {
  await requirePermission("business:write");
  const parsed = createNamedTaxonomySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return createUniqueNamed("location", () =>
    db.location.create({ data: { name: parsed.data.name }, select: { id: true, name: true } }),
  );
}

export async function createTagAction(input: unknown): Promise<TaxonomyCreateResult> {
  await requirePermission("business:write");
  const parsed = createNamedTaxonomySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return createUniqueNamed("tag", () =>
    db.tag.create({ data: { name: parsed.data.name }, select: { id: true, name: true } }),
  );
}
