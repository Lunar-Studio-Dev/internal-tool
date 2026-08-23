import "server-only";

import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

const byName = { name: "asc" as const };

export async function listSourceCategories() {
  await requirePermission("business:read");
  return db.sourceCategory.findMany({
    where: { active: true },
    orderBy: byName,
    select: {
      id: true,
      name: true,
      allowsSubcategories: true,
    },
  });
}

export async function listAllSourceCategories() {
  await requirePermission("settings:manage");
  return db.sourceCategory.findMany({
    orderBy: byName,
    select: {
      id: true,
      name: true,
      allowsSubcategories: true,
      active: true,
      _count: { select: { businesses: true } },
    },
  });
}

export async function listSourceSubCategories(sourceCategoryId?: string) {
  await requirePermission("business:read");
  return db.sourceSubCategory.findMany({
    where: {
      active: true,
      ...(sourceCategoryId ? { sourceCategoryId } : {}),
    },
    orderBy: byName,
    select: {
      id: true,
      name: true,
      sourceCategoryId: true,
      parentId: true,
    },
  });
}

export async function listAllSourceSubCategories(sourceCategoryId?: string) {
  await requirePermission("settings:manage");
  return db.sourceSubCategory.findMany({
    where: sourceCategoryId ? { sourceCategoryId } : undefined,
    orderBy: byName,
    select: {
      id: true,
      name: true,
      sourceCategoryId: true,
      parentId: true,
      active: true,
      sourceCategory: { select: { name: true } },
      _count: { select: { businesses: true } },
    },
  });
}

export async function listSectors() {
  await requirePermission("business:read");
  return db.sector.findMany({
    where: { active: true },
    orderBy: byName,
    select: { id: true, name: true },
  });
}

export async function listAllSectors() {
  await requirePermission("settings:manage");
  return db.sector.findMany({
    orderBy: byName,
    select: { id: true, name: true, active: true, _count: { select: { businesses: true } } },
  });
}

export async function listIndustries(sectorId?: string) {
  await requirePermission("business:read");
  return db.industry.findMany({
    where: {
      active: true,
      ...(sectorId ? { sectorId } : {}),
    },
    orderBy: byName,
    select: { id: true, name: true, sectorId: true },
  });
}

export async function listAllIndustries(sectorId?: string) {
  await requirePermission("settings:manage");
  return db.industry.findMany({
    where: sectorId ? { sectorId } : undefined,
    orderBy: byName,
    select: {
      id: true,
      name: true,
      sectorId: true,
      active: true,
      sector: { select: { name: true } },
      _count: { select: { businesses: true } },
    },
  });
}

export async function listMarkets() {
  await requirePermission("business:read");
  return db.market.findMany({
    where: { active: true },
    orderBy: byName,
    select: { id: true, name: true },
  });
}

export async function listAllMarkets() {
  await requirePermission("settings:manage");
  return db.market.findMany({
    orderBy: byName,
    select: { id: true, name: true, active: true, _count: { select: { businesses: true } } },
  });
}

export async function listLocations() {
  await requirePermission("business:read");
  return db.location.findMany({
    where: { active: true },
    orderBy: byName,
    select: { id: true, name: true },
  });
}

export async function listAllLocations() {
  await requirePermission("settings:manage");
  return db.location.findMany({
    orderBy: byName,
    select: {
      id: true,
      name: true,
      active: true,
      _count: { select: { businesses: true } },
    },
  });
}

export async function listTags() {
  await requirePermission("business:read");
  return db.tag.findMany({
    where: { active: true },
    orderBy: byName,
    select: { id: true, name: true },
  });
}

export async function listAllTags() {
  await requirePermission("settings:manage");
  return db.tag.findMany({
    orderBy: byName,
    select: {
      id: true,
      name: true,
      active: true,
      _count: { select: { businesses: true } },
    },
  });
}

export type TaxonomyItem = { id: string; name: string };

export type TaxonomyAdminData = {
  sourceCategories: Awaited<ReturnType<typeof listAllSourceCategories>>;
  sourceSubCategories: Awaited<ReturnType<typeof listAllSourceSubCategories>>;
  sectors: Awaited<ReturnType<typeof listAllSectors>>;
  industries: Awaited<ReturnType<typeof listAllIndustries>>;
  markets: Awaited<ReturnType<typeof listAllMarkets>>;
  locations: Awaited<ReturnType<typeof listAllLocations>>;
  tags: Awaited<ReturnType<typeof listAllTags>>;
};

export async function getTaxonomyAdminData(): Promise<TaxonomyAdminData> {
  const [
    sourceCategories,
    sourceSubCategories,
    sectors,
    industries,
    markets,
    locations,
    tags,
  ] = await Promise.all([
    listAllSourceCategories(),
    listAllSourceSubCategories(),
    listAllSectors(),
    listAllIndustries(),
    listAllMarkets(),
    listAllLocations(),
    listAllTags(),
  ]);
  return {
    sourceCategories,
    sourceSubCategories,
    sectors,
    industries,
    markets,
    locations,
    tags,
  };
}
