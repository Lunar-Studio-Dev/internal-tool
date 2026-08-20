import "server-only";

import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

/** True when all R2 credentials are present. When false, uploads are disabled. */
export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
  );
}

let client: S3Client | null = null;
function getClient(): S3Client | null {
  if (!isR2Configured()) return null;
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

/** Deterministic, collision-resistant object key scoped by pipeline/business. */
export function buildObjectKey(
  filename: string,
  scope?: { businessId?: string | null; pipelineId?: string | null },
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
  const prefix = scope?.pipelineId
    ? `pipelines/${scope.pipelineId}`
    : scope?.businessId
      ? `businesses/${scope.businessId}`
      : "general";
  return `resources/${prefix}/${randomUUID()}-${safe}`;
}

/** Short-lived (60s) presigned PUT URL for direct browser upload. */
export async function presignUpload(key: string, contentType: string): Promise<string | null> {
  const s3 = getClient();
  if (!s3) return null;
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: env.R2_BUCKET!, Key: key, ContentType: contentType }),
    { expiresIn: 60 },
  );
}

/** Short-lived (5min) presigned GET URL for download/preview. */
export async function presignDownload(key: string): Promise<string | null> {
  const s3 = getClient();
  if (!s3) return null;
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }), {
    expiresIn: 300,
  });
}

export type StoredObject = {
  body: ReadableStream;
  contentType?: string;
  contentLength?: number;
};

/** Stream an object from R2 for authenticated preview/download. */
export async function getObject(key: string): Promise<StoredObject | null> {
  const s3 = getClient();
  if (!s3) return null;
  const result = await s3.send(new GetObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }));
  if (!result.Body) return null;
  return {
    body: result.Body.transformToWebStream(),
    contentType: result.ContentType,
    contentLength: result.ContentLength,
  };
}

export async function deleteObject(key: string): Promise<void> {
  const s3 = getClient();
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }));
}

/** Public URL when a public base is configured (else null → use presignDownload). */
export function publicUrl(key: string): string | null {
  if (!env.R2_PUBLIC_BASE_URL) return null;
  return `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
}
