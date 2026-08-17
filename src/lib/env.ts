import "server-only";
import { z } from "zod";

/**
 * Server-side environment. Import this in server code only.
 * Public (NEXT_PUBLIC_*) values are inlined by Next and may also be read directly.
 */
const schema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_APP_URL: z.string().min(1).default("http://localhost:3000"),

  // Neon Auth = Managed Better Auth (optional until enabled in the Neon console — see PHASE_2).
  // Values come from Neon Console → Auth → Configuration.
  NEON_AUTH_BASE_URL: z.string().min(1).optional(),
  NEON_AUTH_COOKIE_SECRET: z
    .string()
    .min(32, "NEON_AUTH_COOKIE_SECRET must be at least 32 characters")
    .optional(),

  // Transactional email (Resend). Optional: when unset, member-invite emails are
  // skipped and the admin is warned to share the temporary password manually.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(1).default("Lunar Studio <onboarding@resend.dev>"),

  // Cloudflare R2 (PHASE_6)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),

  // Vercel AI Gateway (PHASE_7)
  AI_GATEWAY_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "\u274c Invalid environment variables:\n",
    JSON.stringify(parsed.error.issues, null, 2),
  );
  throw new Error("Invalid environment variables. See logs above.");
}

export const env = parsed.data;
