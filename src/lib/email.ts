import "server-only";

import { randomBytes } from "node:crypto";

import { Resend } from "resend";

import { env } from "@/lib/env";

export type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Generate a high-entropy temporary password for a newly provisioned member.
 *
 * 18 random bytes → 24 URL-safe base64 characters. Comfortably exceeds the
 * Better Auth default minimum length (8) and is not a guessable/leaked value.
 * The member is prompted to change it right after their first sign-in.
 */
export function generateTempPassword(): string {
  return randomBytes(18).toString("base64url");
}

/** True when a transactional email provider is configured. */
export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

export type MemberInviteEmail = {
  to: string;
  name: string;
  tempPassword: string;
  signInUrl: string;
};

/**
 * Email a new team member their temporary sign-in password.
 *
 * Returns `{ ok: false, error }` (never throws) so callers can surface a warning
 * without failing member creation. When email is not configured, the caller
 * should instead share the temporary password with the member out of band.
 */
export async function sendMemberInviteEmail(input: MemberInviteEmail): Promise<SendResult> {
  const resend = getClient();
  if (!resend) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY is missing)." };
  }

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: "Your Lunar Studio account is ready",
      html: renderInviteHtml(input),
      text: renderInviteText(input),
    });
    if (error) return { ok: false, error: errorMessage(error, "Email delivery failed.") };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Email delivery failed.") };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInviteText({ name, tempPassword, signInUrl, to }: MemberInviteEmail): string {
  return [
    `Hi ${name},`,
    "",
    "An account has been created for you on Lunar Studio.",
    "Sign in with the temporary password below, then change it from the account menu.",
    "",
    `Sign-in page: ${signInUrl}`,
    `Email: ${to}`,
    `Temporary password: ${tempPassword}`,
    "",
    "For your security, please change this password right after you sign in.",
    "",
    "— Lunar Studio",
  ].join("\n");
}

function renderInviteHtml({ name, tempPassword, signInUrl, to }: MemberInviteEmail): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(to);
  const safePassword = escapeHtml(tempPassword);
  const safeUrl = escapeHtml(signInUrl);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <h1 style="margin:0;font-size:18px;font-weight:600;">Lunar Studio</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Hi ${safeName},</p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">
                  An account has been created for you. Use the temporary password below to sign in,
                  then change it from the account menu.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                  <tr>
                    <td style="padding:16px 20px;font-size:13px;line-height:1.9;color:#3f3f46;">
                      <div><strong style="color:#18181b;">Email:</strong> ${safeEmail}</div>
                      <div><strong style="color:#18181b;">Temporary password:</strong>
                        <code style="font-size:14px;background:#ffffff;border:1px solid #e4e4e7;border-radius:4px;padding:2px 6px;">${safePassword}</code>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 4px;">
                <a href="${safeUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:10px 20px;border-radius:8px;">Sign in</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">
                  For your security, change this password right after you sign in. If you weren't
                  expecting this invitation, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
