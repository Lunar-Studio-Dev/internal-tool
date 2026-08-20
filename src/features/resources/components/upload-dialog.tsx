"use client";

import { type ChangeEvent, type DragEvent, type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, UploadCloudIcon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resourceQueries, useCreateResource } from "@/features/resources/api";
import {
  ALLOWED_UPLOAD_MIME,
  MAX_UPLOAD_BYTES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ORDER,
  humanFileSize,
  inferResourceType,
} from "@/features/resources/constants";
import type { ResourceOptions } from "@/features/resources/server/resources.queries";
import { PHASE_LABELS, PHASE_ORDER } from "@/features/pipelines/constants";
import {
  createResourceSchema,
  resourceMetaSchema,
} from "@/features/resources/schemas/resource.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
import { PhaseType, ResourceType } from "@/generated/prisma/enums";

const NONE = "NONE";

export function UploadDialog({
  options,
  prefill,
  trigger,
}: {
  options?: ResourceOptions;
  prefill?: { businessId?: string | null; pipelineId?: string | null; phaseType?: PhaseType | null };
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const optionsQuery = useQuery({ ...resourceQueries.options(), enabled: open && !options });
  const resolved = options ?? optionsQuery.data;
  const createResource = useCreateResource();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<ResourceType>(ResourceType.OTHER);
  const [businessId, setBusinessId] = useState(prefill?.businessId ?? "");
  const [pipelineId, setPipelineId] = useState(prefill?.pipelineId ?? "");
  const [phaseType, setPhaseType] = useState<"" | PhaseType>(prefill?.phaseType ?? "");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  function pickFile(f: File | null) {
    setFile(f);
    if (f) {
      if (!name) setName(f.name);
      setType(inferResourceType(f.type, f.name));
    }
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] ?? null);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function upload() {
    setError(null);
    if (!file) return setError("Choose a file to upload.");
    if (!ALLOWED_UPLOAD_MIME.includes(file.type)) return setError("Unsupported file type.");
    if (file.size > MAX_UPLOAD_BYTES) return setError("File too large (max 25MB).");

    const meta = parseForm(resourceMetaSchema, {
      name: name || file.name,
      type,
      businessId,
      pipelineId,
      phaseType,
      description,
    });
    if (!meta.ok) {
      setErrors(meta.errors);
      return;
    }
    setErrors({});

    setBusy(true);
    try {
      const presign = await fetch("/api/r2", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          businessId: businessId || null,
          pipelineId: pipelineId || null,
        }),
      });
      if (!presign.ok) {
        const body = (await presign.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not start the upload.");
        return;
      }
      const { key, url } = (await presign.json()) as { key: string; url: string };

      const put = await fetch(url, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) {
        setError(
          put.status === 0 || put.type === "opaque"
            ? "Upload was blocked. Confirm the R2 bucket CORS allows this origin."
            : "Upload to storage failed.",
        );
        return;
      }

      const saved = parseForm(createResourceSchema, {
        ...meta.data,
        objectKey: key,
        sizeBytes: file.size,
        contentType: file.type,
      });
      if (!saved.ok) {
        setErrors(saved.errors);
        setError(saved.message);
        return;
      }

      await createResource.mutateAsync(saved.data);
      toast.success("Resource uploaded");
      setOpen(false);
      setFile(null);
      setName("");
      setDescription("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed.";
      setError(
        /failed to fetch|networkerror|cors/i.test(message)
          ? "Upload was blocked by the browser (usually R2 CORS). Confirm the bucket allows PUT from this origin."
          : mutationErrorMessage(e, message),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload resource</DialogTitle>
          <DialogDescription>The file is stored in Cloudflare R2; we keep the metadata.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <label
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground hover:bg-muted/40"
          >
            <UploadCloudIcon className="size-6" />
            {file ? (
              <span className="text-foreground">
                {file.name} · {humanFileSize(file.size)}
              </span>
            ) : (
              <span>Drag &amp; drop or click to choose a file</span>
            )}
            <input
              type="file"
              className="hidden"
              accept={ALLOWED_UPLOAD_MIME.join(",")}
              onChange={onFileInput}
            />
          </label>

          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="r-name" required>
              Name
            </FieldLabel>
            <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
            <FieldError error={errors.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="r-type" required>
                Type
              </FieldLabel>
              <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
                <SelectTrigger id="r-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPE_ORDER.map((t) => (
                    <SelectItem key={t} value={t}>
                      {RESOURCE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={errors.type} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="r-phase">Phase</FieldLabel>
              <Select
                value={phaseType || NONE}
                onValueChange={(v) => setPhaseType(v === NONE ? "" : (v as PhaseType))}
              >
                <SelectTrigger id="r-phase">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {PHASE_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PHASE_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={errors.phaseType} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="r-business">Business</FieldLabel>
              <Select
                value={businessId || NONE}
                onValueChange={(v) => setBusinessId(v === NONE ? "" : v)}
              >
                <SelectTrigger id="r-business">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {resolved?.businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={errors.businessId} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="r-pipeline">Pipeline</FieldLabel>
              <Select
                value={pipelineId || NONE}
                onValueChange={(v) => setPipelineId(v === NONE ? "" : v)}
              >
                <SelectTrigger id="r-pipeline">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {resolved?.pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={errors.pipelineId} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="r-desc">Description</FieldLabel>
            <Textarea
              id="r-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={1000}
            />
            <FieldError error={errors.description} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={upload} disabled={busy || !file}>
            {busy ? <Loader2Icon className="size-4 animate-spin" /> : null}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
