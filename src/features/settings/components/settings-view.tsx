"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2Icon, PlusIcon } from "lucide-react";

import { FormErrorAlert } from "@/components/common/form-field";
import { QueryGate } from "@/components/common/query-gate";
import {
  SectionTabs,
  SectionTabsList,
  SectionTabsTrigger,
} from "@/components/common/section-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import {
  settingsQueries,
  useAddDeactivationReason,
  useSetDeactivationReasonEnabled,
  useUpdateDeactivationReason,
  useUpdateSettings,
} from "@/features/settings/api";
import { PHASE_LABELS, PHASE_ORDER } from "@/features/pipelines/constants";

export function SettingsView() {
  const [tab, setTab] = useState("general");
  const query = useQuery(settingsQueries.data());

  return (
    <SectionTabs value={tab} onValueChange={setTab}>
      <SectionTabsList>
        <SectionTabsTrigger value="general">General</SectionTabsTrigger>
        <SectionTabsTrigger value="pipeline">Pipeline phases</SectionTabsTrigger>
        <SectionTabsTrigger value="reasons">Deactivation reasons</SectionTabsTrigger>
        <SectionTabsTrigger value="team">Team & roles</SectionTabsTrigger>
      </SectionTabsList>

      <TabsContent value="general">
        <GeneralSettingsForm settings={query.data?.settings} loading={query.isPending} />
      </TabsContent>
      <TabsContent value="pipeline">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline phases</CardTitle>
            <CardDescription>Fixed phase order (read-only).</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2">
              {PHASE_ORDER.map((phase, i) => (
                <li key={phase} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  {PHASE_LABELS[phase]}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="reasons">
        <DeactivationReasonsAdmin reasons={query.data?.deactivationReasons ?? []} loading={query.isPending} />
      </TabsContent>
      <TabsContent value="team">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team & roles</CardTitle>
            <CardDescription>Manage members and view the roles matrix.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/team">Team members</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/team/roles">Roles matrix</Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </SectionTabs>
  );
}

function GeneralSettingsForm({
  settings,
  loading,
}: {
  settings?: {
    companyName: string;
    currency: string;
    dateFormat: string;
    timezone: string;
    staleDays: number;
  };
  loading: boolean;
}) {
  const update = useUpdateSettings();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (loading && !form) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  }

  const values = form ?? settings;
  if (!values) return null;

  const set = (key: keyof typeof values, value: string | number) =>
    setForm((prev) => ({ ...(prev ?? values), [key]: value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">General</CardTitle>
        <CardDescription>Workspace defaults for formatting and stale pipeline detection.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex max-w-lg flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await update.mutateAsync(values);
          }}
        >
          {update.data && !update.data.ok ? (
            <FormErrorAlert message={update.data.error} />
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={values.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currency">Currency (ISO 4217)</Label>
            <Input
              id="currency"
              value={values.currency}
              maxLength={3}
              onChange={(e) => set("currency", e.target.value.toUpperCase())}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dateFormat">Date format</Label>
            <Input
              id="dateFormat"
              value={values.dateFormat}
              onChange={(e) => set("dateFormat", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={values.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staleDays">Stale pipeline threshold (days)</Label>
            <Input
              id="staleDays"
              type="number"
              min={1}
              max={365}
              value={values.staleDays}
              onChange={(e) => set("staleDays", Number(e.target.value))}
            />
          </div>
          <Button type="submit" disabled={update.isPending} className="w-fit">
            {update.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
            Save settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeactivationReasonsAdmin({
  reasons,
  loading,
}: {
  reasons: Array<{ id: string; label: string; enabled: boolean; usageCount: number }>;
  loading: boolean;
}) {
  const addReason = useAddDeactivationReason();
  const updateReason = useUpdateDeactivationReason();
  const setEnabled = useSetDeactivationReasonEnabled();
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  return (
    <QueryGate isPending={loading} isError={false} error={null}>
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
                    <Button type="submit" size="sm">Save</Button>
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
                        <Badge variant="outline" className="text-[10px]">Disabled</Badge>
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
    </QueryGate>
  );
}
