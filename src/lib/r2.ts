import "server-only";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

let client: S3Client | null = null;

/** Lazily construct the R2 (S3-compatible) client. Throws if R2 is not configured. */
export function getR2Client(): S3Client {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 is not configured. Set R2_* environment variables (see PHASE_6).");
  }
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

export function presignUpload(key: string, contentType: string, expiresIn = 60) {
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

export function presignDownload(key: string, expiresIn = 300) {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
    { expiresIn },
  );
}
