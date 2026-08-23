"use client";

import { useState } from "react";
import { Loader2Icon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type TaxonomyAdminItem = {
  id: string;
  name: string;
  active: boolean;
  usageCount?: number;
  meta?: string;
};

export function TaxonomyAdminPanel({
  title,
  description,
  items,
  onAdd,
  onUpdate,
  onSetActive,
  addPending,
  pendingItemId,
  extraFields,
  hideAdd,
}: {
  title: string;
  description: string;
  items: TaxonomyAdminItem[];
  onAdd: (name: string) => Promise<{ ok: boolean }>;
  onUpdate: (id: string, name: string) => Promise<{ ok: boolean }>;
  onSetActive: (id: string, active: boolean) => Promise<{ ok: boolean }>;
  addPending?: boolean;
  /** Item currently being saved (toggle / rename). */
  pendingItemId?: string | null;
  extraFields?: (item: TaxonomyAdminItem) => React.ReactNode;
  hideAdd?: boolean;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [savePending, setSavePending] = useState(false);

  return (
    <Card>
      {title ? (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      ) : null}
      <CardContent className={`flex flex-col gap-4 ${title ? "" : "pt-6"}`}>
        {!hideAdd ? (
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await onAdd(newLabel);
              if (result.ok) setNewLabel("");
            }}
          >
            <Input
              placeholder="New label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Button type="submit" disabled={addPending || !newLabel.trim()}>
              {addPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <PlusIcon className="size-4" />
              )}
              Add
            </Button>
          </form>
        ) : null}
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const rowPending = pendingItemId === item.id || (savePending && editingId === item.id);
            return (
              <li
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 ${
                  rowPending ? "opacity-70" : ""
                }`}
              >
                {editingId === item.id ? (
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSavePending(true);
                      try {
                        const result = await onUpdate(item.id, editLabel);
                        if (result.ok) setEditingId(null);
                      } finally {
                        setSavePending(false);
                      }
                    }}
                  >
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      disabled={savePending}
                    />
                    <Button type="submit" size="sm" disabled={savePending}>
                      {savePending ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={savePending}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.usageCount != null ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Used {item.usageCount}×
                          </Badge>
                        ) : null}
                        {!item.active ? (
                          <Badge variant="outline" className="text-[10px]">
                            Disabled
                          </Badge>
                        ) : null}
                        {rowPending ? (
                          <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                        ) : null}
                      </div>
                      {item.meta ? (
                        <span className="text-xs text-muted-foreground">{item.meta}</span>
                      ) : null}
                      {extraFields?.(item)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={rowPending}
                        onClick={() => {
                          setEditingId(item.id);
                          setEditLabel(item.name);
                        }}
                      >
                        Edit
                      </Button>
                      <Switch
                        checked={item.active}
                        disabled={rowPending}
                        onCheckedChange={(checked) => onSetActive(item.id, checked)}
                      />
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
