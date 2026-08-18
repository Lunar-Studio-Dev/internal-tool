"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type DragEvent, type ReactNode, useState } from "react";
import { Loader2Icon, UploadCloudIcon } from "lucide-react";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ALLOWED_UPLOAD_MIME,
  MAX_UPLOAD_BYTES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ORDER,
  humanFileSize,
  inferResourceType,
} from "@/features/resources/constants";
import { createResourceAction } from "@/features/resources/server/resources.actions";
import type { ResourceOptions } from "@/features/resources/server/resources.queries";
import { PHASE_LABELS, PHASE_ORDER } from "@/features/pipelines/constants";
import { PhaseType, ResourceType } from "@/generated/prisma/enums";

const NONE = "NONE";

export function UploadDialog({
  options,
  prefill,
  trigger,
}: {
  options: ResourceOptions;
  prefill?: { businessId?: string | null; pipelineId?: string | null; phaseType?: PhaseType | null };
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<ResourceType>(ResourceType.OTHER);
  const [businessId, setBusinessId] = useState(prefill?.businessId ?? "");
  const [pipelineId, setPipelineId] = useState(prefill?.pipelineId ?? "");
  const [phaseType, setPhaseType] = useState<"" | PhaseType>(prefill?.phaseType ?? "");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
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
        setError("Upload to storage failed.");
        return;
      }

      const result = await createResourceAction({
        name: name || file.name,
        type,
        objectKey: key,
        sizeBytes: file.size,
        contentType: file.type,
        businessId,
        pipelineId,
        phaseType,
        description,
      });
      if (result.ok) {
        toast.success("Resource uploaded");
        setOpen(false);
        setFile(null);
        setName("");
        setDescription("");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
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
            <input type="file" className="hidden" onChange={onFileInput} />
          </label>

          <div className="flex flex-col gap-2">
            <Label htmlFor="r-name">Name</Label>
            <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="r-type">Type</Label>
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
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="r-phase">Phase</Label>
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
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="r-business">Business</Label>
              <Select
                value={businessId || NONE}
                onValueChange={(v) => setBusinessId(v === NONE ? "" : v)}
              >
                <SelectTrigger id="r-business">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {options.businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="r-pipeline">Pipeline</Label>
              <Select
                value={pipelineId || NONE}
                onValueChange={(v) => setPipelineId(v === NONE ? "" : v)}
              >
                <SelectTrigger id="r-pipeline">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {options.pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="r-desc">Description</Label>
            <Textarea
              id="r-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
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
