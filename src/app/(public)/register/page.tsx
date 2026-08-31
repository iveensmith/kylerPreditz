"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/lib/actions/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";

const fieldClass =
  "rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";
const labelText = "font-mono text-[11px] uppercase tracking-wide text-faint";

function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/vip";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await registerUser({ email, password, confirm });
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);
    if (signInResult?.error) {
      setError("Account created — please sign in.");
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <>
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
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Password</span>
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
          <span className={labelText}>Confirm password</span>
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
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-20">
      <div>
        <div className="eyebrow mb-2">Membership</div>
        <h1 className="text-3xl leading-none">Create your account</h1>
        <p className="mt-3 text-sm text-muted">
          One account for Premium picks. You&apos;ll pick a plan and pay on the next step.
        </p>
      </div>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
