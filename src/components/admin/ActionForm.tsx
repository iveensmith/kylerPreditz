"use client";

import { useState, useTransition, type ReactNode } from "react";
import { adminBtn } from "@/lib/admin-ui";
import type { ActionResult } from "@/lib/actions/result";

/**
 * Admin form wrapper: runs a server action without resetting the fields, shows
 * the action's `{ error }` / `{ ok }` inline, and disables the button while it
 * saves. (React's `<form action>` clears every field after a submit, which would
 * wipe a long blog post on a validation error.)
 */
export function ActionForm({
  action,
  submitLabel,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  className?: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error?: string; ok?: string } | null>(null);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setMessage(null);
        startTransition(async () => {
          try {
            const res = await action(formData);
            if (res && "error" in res) setMessage({ error: res.error });
            else if (res && "ok" in res) setMessage({ ok: res.ok });
          } catch (err) {
            // redirect() from the action surfaces as a framework signal - let it through.
            if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
            setMessage({ error: "The server could not complete that. Please try again." });
          }
        });
      }}
    >
      {children}
      {message?.error && (
        <p role="alert" className="rounded-[var(--radius-control)] border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">
          {message.error}
        </p>
      )}
      {message?.ok && (
        <p role="status" className="rounded-[var(--radius-control)] border border-win/40 bg-win/10 px-3 py-2 text-sm text-win">
          {message.ok}
        </p>
      )}
      <button type="submit" disabled={pending} className={adminBtn}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
