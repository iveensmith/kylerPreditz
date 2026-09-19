/**
 * Result shape for admin form actions. Server actions that *throw* show visitors
 * Next's generic "This page couldn't load - a server error occurred" screen in
 * production (the real message is stripped). Admin actions return `{ error }`
 * for anything the admin can fix (validation, duplicate slug, ...) so the form
 * can show it inline and keep what was typed.
 */
export type ActionResult = { error: string } | { ok: string } | void;

/** Errors we raise on purpose - safe to show verbatim. */
export class UserFacingError extends Error {}

export function toActionError(e: unknown, fallback = "Something went wrong saving this. Please try again."): { error: string } {
  if (e instanceof UserFacingError) return { error: e.message };
  const code = (e as { code?: string } | null)?.code;
  if (code === "P2002") return { error: "That value is already in use (duplicate slug or reference)." };
  if (code === "P2025") return { error: "That record no longer exists - it may have been deleted." };
  console.error("[admin action]", e);
  return { error: fallback };
}
