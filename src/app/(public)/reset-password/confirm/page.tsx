"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset } from "@/lib/actions/reset-password";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PageHeader } from "@/components/ui/PageHeader";

const fieldClass =
  "rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";
const labelText = "font-mono text-[11px] uppercase tracking-wide text-faint";

function ConfirmResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await confirmPasswordReset({ token, password, confirm });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/login?reset=success");
  }

  if (!token) {
    return <p className="text-sm text-loss">Missing reset token. Request a new link.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelText}>New password</span>
        <PasswordInput
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelText}>Confirm new password</span>
        <PasswordInput
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={fieldClass}
        />
      </label>
      {error && <p className="text-sm text-loss">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-[var(--radius-control)] bg-brand px-3 py-2.5 font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ConfirmResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-20">
      <PageHeader eyebrow="Account" title="Choose a new password" />
      <Suspense fallback={null}>
        <ConfirmResetForm />
      </Suspense>
      <p className="text-sm text-muted">
        <Link href="/login" className="text-brand underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
