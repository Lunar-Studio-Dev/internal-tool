"use server";

import { revalidatePath } from "next/cache";

import {
  setTaxonomyActiveSchema,
  updateIndustrySchema,
  updateNamedTaxonomySchema,
  updateSourceCategorySchema,
  updateSourceSubCategorySchema,
} from "@/features/taxonomy/schemas/taxonomy.schema";
import {
  createIndustryAction,
  createLocationAction,
  createMarketAction,
  createSectorAction,
  createSourceCategoryAction,
  createSourceSubCategoryAction,
  createTagAction,
} from "@/features/taxonomy/server/taxonomy.actions";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { friendlyDbError } from "@/lib/db-errors";
import { emptyToNull } from "@/lib/utils";

export type TaxonomyAdminActionResult = { ok: true } | { ok: false; error: string };

async function mutateNamed(
  label: string,
  mutate: () => Promise<unknown>,
): Promise<TaxonomyAdminActionResult> {
  try {
    await mutate();
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyDbError(error, `Could not update ${label}.`) };
  }
}

export async function createSourceCategoryAdminAction(
  input: unknown,
): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const result = await createSourceCategoryAction(input);
  if (result.ok) revalidatePath("/settings");
  return result.ok ? { ok: true } : result;
}

export async function updateSourceCategoryAction(
  input: unknown,
): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = updateSourceCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, name, allowsSubcategories } = parsed.data;
  return mutateNamed("source category", () =>
    db.sourceCategory.update({
      where: { id },
      data: {
        name,
        ...(allowsSubcategories !== undefined ? { allowsSubcategories } : {}),
      },
    }),
  );
}

export async function setSourceCategoryActiveAction(
  input: unknown,
): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = setTaxonomyActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  return mutateNamed("source category", () =>
    db.sourceCategory.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } }),
  );
}

export async function createSourceSubCategoryAdminAction(
  input: unknown,
): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const result = await createSourceSubCategoryAction(input);
  if (result.ok) revalidatePath("/settings");
  return result.ok ? { ok: true } : result;
}

export async function updateSourceSubCategoryAction(
  input: unknown,
): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = updateSourceSubCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, name, sourceCategoryId, parentId } = parsed.data;
  return mutateNamed("sub-category", () =>
    db.sourceSubCategory.update({
      where: { id },
      data: {
        name,
        ...(sourceCategoryId ? { sourceCategoryId } : {}),
        ...(parentId !== undefined ? { parentId: emptyToNull(parentId ?? "") } : {}),
      },
    }),
  );
}

export async function setSourceSubCategoryActiveAction(
  input: unknown,
): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = setTaxonomyActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  return mutateNamed("sub-category", () =>
    db.sourceSubCategory.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } }),
  );
}

export async function createSectorAdminAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const result = await createSectorAction(input);
  if (result.ok) revalidatePath("/settings");
  return result.ok ? { ok: true } : result;
}

export async function updateSectorAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = updateNamedTaxonomySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return mutateNamed("sector", () =>
    db.sector.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name } }),
  );
}

export async function setSectorActiveAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = setTaxonomyActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  return mutateNamed("sector", () =>
    db.sector.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } }),
  );
}

export async function createIndustryAdminAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const result = await createIndustryAction(input);
  if (result.ok) revalidatePath("/settings");
  return result.ok ? { ok: true } : result;
}

export async function updateIndustryAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = updateIndustrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return mutateNamed("industry", () =>
    db.industry.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        sectorId: emptyToNull(parsed.data.sectorId),
      },
    }),
  );
}

export async function setIndustryActiveAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = setTaxonomyActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  return mutateNamed("industry", () =>
    db.industry.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } }),
  );
}

export async function createMarketAdminAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const result = await createMarketAction(input);
  if (result.ok) revalidatePath("/settings");
  return result.ok ? { ok: true } : result;
}

export async function updateMarketAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = updateNamedTaxonomySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return mutateNamed("market", () =>
    db.market.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name } }),
  );
}

export async function setMarketActiveAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = setTaxonomyActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  return mutateNamed("market", () =>
    db.market.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } }),
  );
}

export async function createLocationAdminAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const result = await createLocationAction(input);
  if (result.ok) revalidatePath("/settings");
  return result.ok ? { ok: true } : result;
}

export async function updateLocationAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = updateNamedTaxonomySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return mutateNamed("location", () =>
    db.location.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name } }),
  );
}

export async function setLocationActiveAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = setTaxonomyActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  return mutateNamed("location", () =>
    db.location.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } }),
  );
}

export async function createTagAdminAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const result = await createTagAction(input);
  if (result.ok) revalidatePath("/settings");
  return result.ok ? { ok: true } : result;
}

export async function updateTagAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = updateNamedTaxonomySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return mutateNamed("tag", () =>
    db.tag.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name } }),
  );
}

export async function setTagActiveAction(input: unknown): Promise<TaxonomyAdminActionResult> {
  await requirePermission("settings:manage");
  const parsed = setTaxonomyActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  return mutateNamed("tag", () =>
    db.tag.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } }),
  );
}
