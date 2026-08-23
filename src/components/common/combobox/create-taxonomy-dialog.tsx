"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Combobox } from "@/components/common/combobox/combobox";
import type { ComboboxOption } from "@/components/common/combobox/types";
import { FieldLabel } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreateTaxonomyDialog({
  open,
  title,
  initialName,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  initialName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="taxonomy-name" required>
            Name
          </FieldLabel>
          <Input
            id="taxonomy-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || !name.trim()}
            onClick={async () => {
              setPending(true);
              try {
                await onConfirm(name.trim());
                onOpenChange(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not create item.");
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? <Loader2Icon className="size-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreatableCombobox({
  options,
  value,
  onChange,
  onCreate,
  createDialogTitle,
  placeholder,
  disabled,
  id,
  className,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onCreate: (name: string) => Promise<{ id: string; name: string }>;
  createDialogTitle: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  const mergedOptions = useMemo(() => options, [options]);

  return (
    <>
      <Combobox
        id={id}
        className={className}
        options={mergedOptions}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onCreateNew={(term) => {
          setCreateName(term);
          setCreateOpen(true);
        }}
      />
      <CreateTaxonomyDialog
        open={createOpen}
        title={createDialogTitle}
        initialName={createName}
        onOpenChange={setCreateOpen}
        onConfirm={async (name) => {
          const created = await onCreate(name);
          onChange(created.id);
          toast.success(`Created ${created.name}`);
        }}
      />
    </>
  );
}
