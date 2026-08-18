import { NextResponse } from "next/server";
import { z } from "zod";

import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES } from "@/features/resources/constants";
import { currentMemberCan } from "@/lib/auth/member";
import { buildObjectKey, isR2Configured, presignUpload } from "@/lib/r2";

const bodySchema = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(200),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, "File too large (max 25MB)."),
  businessId: z.string().optional().nullable(),
  pipelineId: z.string().optional().nullable(),
});

/**
 * Issues a short-lived presigned PUT URL so the browser can upload directly to
 * R2. Requires `resource:write`; R2 credentials never reach the client.
 */
export async function POST(request: Request) {
  if (!(await currentMemberCan("resource:write"))) {
    return NextResponse.json({ error: "You don't have permission to upload files." }, { status: 403 });
  }
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "File storage is not configured. Set the R2_* environment variables." },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { filename, contentType, size, businessId, pipelineId } = parsed.data;

  if (!ALLOWED_UPLOAD_MIME.includes(contentType)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 25MB)." }, { status: 400 });
  }

  const key = buildObjectKey(filename, { businessId, pipelineId });
  const url = await presignUpload(key, contentType);
  if (!url) {
    return NextResponse.json({ error: "File storage is not configured." }, { status: 503 });
  }

  return NextResponse.json({ key, url });
}
