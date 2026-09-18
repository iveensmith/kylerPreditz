import { SITE_NAME } from "@/lib/seo";

function wrapper(bodyHtml: string): string {
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
    <p style="font-weight:700;font-size:18px;margin-bottom:24px">${SITE_NAME}</p>
    ${bodyHtml}
    <p style="color:#666;font-size:12px;margin-top:32px">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
}

export function verificationEmail(link: string): { subject: string; html: string } {
  return {
    subject: `Verify your email - ${SITE_NAME}`,
    html: wrapper(`
      <p>Confirm your email address to unlock premium purchases on ${SITE_NAME}.</p>
      <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Verify email</a></p>
      <p style="color:#666;font-size:13px">This link expires in 24 hours.</p>
    `),
  };
}

export function passwordResetEmail(link: string): { subject: string; html: string } {
  return {
    subject: `Reset your password - ${SITE_NAME}`,
    html: wrapper(`
      <p>We received a request to reset your ${SITE_NAME} password.</p>
      <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Reset password</a></p>
      <p style="color:#666;font-size:13px">This link expires in 1 hour and can only be used once.</p>
    `),
  };
}
