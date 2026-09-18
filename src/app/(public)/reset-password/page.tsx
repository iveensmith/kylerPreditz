"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/reset-password";
import { PageHeader } from "@/components/ui/PageHeader";

const fieldClass =
  "rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";
const labelText = "font-mono text-[11px] uppercase tracking-wide text-faint";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await requestPasswordReset(email);
    setSubmitting(false);
    // Always the same outcome shown, regardless of whether the account
    // exists - see requestPasswordReset's own doc comment.
    setSent(true);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-20">
      <div>
        <PageHeader eyebrow="Account" title="Reset your password" />
      </div>
      {sent ? (
        <p className="text-sm text-muted">
          If an account exists for that email, we&apos;ve sent a link to reset your password. It expires
          in 1 hour.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelText}>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-[var(--radius-control)] bg-brand px-3 py-2.5 font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="text-sm text-muted">
        <Link href="/login" className="text-brand underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
