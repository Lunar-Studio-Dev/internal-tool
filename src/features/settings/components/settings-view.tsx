"use client";

import { useQuery } from "@tanstack/react-query";

import { QueryGate } from "@/components/common/query-gate";
import {
  SectionTabs,
  SectionTabsList,
  SectionTabsTrigger,
} from "@/components/common/section-tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";

import {
  settingsQueries,
  useAddDeactivationReason,
  useCreateIndustry,
  useCreateLocation,
  useCreateMarket,
  useCreateSector,
  useCreateSourceCategory,
  useCreateSourceSubCategory,
  useCreateTag,
  useSetDeactivationReasonEnabled,
  useSetIndustryActive,
  useSetLocationActive,
  useSetMarketActive,
  useSetSectorActive,
  useSetSourceCategoryActive,
  useSetSourceSubCategoryActive,
  useSetTagActive,
  useUpdateDeactivationReason,
  useUpdateIndustry,
  useUpdateLocation,
  useUpdateMarket,
  useUpdateSector,
  useUpdateSourceCategory,
  useUpdateSourceSubCategory,
  useUpdateTag,
} from "@/features/settings/api";
import { TaxonomyAdminPanel } from "@/features/settings/components/taxonomy-admin-panel";

export function SettingsView() {
  const [tab, setTab] = useState("sources");
  const query = useQuery(settingsQueries.data());

  return (
    <QueryGate isPending={query.isPending} isError={query.isError} error={query.error}>
      <SectionTabs value={tab} onValueChange={setTab}>
        <SectionTabsList>
          <SectionTabsTrigger value="sources">Sources</SectionTabsTrigger>
          <SectionTabsTrigger value="sectors">Sectors & industries</SectionTabsTrigger>
          <SectionTabsTrigger value="markets">Markets</SectionTabsTrigger>
          <SectionTabsTrigger value="locations">Locations</SectionTabsTrigger>
          <SectionTabsTrigger value="tags">Tags</SectionTabsTrigger>
          <SectionTabsTrigger value="reasons">Deactivation reasons</SectionTabsTrigger>
        </SectionTabsList>

        <TabsContent value="sources">
          <SourcesAdmin taxonomy={query.data?.taxonomy} />
        </TabsContent>
        <TabsContent value="sectors">
          <SectorsIndustriesAdmin taxonomy={query.data?.taxonomy} />
        </TabsContent>
        <TabsContent value="markets">
          <MarketsAdmin taxonomy={query.data?.taxonomy} />
        </TabsContent>
        <TabsContent value="locations">
          <LocationsAdmin taxonomy={query.data?.taxonomy} />
        </TabsContent>
        <TabsContent value="tags">
          <TagsAdmin taxonomy={query.data?.taxonomy} />
        </TabsContent>
        <TabsContent value="reasons">
          <DeactivationReasonsAdmin reasons={query.data?.deactivationReasons ?? []} />
        </TabsContent>
      </SectionTabs>
    </QueryGate>
  );
}

function SourcesAdmin({ taxonomy }: { taxonomy?: SettingsQueriesTaxonomy }) {
  const createCategory = useCreateSourceCategory();
  const updateCategory = useUpdateSourceCategory();
  const setCategoryActive = useSetSourceCategoryActive();
  const createSub = useCreateSourceSubCategory();
  const updateSub = useUpdateSourceSubCategory();
  const setSubActive = useSetSourceSubCategoryActive();

  const [subName, setSubName] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  const categories =
    taxonomy?.sourceCategories.map((c) => ({
      id: c.id,
      name: c.name,
      active: c.active,
      usageCount: c._count.businesses,
      meta: c.allowsSubcategories ? "Allows sub-categories" : undefined,
    })) ?? [];

  const subcategories =
    taxonomy?.sourceSubCategories.map((s) => ({
      id: s.id,
      name: s.name,
      active: s.active,
      usageCount: s._count.businesses,
      meta: s.sourceCategory.name,
    })) ?? [];

  const clubCategories = taxonomy?.sourceCategories.filter((c) => c.allowsSubcategories) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <TaxonomyAdminPanel
        title="Source categories"
        description="Top-level source types used in business onboarding."
        items={categories}
        addPending={createCategory.isPending}
        onAdd={async (name) => createCategory.mutateAsync({ name })}
        onUpdate={async (id, name) => updateCategory.mutateAsync({ id, name })}
        onSetActive={async (id, active) => setCategoryActive.mutateAsync({ id, active })}
        extraFields={(item) => {
          const row = taxonomy?.sourceCategories.find((c) => c.id === item.id);
          if (!row) return null;
          return (
            <div className="flex items-center gap-2 pt-1">
              <Switch
                id={`sub-${item.id}`}
                checked={row.allowsSubcategories}
                onCheckedChange={(checked) =>
                  updateCategory.mutate({ id: item.id, name: item.name, allowsSubcategories: checked })
                }
              />
              <Label htmlFor={`sub-${item.id}`} className="text-xs font-normal">
                Allow sub-categories
              </Label>
            </div>
          );
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source sub-categories / clubs</CardTitle>
          <CardDescription>Nested labels under categories that allow sub-categories.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await createSub.mutateAsync({
                name: subName,
                sourceCategoryId: subCategoryId,
              });
              if (result.ok) {
                setSubName("");
              }
            }}
          >
            <Select value={subCategoryId} onValueChange={setSubCategoryId}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {clubCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Sub-category name"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
            />
            <Button
              type="submit"
              disabled={createSub.isPending || !subName.trim() || !subCategoryId}
              className="sm:w-auto"
            >
              {createSub.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
              Add
            </Button>
          </form>
          <TaxonomyAdminPanel
            title=""
            description=""
            hideAdd
            items={subcategories}
            onAdd={async () => ({ ok: false })}
            onUpdate={async (id, name) => updateSub.mutateAsync({ id, name })}
            onSetActive={async (id, active) => setSubActive.mutateAsync({ id, active })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

type SettingsQueriesTaxonomy = {
  sourceCategories: Array<{
    id: string;
    name: string;
    allowsSubcategories: boolean;
    active: boolean;
    _count: { businesses: number };
  }>;
  sourceSubCategories: Array<{
    id: string;
    name: string;
    active: boolean;
    sourceCategory: { name: string };
    _count: { businesses: number };
  }>;
  sectors: Array<{ id: string; name: string; active: boolean; _count: { businesses: number } }>;
  industries: Array<{
    id: string;
    name: string;
    active: boolean;
    sectorId: string | null;
    sector: { name: string } | null;
    _count: { businesses: number };
  }>;
  markets: Array<{ id: string; name: string; active: boolean; _count: { businesses: number } }>;
  locations: Array<{ id: string; name: string; active: boolean; _count: { businesses: number } }>;
  tags: Array<{ id: string; name: string; active: boolean; _count: { businesses: number } }>;
};

function SectorsIndustriesAdmin({ taxonomy }: { taxonomy?: SettingsQueriesTaxonomy }) {
  const createSector = useCreateSector();
  const updateSector = useUpdateSector();
  const setSectorActive = useSetSectorActive();
  const createIndustry = useCreateIndustry();
  const updateIndustry = useUpdateIndustry();
  const setIndustryActive = useSetIndustryActive();

  const [industryName, setIndustryName] = useState("");
  const [industrySectorId, setIndustrySectorId] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <TaxonomyAdminPanel
        title="Sectors"
        description="High-level industry groupings."
        items={
          taxonomy?.sectors.map((s) => ({
            id: s.id,
            name: s.name,
            active: s.active,
            usageCount: s._count.businesses,
          })) ?? []
        }
        addPending={createSector.isPending}
        onAdd={async (name) => createSector.mutateAsync({ name })}
        onUpdate={async (id, name) => updateSector.mutateAsync({ id, name })}
        onSetActive={async (id, active) => setSectorActive.mutateAsync({ id, active })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Industries</CardTitle>
          <CardDescription>Industry labels, optionally linked to a sector.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await createIndustry.mutateAsync({
                name: industryName,
                sectorId: industrySectorId || "",
              });
              if (result.ok) setIndustryName("");
            }}
          >
            <Select value={industrySectorId} onValueChange={setIndustrySectorId}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Sector (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No sector</SelectItem>
                {(taxonomy?.sectors.filter((s) => s.active) ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Industry name"
              value={industryName}
              onChange={(e) => setIndustryName(e.target.value)}
            />
            <Button type="submit" disabled={createIndustry.isPending || !industryName.trim()}>
              <PlusIcon className="size-4" />
              Add
            </Button>
          </form>
          <TaxonomyAdminPanel
            title=""
            description=""
            hideAdd
            items={
              taxonomy?.industries.map((i) => ({
                id: i.id,
                name: i.name,
                active: i.active,
                usageCount: i._count.businesses,
                meta: i.sector?.name ? `Sector: ${i.sector.name}` : undefined,
              })) ?? []
            }
            onAdd={async () => ({ ok: false })}
            onUpdate={async (id, name) => {
              const row = taxonomy?.industries.find((i) => i.id === id);
              return updateIndustry.mutateAsync({
                id,
                name,
                sectorId: row?.sectorId ?? "",
              });
            }}
            onSetActive={async (id, active) => setIndustryActive.mutateAsync({ id, active })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MarketsAdmin({ taxonomy }: { taxonomy?: SettingsQueriesTaxonomy }) {
  const create = useCreateMarket();
  const update = useUpdateMarket();
  const setActive = useSetMarketActive();
  return (
    <TaxonomyAdminPanel
      title="Markets"
      description="B2B, B2C, and other market segments."
      items={
        taxonomy?.markets.map((m) => ({
          id: m.id,
          name: m.name,
          active: m.active,
          usageCount: m._count.businesses,
        })) ?? []
      }
      addPending={create.isPending}
      onAdd={async (name) => create.mutateAsync({ name })}
      onUpdate={async (id, name) => update.mutateAsync({ id, name })}
      onSetActive={async (id, active) => setActive.mutateAsync({ id, active })}
    />
  );
}

function LocationsAdmin({ taxonomy }: { taxonomy?: SettingsQueriesTaxonomy }) {
  const create = useCreateLocation();
  const update = useUpdateLocation();
  const setActive = useSetLocationActive();
  return (
    <TaxonomyAdminPanel
      title="Locations"
      description="Geographic labels attached to businesses."
      items={
        taxonomy?.locations.map((l) => ({
          id: l.id,
          name: l.name,
          active: l.active,
          usageCount: l._count.businesses,
        })) ?? []
      }
      addPending={create.isPending}
      onAdd={async (name) => create.mutateAsync({ name })}
      onUpdate={async (id, name) => update.mutateAsync({ id, name })}
      onSetActive={async (id, active) => setActive.mutateAsync({ id, active })}
    />
  );
}

function TagsAdmin({ taxonomy }: { taxonomy?: SettingsQueriesTaxonomy }) {
  const create = useCreateTag();
  const update = useUpdateTag();
  const setActive = useSetTagActive();
  return (
    <TaxonomyAdminPanel
      title="Tags"
      description="Flexible labels for business profiles."
      items={
        taxonomy?.tags.map((t) => ({
          id: t.id,
          name: t.name,
          active: t.active,
          usageCount: t._count.businesses,
        })) ?? []
      }
      addPending={create.isPending}
      onAdd={async (name) => create.mutateAsync({ name })}
      onUpdate={async (id, name) => update.mutateAsync({ id, name })}
      onSetActive={async (id, active) => setActive.mutateAsync({ id, active })}
    />
  );
}

function DeactivationReasonsAdmin({
  reasons,
}: {
  reasons: Array<{ id: string; label: string; enabled: boolean; usageCount: number }>;
}) {
  const addReason = useAddDeactivationReason();
  const updateReason = useUpdateDeactivationReason();
  const setEnabled = useSetDeactivationReasonEnabled();
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deactivation reasons</CardTitle>
        <CardDescription>Manage reasons shown when closing a pipeline.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await addReason.mutateAsync({ label: newLabel });
            if (result.ok) setNewLabel("");
          }}
        >
          <Input
            placeholder="New reason label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <Button type="submit" disabled={addReason.isPending || !newLabel.trim()}>
            <PlusIcon className="size-4" />
            Add
          </Button>
        </form>
        <ul className="flex flex-col gap-2">
          {reasons.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              {editingId === r.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const result = await updateReason.mutateAsync({ id: r.id, label: editLabel });
                    if (result.ok) setEditingId(null);
                  }}
                >
                  <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.label}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      Used {r.usageCount}×
                    </Badge>
                    {!r.enabled ? (
                      <Badge variant="outline" className="text-[10px]">
                        Disabled
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(r.id);
                        setEditLabel(r.label);
                      }}
                    >
                      Edit
                    </Button>
                    <Switch
                      checked={r.enabled}
                      onCheckedChange={(checked) =>
                        setEnabled.mutate({ id: r.id, enabled: checked })
                      }
                    />
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
